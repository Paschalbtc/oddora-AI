import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// In-memory fallback cache if Supabase table is pending migration
let inMemoryTickets: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const userEmail = searchParams.get("email") || searchParams.get("user_email");
    const supabase = getSupabaseAdmin();

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

      const { data, error } = await query.limit(100);
      if (!error && data) {
        const normalized = data.map((t: any) => ({
          ...t,
          legs: Array.isArray(t.legs) ? t.legs : Array.isArray(t.legs_json) ? t.legs_json : [],
        }));
        return NextResponse.json({
          status: "success",
          source: "supabase",
          data: normalized,
        });
      }
    } catch {}

    // Fallback to in-memory tickets
    const filtered = inMemoryTickets.filter((t) => {
      if (userId && userEmail) {
        return t.user_id === userId || (t.user_email && t.user_email.toLowerCase() === userEmail.toLowerCase());
      }
      if (userId) return t.user_id === userId;
      if (userEmail) return t.user_email && t.user_email.toLowerCase() === userEmail.toLowerCase();
      return true;
    });

    return NextResponse.json({
      status: "success",
      source: "memory_fallback",
      data: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to fetch saved tickets." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();

    const ticketId = body.id || `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticketRecord = {
      id: ticketId,
      user_id: body.user_id || null,
      user_email: body.user_email || null,
      booking_code: body.booking_code || "SPORTY-CODE",
      total_odds: Number(body.total_odds) || 2.0,
      target_odds: body.target_odds ? Number(body.target_odds) : null,
      tier: body.tier || "FREE",
      title: body.title || "Oddora Accumulator Ticket",
      legs: body.legs || body.legs_json || [],
      status: body.status || "PENDING",
      source: body.source || "ODDORA_PLATFORM",
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try saving to Supabase user_saved_tickets table
    try {
      const { data, error } = await supabase
        .from("user_saved_tickets")
        .upsert([ticketRecord], { onConflict: "id" })
        .select();

      if (!error && data && data.length > 0) {
        const item = data[0];
        return NextResponse.json({
          status: "success",
          source: "supabase",
          data: {
            ...item,
            legs: Array.isArray(item.legs) ? item.legs : Array.isArray(item.legs_json) ? item.legs_json : [],
          },
        });
      }
    } catch {}

    // In-memory fallback
    const memoryTicket = {
      ...ticketRecord,
      legs: body.legs || body.legs_json || [],
    };
    inMemoryTickets = inMemoryTickets.filter((t) => t.id !== ticketId && t.booking_code !== ticketRecord.booking_code);
    inMemoryTickets.unshift(memoryTicket);
    inMemoryTickets = inMemoryTickets.slice(0, 200);

    return NextResponse.json({
      status: "success",
      source: "memory_fallback",
      data: memoryTicket,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to save ticket." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ status: "error", message: "ID is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    try {
      await supabase.from("user_saved_tickets").delete().eq("id", id);
    } catch {}

    inMemoryTickets = inMemoryTickets.filter((t) => t.id !== id);

    return NextResponse.json({ status: "success", deleted_id: id });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}

