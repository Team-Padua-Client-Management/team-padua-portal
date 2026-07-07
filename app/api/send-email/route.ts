/**
 * route.ts
 *
 * Main component module in features path: app/api/send-email/route.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import { NextResponse } from "next/server";
import React from "react";
import { resend } from "@/app/lib/resend/resend";
import WelcomeEmail from "@/app/components/emails/WelcomeEmail";

/**
 * Executes operations logic for sendEmail.
 *
 * @param toEmails: string[], name: string
 * @returns State operations sequence.
 */
async function sendEmail({ toEmails, name, subject, body }: { toEmails: string[], name: string, subject?: string, body?: string }) {
    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;

    if (!apiKey) {
        throw new Error("Missing RESEND_API_KEY");
    }

    if (!emailFrom) {
        throw new Error("Missing EMAIL_FROM");
    }

    if (body) {
        const textContent = body.replaceAll('{Client Name}', name);
        const emailSubject = (subject || "Warmest Birthday Wishes").replaceAll('{Client Name}', name);
        
        const htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ECECEC; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background-color: #F4C542; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #000; font-size: 24px;">Happy Birthday! 🎂</h1>
            </div>
            <div style="padding: 24px; background-color: #FFFDF2; color: #333; line-height: 1.6; font-size: 15px;">
              <p style="white-space: pre-wrap; margin: 0;">${textContent}</p>
            </div>
            <div style="background-color: #FFF; border-top: 1px solid #ECECEC; padding: 16px; text-align: center; font-size: 12px; color: #666;">
              <p style="margin: 0;">Sent by Sun Life Team Padua Client Management Portal</p>
            </div>
          </div>
        `;

        return await resend.emails.send({
            from: `Team Padua <${emailFrom}>`,
            to: toEmails,
            subject: emailSubject,
            html: htmlContent,
        });
    }

    return await resend.emails.send({
        from: `BIZDEVTEAM <${emailFrom}>`,
        to: toEmails,
        subject: "New Registration",
        react: React.createElement(WelcomeEmail, { name }),
    });
}

/**
 * Executes operations logic for GET.
 *
 * @param req: Request
 * @returns State operations sequence.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const name = searchParams.get("name") ?? "John Renz";
        const to = searchParams.get("to");
        const subject = searchParams.get("subject") ?? undefined;
        const body = searchParams.get("body") ?? undefined;

        const toEmails = to
            ? [to]
            : ["johnrenzbandianon.teampadua@gmail.com"];

        const { data, error } = await sendEmail({ toEmails, name, subject, body });

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    error,
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Email sent successfully.",
                data,
            },
            { status: 200 }
        );


    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * Executes operations logic for POST.
 *
 * @param req: Request
 * @returns State operations sequence.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));

        const name = body.name ?? "John Renz";
        const subject = body.subject ?? undefined;
        const textContent = body.body ?? undefined;

        const toEmails = body.to
            ? Array.isArray(body.to)
                ? body.to
                : [body.to]
            : ["johnrenzbandianon.teampadua@gmail.com"];

        const result = await sendEmail({ toEmails, name, subject, body: textContent });

        return NextResponse.json(
            {
                success: true,
                message: "Email sent successfully.",
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
