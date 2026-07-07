/**
 * route.ts
 *
 * Main component module in features path: app/api/chatbot/route.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { chatWithOllama } from "@/lib/ai/ollama";
import { ChatRequest } from "@/lib/types";

/**
 * Executes operations logic for POST.
 *
 * @param request: NextRequest
 * @returns State operations sequence.
 */
export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();

        if (!body.messages || body.messages.length === 0) {
            return NextResponse.json(
                {
                    error: "Messages are required.",
                },
                {
                    status: 400,
                }
            );
        }

        const reply = await chatWithOllama(body.messages);

        return NextResponse.json({
            reply,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to communicate with Ollama.",
            },
            {
                status: 500,
            }
        );
    }
}
