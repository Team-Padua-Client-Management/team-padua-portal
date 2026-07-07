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
            <Preview>Welcome to BIZDEVTEAM Membership Management System</Preview>
            <Body
                style={{
                    backgroundColor: "#f5f5f5",
                    padding: "40px 0",
                    fontFamily: "Arial, Helvetica, sans-serif",
                }}
            >
                <Container
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "1px solid #eeeeee",
                        maxWidth: "650px",
                        margin: "0 auto",
                    }}
                >
                    <Section
                        style={{
                            backgroundColor: "#FFD84D",
                            padding: "40px",
                        }}
                    >
                        <Heading
                            as="h1"
                            style={{
                                margin: 0,
                                color: "#2E2E2E",
                                fontSize: "34px",
                                fontWeight: "bold",
                            }}
                        >
                            BIZDEVTEAM
                        </Heading>
                        <Text
                            style={{
                                margin: "10px 0 0 0",
                                color: "#444444",
                                fontSize: "17px",
                            }}
                        >
                            Membership Management System
                        </Text>
                    </Section>

                    <Section
                        style={{
                            padding: "40px",
                        }}
                    >
                        <Heading
                            as="h2"
                            style={{
                                color: "#333333",
                                margin: "0 0 20px 0",
                                fontSize: "24px",
                            }}
                        >
                            Welcome, {name}
                        </Heading>
                        <Text
                            style={{
                                color: "#666666",
                                lineHeight: "28px",
                                fontSize: "16px",
                                margin: "0 0 16px 0",
                            }}
                        >
                            Thank you for registering to our Membership Management System.
                        </Text>
                        <Text
                            style={{
                                color: "#666666",
                                lineHeight: "28px",
                                fontSize: "16px",
                                margin: "0 0 30px 0",
                            }}
                        >
                            Your registration has been received successfully. Our administrators will review your application.
                        </Text>

                        <Section
                            style={{
                                backgroundColor: "#FFF9E8",
                                border: "1px solid #FFE28A",
                                borderRadius: "10px",
                                padding: "24px",
                                margin: "30px 0",
                            }}
                        >
                            <Heading
                                as="h3"
                                style={{
                                    margin: "0 0 12px 0",
                                    color: "#A97800",
                                    fontSize: "18px",
                                }}
                            >
                                What's Next?
                            </Heading>
                            <ul
                                style={{
                                    color: "#666666",
                                    paddingLeft: "20px",
                                    lineHeight: "28px",
                                    fontSize: "16px",
                                    margin: 0,
                                }}
                            >
                                <li style={{ marginBottom: "8px" }}>
                                    Wait for account approval.
                                </li>
                                <li style={{ marginBottom: "8px" }}>
                                    Check your email regularly.
                                </li>
                                <li>
                                    Login after your account has been approved.
                                </li>
                            </ul>
                        </Section>

                        <Section
                            style={{
                                textAlign: "center",
                                margin: "35px 0 10px 0",
                            }}
                        >
                            <Button
                                href="https://example.com"
                                style={{
                                    backgroundColor: "#FFD84D",
                                    color: "#333333",
                                    padding: "15px 35px",
                                    borderRadius: "50px",
                                    fontWeight: "bold",
                                    fontSize: "16px",
                                    textDecoration: "none",
                                    display: "inline-block",
                                }}
                            >
                                Visit Website
                            </Button>
                        </Section>
                    </Section>

                    <Section
                        style={{
                            backgroundColor: "#FFF7D8",
                            padding: "30px",
                            textAlign: "center",
                        }}
                    >
                        <Heading
                            as="h3"
                            style={{
                                margin: 0,
                                color: "#A97800",
                                fontSize: "16px",
                            }}
                        >
                            BIZDEVTEAM
                        </Heading>
                        <Text
                            style={{
                                color: "#777777",
                                fontSize: "14px",
                                lineHeight: "24px",
                                margin: "10px 0 0 0",
                            }}
                        >
                            Membership Management System
                            <br />
                            Powered by Next.js, Supabase & Resend
                        </Text>
                        <Hr
                            style={{
                                border: "0",
                                borderTop: "1px solid #E8E8E8",
                                margin: "25px 0",
                            }}
                        />
                        <Text
                            style={{
                                color: "#999999",
                                fontSize: "12px",
                                margin: 0,
                                lineHeight: "18px",
                            }}
                        >
                            © 2026 BIZDEVTEAM
                            <br />
                            This is an automated email. Please do not reply.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}
