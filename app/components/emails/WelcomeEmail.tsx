/**
 * WelcomeEmail.tsx
 *
 * Main component module in features path: app/components/emails/WelcomeEmail.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

//  C:\website\tp\app\components\emails\WelcomeEmail.tsx
 
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";

interface Props {
    name: string;
}

/**
 * WelcomeEmail
 *
 * Renders the WelcomeEmail interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for WelcomeEmail.
 *
 * @param { name }: Props
 * @returns State operations sequence.
 */
export default function WelcomeEmail({ name }: Props) {
    return (
        <Html>
            <Head />
            <Preview>Welcome to the Team Padua Management System!</Preview>
            <Body
                style={{
                    backgroundColor: "#f3f4f6",
                    padding: "45px 0",
                    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                }}
            >
                <Container
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "20px",
                        overflow: "hidden",
                        border: "1px solid #e5e7eb",
                        maxWidth: "600px",
                        margin: "0 auto",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                    }}
                >
                    {/* Header Banner with Premium Gradient */}
                    <Section
                        style={{
                            background: "linear-gradient(135deg, #F4C542 0%, #E2B229 100%)",
                            padding: "45px 40px",
                            textAlign: "center",
                        }}
                    >
                        <Heading
                            as="h1"
                            style={{
                                margin: 0,
                                color: "#111827",
                                fontSize: "36px",
                                fontWeight: "800",
                                letterSpacing: "-0.05em",
                                lineHeight: "1.1",
                            }}
                        >
                            Team Padua
                        </Heading>
                        <Text
                            style={{
                                margin: "8px 0 0 0",
                                color: "#374151",
                                fontSize: "16px",
                                fontWeight: "600",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                            }}
                        >
                            Client Management Portal
                        </Text>
                    </Section>

                    {/* Main Content Area */}
                    <Section
                        style={{
                            padding: "40px",
                        }}
                    >
                        <Heading
                            as="h2"
                            style={{
                                color: "#111827",
                                margin: "0 0 20px 0",
                                fontSize: "24px",
                                fontWeight: "700",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Welcome, {name}! 🎉
                        </Heading>
                        <Text
                            style={{
                                color: "#4b5563",
                                lineHeight: "1.75",
                                fontSize: "16px",
                                margin: "0 0 16px 0",
                            }}
                        >
                            Thank you for registering to our Client Management System. We are thrilled to welcome you to the platform.
                        </Text>
                        <Text
                            style={{
                                color: "#4b5563",
                                lineHeight: "1.75",
                                fontSize: "16px",
                                margin: "0 0 30px 0",
                            }}
                        >
                            Your registration has been successfully received. Our system administrators will review your application credentials and activate your dashboard shortly.
                        </Text>

                        {/* Onboarding Checklist Box */}
                        <Section
                            style={{
                                backgroundColor: "#FFFBEB",
                                border: "1px solid #FDE68A",
                                borderRadius: "14px",
                                padding: "28px",
                                margin: "30px 0",
                            }}
                        >
                            <Heading
                                as="h3"
                                style={{
                                    margin: "0 0 16px 0",
                                    color: "#92400E",
                                    fontSize: "18px",
                                    fontWeight: "700",
                                }}
                            >
                                What to expect next?
                            </Heading>
                            <ul
                                style={{
                                    color: "#4b5563",
                                    paddingLeft: "20px",
                                    lineHeight: "1.8",
                                    fontSize: "15px",
                                    margin: 0,
                                }}
                            >
                                <li style={{ marginBottom: "10px" }}>
                                    <strong style={{ color: "#111827" }}>Account Approval</strong>: Administrators will verify your role alignment and approve permissions.
                                </li>
                                <li style={{ marginBottom: "10px" }}>
                                    <strong style={{ color: "#111827" }}>Check Your Inbox</strong>: You will receive an automated confirmation email once active.
                                </li>
                                <li>
                                    <strong style={{ color: "#111827" }}>Sign In & Explore</strong>: Log in to sync your calendar, manage clients, and track portals!
                                </li>
                            </ul>
                        </Section>

                        {/* Premium Button */}
                        <Section
                            style={{
                                textAlign: "center",
                                margin: "35px 0 10px 0",
                            }}
                        >
                            <Button
                                href="https://example.com"
                                style={{
                                    backgroundColor: "#111827",
                                    color: "#ffffff",
                                    padding: "16px 36px",
                                    borderRadius: "12px",
                                    fontWeight: "700",
                                    fontSize: "15px",
                                    textDecoration: "none",
                                    display: "inline-block",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                }}
                            >
                                Go to Workspace
                            </Button>
                        </Section>
                    </Section>

                    {/* Footer */}
                    <Section
                        style={{
                            backgroundColor: "#f9fafb",
                            padding: "30px 40px",
                            textAlign: "center",
                            borderTop: "1px solid #f3f4f6",
                        }}
                    >
                        <Heading
                            as="h4"
                            style={{
                                margin: 0,
                                color: "#374151",
                                fontSize: "15px",
                                fontWeight: "700",
                            }}
                        >
                            Team Padua System Node
                        </Heading>
                        <Text
                            style={{
                                color: "#9ca3af",
                                fontSize: "13px",
                                lineHeight: "1.6",
                                margin: "8px 0 0 0",
                            }}
                        >
                            Powered by Next.js, Supabase & Resend
                        </Text>
                        <Hr
                            style={{
                                border: "0",
                                borderTop: "1px solid #e5e7eb",
                                margin: "20px 0",
                            }}
                        />
                        <Text
                            style={{
                                color: "#9ca3af",
                                fontSize: "12px",
                                margin: 0,
                                lineHeight: "1.6",
                            }}
                        >
                            © 2026 Team Padua Operations
                            <br />
                            This is an automated transmission. Please do not reply directly to this mail.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}
