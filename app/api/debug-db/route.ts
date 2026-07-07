/**
 * route.ts
 *
 * Main component module in features path: app/api/debug-db/route.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabase/admin";

/**
 * Executes operations logic for GET.
 *
 * 
 * @returns State operations sequence.
 */
export async function GET() {
  try {
    // Check if we can run an RPC or query Postgres system tables
    // We can query the pg_indexes or information_schema tables
    const { data, error } = await supabaseAdmin
      .from('message_reads')
      .select('*')
      .limit(1);

    // Let's run a query on pg_indexes to see the indexes for message_reads
    // Since we don't have direct SQL runner, let's select from a custom query if possible?
    // Wait, PostgREST doesn't expose pg_indexes by default, but let's check if we get an error or something
    // Or we can try to fetch from information_schema via RPC if one exists, but probably not.
    // Let's try to do an insert to message_reads without upsert to see if it succeeds.
    // If it succeeds or fails, let's see.
    const { error: insertError } = await supabaseAdmin
      .from('message_reads')
      .insert({
        message_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        read_at: new Date().toISOString()
      });

    return NextResponse.json({
      insertError: insertError ? {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      } : "Insert succeeded"
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
