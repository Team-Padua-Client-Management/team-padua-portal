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
          <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
            <!-- Celebratory Banner with Gradient -->
            <div style="background: linear-gradient(135deg, #F4C542 0%, #E2B229 100%); padding: 40px 20px; text-align: center; color: #111827;">
              <span style="font-size: 40px; display: inline-block; margin-bottom: 8px;">🎂</span>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.04em;">Happy Birthday, ${name}!</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #374151;">Warm Wishes From Team Padua</p>
            </div>
            
            <!-- Message Body -->
            <div style="padding: 40px; background-color: #FFFDF5; color: #374151; line-height: 1.8; font-size: 16px; border-bottom: 1px solid #f3f4f6;">
              <p style="white-space: pre-wrap; margin: 0; font-size: 16px; color: #4b5563;">${textContent}</p>
            </div>
            
            <!-- Footer Details -->
            <div style="background-color: #f9fafb; padding: 25px 20px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.5;">
              <p style="margin: 0; font-weight: 600; color: #6b7280; font-size: 13px;">Sun Life • Team Padua Client Management Portal</p>
              <p style="margin: 5px 0 0 0;">This is an automated birthday greeting. Please do not reply directly to this mail.</p>
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
