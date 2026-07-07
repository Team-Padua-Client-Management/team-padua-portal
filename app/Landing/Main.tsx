"use client";

/**
 * Main.tsx
 *
 * Main component module in features path: app/Landing/Main.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/landing/Main.module.css";

// ======================================================
// State Initialization & Hooks
// ======================================================

// ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Shield,
  Users,
  Zap,
  ClipboardList,
  CalendarCheck,
  Building2,
  Megaphone,
  Layers,
  Gamepad2,
  Paintbrush,
  MessageSquare,
  HelpCircle,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  ChevronDown,
  Play,
  CheckCircle2,
  Clock,
  Crown,
  Briefcase,
  Headphones,
  Palette
} from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";

type PortalStats = {
  members: number;
  sectors: number;
  attendanceToday: number;
};

type ActivityLog = {
  time: string;
  desc: string;
};

/**
 * HomePage
 *
 * Renders the HomePage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for HomePage.
 *
 * 
 * @returns State operations sequence.
 */
export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PortalStats>({
    members: 0,
    sectors: 0,
    attendanceToday: 0
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "attendance">("dashboard");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    /**
 * Executes operations logic for fetchPortalData.
 *
 * 
 * @returns State operations sequence.
 */
    const fetchPortalData = async () => {
      setLoading(true);
      try {
        const { count: mCount } = await /* Query database records from active repository grid */ supabase.from("profiles").select("*", { count: "exact", head: true });
        const { count: aCount } = await /* Query database records from active repository grid */ supabase.from("attendance").select("*", { count: "exact", head: true }).eq("attendance_date", new Date().toISOString().split("T")[0]);

        const { data: profiles } = await /* Query database records from active repository grid */ supabase.from("profiles").select("department");
        const uniqueDepts = Array.from(new Set((profiles || []).map(p => p.department || "General")));

        setStats({
          members: mCount || 0,
          sectors: uniqueDepts.length || 0,
          attendanceToday: aCount || 0
        });

        setDepartments(uniqueDepts);

        setActivities([
          { time: "System", desc: "Secure database core grid is online" }
        ]);

      } catch (e) { }
      setLoading(false);
    };

    fetchPortalData();
  }, []);

  const founder = {
    name: "Daniel Padua",
    role: "Founder & Operations Lead",
    description: "Visionary leader responsible for business growth, mentorship, team development, and operational excellence.",
    image: "/Image/padua.jpg"
  };

  const leaders = [
    {
      name: "Triwynn Branzuela",
      role: "Senior Team Mentor",
      description: "Provides leadership guidance, operational support, and intern mentorship.",
      image: "/Image/triwynn.jpg"
    },
    {
      name: "Isabel Francisco",
      role: "Senior Team Coordinator",
      description: "Supports recruitment, coordination, onboarding, and team development.",
      image: "/Image/isabel.png"
    }
  ];

  const departmentsList = [
    {
      code: "ASA",
      title: "Advisor Support Associate",
      icon: Briefcase,
      description: "Administrative support, documentation, tracking systems, and operations.",
      members: ["John Renz Bandianon", "Marilyn Cantada"]
    },
    {
      code: "BSA",
      title: "Business Support Associate",
      icon: Users,
      description: "Client onboarding, proposals, requirements gathering, and business support.",
      members: ["Trisha Mae De la Cruz", "Divine Valerie Reyes"]
    },
    {
      code: "CRA",
      title: "Client Relations Associate",
      icon: Headphones,
      description: "Client servicing, communication, relationship management, and support.",
      members: ["Lorena Isabel Dela Cruz", "Krystel Joy Kapangyarihan"]
    },
    {
      code: "DCA",
      title: "Design Content Associate",
      icon: Palette,
      description: "Branding, graphics, multimedia production, and marketing content.",
      members: ["Dan Andrew Asis", "Jazz Princess Noveno"]
    }
  ];

  const faqs = [
    {
      q: "What is the Team Padua Client Management & Operations Portal?",
      a: "TeamPadua is a unified hub built for Sun Life to streamline client management and intern operations. It provides automated attendance tracking, task queues, training playgrounds, and communication tools in one centralized workspace."
    },
    {
      q: "How does the real-time attendance tracking work?",
      a: "For the current date, the portal functions as an automated terminal. Interns log Time In, Breaks, and Time Out with a single click. The system secures logs directly into Supabase, automatically calculates total hours, and hosts an admin feedback loop."
    },
    {
      q: "What is the Training Playground?",
      a: "The Training Playground is a gamified node featuring interactive training games like Memory Match, Speed Type Race, Trivia, and Client Simulators. It turns routine learning into a competitive, high-engagement workspace complete with live leaderboards."
    },
    {
      q: "How is my profile data and verification secured?",
      a: "Each account features an integrated security center with two-factor authentication toggles, verified OAuth providers, and a custom visual QR Code card. This QR Code serves as a secure physical ledger verification placeholder for supervisors."
    }
  ];

  return (
    <div className={styles.text_0}>
      <header className={styles.div_1}>
        <div className={styles.container_2}>
          <a href="/" className={styles.container_3}>
            <div className={styles.text_4}>
              <span className={styles.text_5}>TP</span>
            </div>
            <div>
              <p className={styles.table_6}>TeamPadua</p>
              <p className={styles.text_7}>Sun Life Philippines</p>
            </div>
          </a>

          <nav className={styles.table_8}>
            <a href="#features" className={styles.table_9}>Features</a>
            <a href="#how-it-works" className={styles.table_10}>How It Works</a>
            <a href="#leadership" className={styles.table_11}>Leadership</a>
            <a href="#sectors" className={styles.table_12}>Sectors</a>
            <a href="#preview" className={styles.table_13}>Preview</a>
            <a href="#faq" className={styles.table_14}>FAQ</a>
          </nav>

          <div className={styles.container_15}>
            <a
              href="/auth/login"
              className={styles.table_16}
            >
              Sign In
            </a>

          </div>
        </div>
      </header>

      <main className={styles.container_17}>
        <section className={styles.container_18}>
          <div className={styles.div_19}>
            <div className={styles.container_20}>
              <span className={styles.div_21} />
              <span className={styles.table_22}>
                TeamPadua Workspace Operations
              </span>
            </div>
            <h1 className={styles.table_23}>
              Team Padua <span className={styles.text_24}>Client Management & Operations</span>
            </h1>

            <p className={styles.text_25}>
              A comprehensive system designed for Sun Life Team Padua to orchestrate client management, automate intern operations, track real-time attendance, and streamline workflows.
            </p>
            <div className={styles.container_26}>
              <a
                href="/dashboard"
                className={`${styles.table_27} group`}
              >
                Get Started
                <ChevronRight className={`${styles.table_28} group`} />
              </a>
              <a
                href="/auth/login"
                className={styles.table_29}
              >
                Access Credentials
              </a>
            </div>
          </div>

          <div className={styles.div_30}>
            <div className={styles.div_31} />
            <div className={styles.container_32}>
              <div className={styles.container_33}>
                <span className={styles.div_34} />
                <span className={styles.div_35} />
                <span className={styles.div_36} />
              </div>
              <span className={styles.table_37}>Operations Center</span>
            </div>
            <div className={styles.div_38}>
              <div className={styles.container_39}>
                <div>
                  <h3 className={styles.table_40}>Active Dashboard</h3>
                  <p className={styles.text_41}>ACTIVE SESSION</p>
                </div>
                <span className={styles.div_42} />
              </div>
              <div className={styles.container_43}>
                <div className={styles.text_44}>
                  <p className={styles.text_45}>Attendance Rate</p>
                  <p className={styles.text_46}>98%</p>
                </div>
                <div className={styles.text_47}>
                  <p className={styles.text_48}>Hours Logged</p>
                  <p className={styles.text_49}>42.5h</p>
                </div>
                <div className={styles.text_50}>
                  <p className={styles.text_51}>System Rank</p>
                  <p className={styles.text_52}>#2</p>
                </div>
              </div>
              <div className={styles.div_53}>
                <p className={styles.text_54}>Current Directive</p>
                <div className={styles.text_55}>
                  <span className={styles.table_56}>Verify Session Credentials</span>
                  <span className={styles.text_57}>SECURE</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.div_58}>
          <div className={styles.text_59}>
            {[
              { label: "Active Associates", val: loading ? "..." : stats.members, desc: "Registered Profiles", icon: Users },
              { label: "Operational Sectors", val: loading ? "..." : stats.sectors, desc: "Roster Groups", icon: Building2 },
              { label: "Attendance Today", val: loading ? "..." : stats.attendanceToday, desc: "Roster Presence", icon: CalendarCheck }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className={styles.div_60}>
                  <div className={styles.text_61}>
                    <Icon size={14} className={styles.text_62} />
                    <span className={styles.table_63}>{kpi.label}</span>
                  </div>
                  <h3 className={styles.table_64}>{kpi.val}</h3>
                  <p className={styles.table_65}>{kpi.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="features" className={styles.div_66}>
          <div className={styles.text_67}>
            <h2 className={styles.table_68}>
              Designed For Modern Enterprise Workspaces
            </h2>
            <p className={styles.text_69}>
              Explore the core modules and functional capabilities engineered into the TeamPadua system.
            </p>
          </div>

          <div className={styles.container_70}>
            {[
              {
                title: "Real-time Attendance",
                desc: "Automated check-in, check-out, and break tracking tailored to the current date, complete with total hours calculation and admin feedback.",
                icon: CalendarCheck,
                badge: "AUTOMATED"
              },
              {
                title: "Creative Design Studio",
                desc: "A built-in Canva-style layer manager featuring interactive canvas rendering, custom text styles, and draggable properties.",
                icon: Paintbrush,
                badge: "STUDIO UTILLITY"
              },
              {
                title: "Training Playground",
                desc: "Interactive learning games like Speed Type Race, Memory Match, and Trivia, complete with live leaderboards to track performance.",
                icon: Gamepad2,
                badge: "GAMIFIED NODE"
              },
              {
                title: "Direct Communication",
                desc: "Centralized chat feeds, targeted audience bulletins, and structured FAQs that keep members in constant sync.",
                icon: MessageSquare,
                badge: "REAL-TIME"
              },
              {
                title: "Secure Verification Profile",
                desc: "Equipped with custom AI avatar seeds, two-factor authentication, provider indicators, and unique placeholder QR ledger cards.",
                icon: Shield,
                badge: "SECURITY GATE"
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className={`${styles.table_71} group`}>
                  <div className={styles.div_72}>
                    <div className={styles.container_73}>
                      <div className={`${styles.table_74} group`}>
                        <Icon size={16} className={styles.text_75} />
                      </div>
                      <span className={styles.text_76}>
                        {feature.badge}
                      </span>
                    </div>
                    <div className={styles.div_77}>
                      <h3 className={styles.table_78}>{feature.title}</h3>
                      <p className={styles.text_79}>{feature.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className={styles.div_80}>
          <div className={styles.div_81}>
            <div className={styles.text_82}>
              <h2 className={styles.table_83}>
                How It Works
              </h2>
              <p className={styles.text_84}>
                Get authenticated and start managing your operational workflow in four simple steps.
              </p>
            </div>

            <div className={styles.container_85}>
              {[
                { step: "01", title: "Sign In", desc: "Access the platform securely using Google OAuth, GitHub, or your email credentials." },
                { step: "02", title: "Complete Profile", desc: "Set your details, toggle security settings, and generate your custom AI verification avatar." },
                { step: "03", title: "Access Dashboard", desc: "Enter your role-scoped dashboard to view live operational stats and active widgets." },
                { step: "04", title: "Manage Workflow", desc: "Punch daily attendance, complete queued tasks, and collaborate with team members in real-time." }
              ].map((item, idx) => (
                <div key={idx} className={styles.div_86}>
                  <span className={styles.text_87}>{item.step}</span>
                  <div className={styles.div_88}>
                    <h3 className={styles.table_89}>{item.title}</h3>
                    <p className={styles.text_90}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="leadership" className={styles.div_91}>
          <div className={styles.text_92}>
            <h2 className={styles.table_93}>
              Meet Our Leadership
            </h2>
            <p className={styles.text_94}>
              The operational minds behind business growth, guidance, and cohort coordination.
            </p>
          </div>

          <div className={styles.table_95}>
            <div className={styles.table_96}>
              <div className={styles.div_97} />
              <div className={styles.div_98}>
                <div className={styles.div_99}>
                  <img src={founder.image} alt={founder.name} className={styles.div_100} />
                </div>
                <div className={styles.div_101}>
                  <span className={styles.text_102}>
                    Operations Lead
                  </span>
                  <h3 className={styles.text_103}>{founder.name}</h3>
                  <p className={styles.text_104}>{founder.role}</p>
                </div>
                <p className={styles.text_105}>{founder.description}</p>
              </div>
            </div>

            <div className={styles.table_106}>
              {leaders.map((leader, idx) => (
                <div key={idx} className={styles.table_107}>
                  <div className={styles.div_108}>
                    <div className={styles.div_109}>
                      <img src={leader.image} alt={leader.name} className={styles.div_110} />
                    </div>
                    <div className={styles.div_111}>
                      <span className={styles.text_112}>
                        Senior Leader
                      </span>
                      <h3 className={styles.text_113}>{leader.name}</h3>
                      <p className={styles.text_114}>{leader.role}</p>
                    </div>
                    <p className={styles.text_115}>{leader.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="sectors" className={styles.div_116}>
          <div className={styles.div_117}>
            <div className={styles.text_118}>
              <h2 className={styles.table_119}>
                Operational Sectors & Roster
              </h2>
              <p className={styles.text_120}>
                A professional map of our structured cohort departments and active associate members.
              </p>
            </div>

            <div className={styles.container_121}>
              {departmentsList.map((dept, idx) => {
                const Icon = dept.icon;
                return (
                  <div key={idx} className={styles.table_122}>
                    <div className={styles.div_123}>
                      <div className={styles.container_124}>
                        <div className={styles.container_125}>
                          <Icon size={15} className={styles.text_126} />
                        </div>
                        <span className={styles.text_127}>
                          {dept.code}
                        </span>
                      </div>
                      <div className={styles.div_128}>
                        <h3 className={styles.table_129}>{dept.title}</h3>
                        <p className={styles.text_130}>{dept.description}</p>
                      </div>
                    </div>
                    <div className={styles.div_131}>
                      <p className={styles.text_132}>Assigned Personnel</p>
                      <div className={styles.container_133}>
                        {dept.members.map((member, mIdx) => (
                          <span key={mIdx} className={styles.text_134}>
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="preview" className={styles.div_135}>
          <div className={styles.text_136}>
            <h2 className={styles.table_137}>
              Experience The Workspace Interface
            </h2>
            <p className={styles.text_138}>
              Toggle between actual system modules to preview the premium, gold-highlighted dashboards.
            </p>
          </div>

          <div className={styles.div_139}>
            <div className={styles.container_140}>
              {[
                { id: "dashboard", label: "Dashboard Overview", icon: Layers },
                { id: "attendance", label: "Attendance Punch", icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${styles.table_205} ${active
                      ? "bg-[#FFF7D6] border border-[#F4C542]/40 text-[#A3843B]"
                      : "text-zinc-500 hover:text-black hover:bg-zinc-50"
                      }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.container_141}>
              {activeTab === "dashboard" && (
                <div className={styles.div_142}>
                  <div className={styles.container_143}>
                    <div>
                      <h3 className={styles.table_144}>Workspace Analytics</h3>
                      <p className={styles.text_145}>Real-time summary of intern activities</p>
                    </div>
                    <span className={styles.text_146}>
                      Verified Secure
                    </span>
                  </div>
                  <div className={styles.container_147}>
                    <div className={styles.div_148}>
                      <p className={styles.text_149}>Associate Presence</p>
                      <h4 className={styles.text_150}>100% Present</h4>
                      <div className={styles.div_151}>
                        <div className={styles.div_152} />
                      </div>
                    </div>
                    <div className={styles.div_153}>
                      <p className={styles.text_154}>Tasks In Progress</p>
                      <h4 className={styles.text_155}>4 Active Tasks</h4>
                      <div className={styles.div_156}>
                        <div className={styles.div_157} />
                      </div>
                    </div>
                    <div className={styles.div_158}>
                      <p className={styles.text_159}>Server Response Time</p>
                      <h4 className={styles.text_160}>12ms Response</h4>
                      <div className={styles.div_161}>
                        <div className={styles.div_162} />
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {activeTab === "attendance" && (
                <div className={styles.div_163}>
                  <div className={styles.container_164}>
                    <div>
                      <h3 className={styles.table_165}>Attendance Tracking</h3>
                      <p className={styles.text_166}>Log your daily attendance</p>
                    </div>
                    <span className={styles.text_167}>
                      Punch Clock
                    </span>
                  </div>
                  <div className={styles.container_168}>
                    <div className={styles.text_169}>
                      <div className={styles.table_170}>09:00:00 AM</div>
                      <p className={styles.text_171}>SATURDAY, JUNE 27, 2026</p>
                    </div>
                    <div className={styles.container_172}>
                      <button className={styles.table_173}>
                        Punch Time In
                      </button>
                      <button disabled className={styles.table_174}>
                        Break Out
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.text_175}>
                <span>Database Connection Status</span>
                <span>Connected Successfully</span>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className={styles.div_176}>
          <div className={styles.div_177}>
            <div className={styles.text_178}>
              <h2 className={styles.table_179}>
                Frequently Asked Questions
              </h2>
              <p className={styles.text_180}>
                Got questions about Padua? Explore our quick answers.
              </p>
            </div>

            <div className={styles.div_181}>
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className={styles.table_182}>
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className={styles.table_183}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={16} className={`${styles.table_206} ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`${styles.table_207} ${isOpen ? "max-h-40 border-t border-[#ECECEC]" : "max-h-0"}`}>
                      <p className={styles.text_184}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.div_185}>
          <div className={styles.text_186}>
            <div className={styles.div_187} />
            <h2 className={styles.text_188}>
              Ready to Access the Operations Portal?
            </h2>
            <p className={styles.text_189}>
              Sign in now to punch your attendance, check bulletins, and explore the gamified training node.
            </p>
            <div className={styles.div_190}>
              <a
                href="/auth/login"
                className={styles.table_191}
              >
                Sign In to System
                <ArrowRight className={styles.div_192} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.div_193}>
        <div className={styles.container_194}>
          <a href="/" className={styles.container_195}>
            <div className={styles.text_196}>
              <span className={styles.text_197}>TP</span>
            </div>
            <span className={styles.text_198}>TeamPadua</span>
          </a>

          <div className={styles.table_199}>
            <a href="/privacy" className={styles.table_200}>Privacy Policy</a>
            <a href="/terms" className={styles.table_201}>Terms of Service</a>
            <a href="/docs" className={styles.table_202}>Documentation</a>
            <a href="/contact" className={styles.table_203}>Contact</a>
          </div>

          <p className={styles.text_204}>
            &copy; {new Date().getFullYear()} TeamPadua. Built for Sun Life Team Padua.
          </p>
        </div>
      </footer>
    </div>
  );
}
