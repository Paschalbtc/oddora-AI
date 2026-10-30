import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// In-memory fallback cache if Supabase table is pending migration
let inMemoryTickets: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const supabase = getSupabaseAdmin();

    try {
      let query = supabase
        .from("user_saved_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.limit(50);
      if (!error && data) {
        return NextResponse.json({
          status: "success",
          source: "supabase",
          data,
        });
      }
    } catch {}

    // Fallback to in-memory tickets
    const filtered = userId
      ? inMemoryTickets.filter((t) => t.user_id === userId)
      : inMemoryTickets;

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

    const ticketRecord = {
      user_id: body.user_id || null,
      user_email: body.user_email || null,
      booking_code: body.booking_code || "SPORTY-CODE",
      total_odds: Number(body.total_odds) || 2.0,
      target_odds: body.target_odds ? Number(body.target_odds) : null,
      tier: body.tier || "FREE",
      title: body.title || "Oddora Accumulator Ticket",
      legs_json: body.legs || [],
      status: body.status || "PENDING",
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try saving to Supabase user_saved_tickets table
    try {
      const { data, error } = await supabase
        .from("user_saved_tickets")
        .insert([ticketRecord])
        .select();

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          status: "success",
          source: "supabase",
          data: data[0],
        });
      }
    } catch {}

    // In-memory fallback
    const memoryTicket = {
      id: body.id || `ticket_${Date.now()}`,
      ...ticketRecord,
      legs: body.legs || [],
    };
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

