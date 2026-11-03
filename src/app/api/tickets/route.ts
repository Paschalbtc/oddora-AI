import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory fallback if Supabase table is pending creation
let memoryTicketsStore: any[] = [];

function normalizeTicketLegs(t: any) {
  let legs = t.legs;
  if (!legs && t.legs_json) legs = t.legs_json;
  if (typeof legs === "string") {
    try {
      legs = JSON.parse(legs);
    } catch {
      legs = [];
    }
  }
  return Array.isArray(legs) ? legs : [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || searchParams.get("userId");
    const rawEmail = searchParams.get("email") || searchParams.get("user_email") || searchParams.get("userEmail");
    const userEmail = rawEmail ? rawEmail.toLowerCase().trim() : "";

    const supabase = getSupabaseAdmin();

    const ticketsMap = new Map<string, any>();
    let cloudDraftSlip: any[] | null = null;

    // 1. Fetch from public.user_saved_tickets table (Service Role Client - Bypasses RLS)
    try {
      let query = supabase
        .from("user_saved_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId && userEmail) {
        query = query.or(`user_id.eq.${userId},user_email.ilike.${userEmail}`);
      } else if (userId) {
        query = query.eq("user_id", userId);
      } else if (userEmail) {
        query = query.ilike("user_email", userEmail);
      }

      const { data: dbTickets, error } = await query.limit(150);
      if (!error && Array.isArray(dbTickets)) {
        dbTickets.forEach((t) => {
          const key = t.id || t.booking_code;
          ticketsMap.set(key, {
            ...t,
            legs: normalizeTicketLegs(t),
          });
        });
      }
    } catch (tableErr) {
      console.warn("Notice: user_saved_tickets table query fallback:", tableErr);
    }

    // 2. Fetch from Supabase Auth user_metadata (Universal cloud sync across all devices)
    if (userId) {
      try {
        const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
        if (!authErr && authUser?.user?.user_metadata) {
          const meta = authUser.user.user_metadata;
          if (Array.isArray(meta.saved_tickets)) {
            meta.saved_tickets.forEach((t: any) => {
              const key = t.id || t.booking_code;
              if (!ticketsMap.has(key)) {
                ticketsMap.set(key, {
                  ...t,
                  legs: normalizeTicketLegs(t),
                });
              }
            });
          }
          if (Array.isArray(meta.active_draft_slip)) {
            cloudDraftSlip = meta.active_draft_slip;
          }
        }
      } catch (authMetaErr) {
        console.warn("Notice: user_metadata sync check:", authMetaErr);
      }
    }

    // 3. Merge with in-memory buffer matching userId / userEmail
    memoryTicketsStore.forEach((t) => {
      const match =
        (userId && t.user_id === userId) ||
        (userEmail && t.user_email && t.user_email.toLowerCase() === userEmail);
      if (match) {
        const key = t.id || t.booking_code;
        if (!ticketsMap.has(key)) {
          ticketsMap.set(key, {
            ...t,
            legs: normalizeTicketLegs(t),
          });
        }
      }
    });

    const combined = Array.from(ticketsMap.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json({
      status: "success",
      source: "supabase_cloud_sync",
      data: combined,
      draftSlip: cloudDraftSlip,
      count: combined.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to load cloud tickets." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = getSupabaseAdmin();

    // Case A: Sync Active Floating Draft Slip across devices
    if (body.action === "save_draft") {
      const userId = body.userId || body.user_id;
      const draftLegs = Array.isArray(body.legs) ? body.legs : [];

      if (userId) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          const currentMeta = authUser?.user?.user_metadata || {};
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...currentMeta,
              active_draft_slip: draftLegs,
              active_draft_updated_at: new Date().toISOString(),
            },
          });
        } catch {}
      }
      return NextResponse.json({ status: "success", draftSaved: true });
    }

    // Case B: Save / Upsert Tickets (Single ticket or Bulk array)
    const incomingTickets: any[] = Array.isArray(body.tickets)
      ? body.tickets
      : Array.isArray(body)
      ? body
      : body.ticket
      ? [body.ticket]
      : [body];

    const processedTickets: any[] = [];

    for (const raw of incomingTickets) {
      if (!raw || (!raw.booking_code && !raw.id && !raw.legs)) continue;

      const ticketId = raw.id || `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const resolvedUserId = raw.user_id || raw.userId || body.userId || body.user_id || null;
      const rawEmail = raw.user_email || raw.userEmail || body.userEmail || body.user_email || null;
      const resolvedUserEmail = rawEmail ? String(rawEmail).toLowerCase().trim() : null;
      const bookingCode = raw.booking_code || raw.share_code || raw.sporty_code || "SPORTY-CODE";

      const record = {
        id: ticketId,
        user_id: resolvedUserId,
        user_email: resolvedUserEmail,
        booking_code: bookingCode,
        total_odds: Number(raw.total_odds) || 2.0,
        target_odds: raw.target_odds ? Number(raw.target_odds) : null,
        tier: raw.tier || "FREE",
        title: raw.title || "Oddora Accumulator Ticket",
        legs: normalizeTicketLegs(raw),
        status: (raw.status || "PENDING").toUpperCase(),
        source: raw.source || "ODDORA_PLATFORM",
        payout: raw.payout ? Number(raw.payout) : null,
        created_at: raw.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Attempt upsert into public.user_saved_tickets (Service Role)
      try {
        await supabase
          .from("user_saved_tickets")
          .upsert([record], { onConflict: "id" });
      } catch (upsertErr) {
        console.warn("user_saved_tickets upsert notice:", upsertErr);
      }

      // 2. Sync into Supabase Auth user_metadata for cross-device cloud persistence
      if (resolvedUserId) {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(resolvedUserId);
          const currentMeta = authUser?.user?.user_metadata || {};
          const existingList: any[] = Array.isArray(currentMeta.saved_tickets) ? currentMeta.saved_tickets : [];

          // Deduplicate by id or booking code
          const mergedMetaList = [
            record,
            ...existingList.filter((x: any) => x.id !== record.id && x.booking_code !== record.booking_code),
          ].slice(0, 100);

          await supabase.auth.admin.updateUserById(resolvedUserId, {
            user_metadata: {
              ...currentMeta,
              saved_tickets: mergedMetaList,
            },
          });
        } catch (metaErr) {
          console.warn("Auth user_metadata tickets update notice:", metaErr);
        }
      }

      // 3. Maintain memory ring buffer
      memoryTicketsStore = memoryTicketsStore.filter((x) => x.id !== record.id && x.booking_code !== record.booking_code);
      memoryTicketsStore.unshift(record);
      if (memoryTicketsStore.length > 500) {
        memoryTicketsStore = memoryTicketsStore.slice(0, 500);
      }

      processedTickets.push(record);
    }

    return NextResponse.json({
      status: "success",
      source: "supabase_cloud_sync",
      count: processedTickets.length,
      data: processedTickets.length === 1 ? processedTickets[0] : processedTickets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to save tickets to cloud." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("user_id") || searchParams.get("userId");

    if (!id) {
      return NextResponse.json({ status: "error", message: "ID is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    try {
      await supabase.from("user_saved_tickets").delete().eq("id", id);
    } catch {}

    if (userId) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        const currentMeta = authUser?.user?.user_metadata || {};
        if (Array.isArray(currentMeta.saved_tickets)) {
          const filtered = currentMeta.saved_tickets.filter((x: any) => x.id !== id);
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { ...currentMeta, saved_tickets: filtered },
          });
        }
      } catch {}
    }

    memoryTicketsStore = memoryTicketsStore.filter((t) => t.id !== id);

    return NextResponse.json({ status: "success", deleted_id: id });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
