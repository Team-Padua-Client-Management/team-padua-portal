/**
 * departments.ts
 *
 * Main component module in features path: app/lib/departments.ts
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

export type Department = {
  code: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  gradient: string;
  darkGradient: string;
  icon: string;
  whatYoullDo: { title: string; details: string[] }[];
  whatYoullGain: string[];
  idealCandidate: string[];
  closelyWorkingWith: { code: string; description: string }[];
  importantNote: string;
};

export const DEPARTMENTS: Department[] = [
  {
    code: "ASA",
    name: "Advisor Support Associate",
    tagline: "Internship Position",
    description:
      "As an Advisor Support Associate (ASA) Intern, you will support the team in administrative, recruitment, and business development activities. You will help maintain important trackers, organize records, and assist in day-to-day operations that support both advisors and clients.",
    color: "#F4C542",
    gradient: "linear-gradient(135deg, #F4C542 0%, #E8A317 100%)",
    darkGradient: "linear-gradient(135deg, #2E2818 0%, #1A1508 100%)",
    icon: "📋",
    whatYoullDo: [
      {
        title: "Admin Trackers",
        details: [
          "AVT (Advisor Victory Tracker)",
          "UID (Unit Information Detail)",
          "RRT (Rookie Requirement Tracker)",
        ],
      },
      {
        title: "Prospecting & Client Monitoring",
        details: [
          "CPST (Client Prospect Victory Tracker)",
          "CBT (Client Birthday Tracker)",
          "PLT (Prospect List Tracker)",
        ],
      },
      {
        title: "Other Tasks",
        details: [
          "Course Enrollment Support",
          "Recruitment Coordination",
          "Data Encoding and Monitoring",
          "Documentation and Record Keeping",
          "Other administrative and operational tasks as assigned",
        ],
      },
    ],
    whatYoullGain: [
      "Hands-on experience in business operations and advisor support",
      "Exposure to recruitment, client servicing, and sales support functions",
      "Experience working with digital systems and trackers",
      "Opportunity to develop organizational and communication skills",
      "Mentorship from experienced professionals",
    ],
    idealCandidate: [
      "Organized and detail-oriented",
      "Willing to learn and take initiative",
      "Good communication skills",
      "Tech-savvy and adaptable",
      "Team player with a positive attitude",
    ],
    closelyWorkingWith: [
      {
        code: "BSA",
        description:
          "Collaborate with BSA to streamline client onboarding and proposal workflows.",
      },
      {
        code: "CRA",
        description:
          "Work closely with CRA to get all the necessary client details, records, and updates.",
      },
      {
        code: "DCA",
        description:
          "Work closely with DCA for the improvement of templates and materials.",
      },
    ],
    importantNote:
      "The responsibilities listed above are NOT LIMITED TO these tasks only. As part of Team Padua, interns will be exposed to different functions, projects, and responsibilities across the organization to maximize learning, professional growth, and real-world business experience.",
  },
  {
    code: "BSA",
    name: "Business Support Associate",
    tagline: "Internship Position",
    description:
      "The Business Support Associate (BSA) generates client proposals, connects with new clients, gathers and verifies requirements, and prepares submissions for new business applications. The BSA serves as a key link between clients and the team, ensuring a smooth, complete, and efficient submission process.",
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    darkGradient: "linear-gradient(135deg, #1E2A4A 0%, #0F1729 100%)",
    icon: "💼",
    whatYoullDo: [
      {
        title: "Generate Proposals",
        details: [
          "Create client proposals using SunSmart and OPP (One-Pager Plan).",
          "Ensure that the proposal is accurate, clear, and aligned with client needs.",
        ],
      },
      {
        title: "Connect with New Clients",
        details: [
          "Be the first point of contact for new clients through Messenger.",
          "Build rapport, guide them through the process, and make sure they feel supported every step of the way.",
        ],
      },
      {
        title: "Gather Documents & Requirements",
        details: [
          "Collect and verify all necessary documents and requirements from clients for new business applications.",
          "Ensure completeness and accuracy before submission.",
        ],
      },
      {
        title: "Prepare & Submit New Business",
        details: [
          "Compile and organize client requirements for submission.",
          "Coordinate with the team to ensure timely and proper processing of new business applications.",
        ],
      },
      {
        title: "Maintain Client Records",
        details: [
          "Maintain organized records of client communications, documents, and status updates.",
        ],
      },
    ],
    whatYoullGain: [
      "Hands-on experience in client communication and business processing",
      "Exposure to sales support and new business submission workflows",
      "Opportunity to enhance organization, coordination, and problem-solving skills",
      "Mentorship and guidance from experienced professionals",
    ],
    idealCandidate: [
      "Excellent communication and interpersonal skills",
      "Customer-oriented and empathetic",
      "Organized and detail-oriented",
      "Willing to learn and take initiative",
      "Tech-savvy and can work with digital tools",
      "Team player with a positive attitude",
    ],
    closelyWorkingWith: [
      {
        code: "ASA",
        description:
          "Collaborate with ASA to improve JotForm workflows and application forms for a smoother client experience.",
      },
      {
        code: "DCA",
        description:
          "Work closely with DCA for the improvement of the templates of the OPP (One-Pager Plan).",
      },
    ],
    importantNote:
      "The responsibilities listed above are NOT LIMITED TO these tasks only. As part of Team Padua, interns will be exposed to different functions, projects, and responsibilities across the organization to maximize learning, professional growth, and real-world business experience.",
  },
  {
    code: "CRA",
    name: "Client Relations Associate",
    tagline: "Internship Position",
    description:
      "The Client Relations Associate (CRA) is closely connected with existing clients for client servicing. You will be the main point of contact for servicing requests, policy inquiries, and administrative concerns related to existing policies. You will ensure clients receive timely, accurate, and excellent support.",
    color: "#10B981",
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    darkGradient: "linear-gradient(135deg, #1A2E28 0%, #0F1A16 100%)",
    icon: "🎧",
    whatYoullDo: [
      {
        title: "Client Servicing & Communication",
        details: [
          "Communicate with existing clients through phone, Messenger, and other channels for their servicing requests, inquiries, and concerns.",
          "Provide clear and timely updates.",
        ],
      },
      {
        title: "Admin Concerns (Existing Policy)",
        details: [
          "Advisor Change Requests",
          "Fund Switching",
          "Beneficiary Change Request",
          "Payment Update Requests",
          "and other admin concerns for existing policies",
        ],
      },
      {
        title: "Policy-Related Support",
        details: [
          "CPC (Client Policy Cards)",
          "PPU (Premium Payment Update)",
          "Relationship Management Support (Communication)",
        ],
      },
      {
        title: "Client Experience",
        details: [
          "Ensure clients feel supported, valued, and well-informed every step of the way.",
        ],
      },
    ],
    whatYoullGain: [
      "Hands-on experience in client servicing and relationship management",
      "Opportunity to improve communication and problem-solving skills",
      "Exposure to insurance products and client service processes",
      "Mentorship and guidance from experienced professionals",
    ],
    idealCandidate: [
      "Excellent communication and interpersonal skills",
      "Empathetic and customer-oriented",
      "Organized and detail-oriented",
      "Willing to learn and take initiative",
      "Tech-savvy and can work with digital tools",
      "Team player with a positive attitude",
    ],
    closelyWorkingWith: [
      {
        code: "ASA",
        description:
          "Work closely with ASA to get all the necessary client details, records, and updates to ensure accurate and efficient client servicing.",
      },
      {
        code: "DCA",
        description:
          "Work closely with DCA for the templates and materials to be used for client communications and updates.",
      },
    ],
    importantNote:
      "The responsibilities listed above are NOT LIMITED TO these tasks only. As part of Team Padua, interns will be exposed to different functions, projects, and responsibilities across the organization to maximize learning, professional growth, and real-world business experience.",
  },
  {
    code: "DCA",
    name: "Design Content Associate",
    tagline: "Internship Position",
    description:
      "The Design Content Associate (DCA) is responsible for creating, improving, and maintaining high-quality branding and marketing materials that represent Team Padua and support every department. You will ensure consistency in branding, enhance designs, document team and unit events, and produce video materials for marketing and communication.",
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
    darkGradient: "linear-gradient(135deg, #1E1A2E 0%, #110F1A 100%)",
    icon: "🎨",
    whatYoullDo: [
      {
        title: "Branding & Design Maintenance",
        details: [
          "Maintain the overall branding and visual identity of Team Padua",
          "Ensure consistency in fonts, colors, logos, templates, and design standards",
        ],
      },
      {
        title: "Marketing & Promotional Materials",
        details: [
          "Create and improve marketing materials for campaigns, announcements, and promotions",
          "Design digital and print materials for use across all platforms",
        ],
      },
      {
        title: "Documentation & Event Coverage",
        details: [
          "Document events, activities, and milestones of the team and unit",
          "Edit and design event albums, highlights, and recap materials",
        ],
      },
      {
        title: "Video Content & Multimedia",
        details: [
          "Create and edit videos for marketing, promotions, and announcements",
          "Produce engaging multimedia content that supports the team's goals",
        ],
      },
    ],
    whatYoullGain: [
      "Hands-on experience in design, branding, and multimedia",
      "Opportunity to build a strong portfolio",
      "Exposure to real business marketing and communication projects",
      "Creativity and technical skills development",
      "Mentorship and guidance from experienced professionals",
    ],
    idealCandidate: [
      "Creative and has a strong eye for design",
      "Proficient in design and video editing tools (Photoshop, Canva, Premiere Pro, CapCut, etc.)",
      "Detail-oriented and organized",
      "Willing to learn and take initiative",
      "Good communication and collaboration skills",
      "Team player with a positive attitude",
    ],
    closelyWorkingWith: [
      {
        code: "ASA",
        description:
          "Work closely with ASA to gather the necessary information, data, and requirements for the design and content needed by the team.",
      },
      {
        code: "BSA",
        description:
          "Coordinate with BSA for the templates and materials to be used for proposals, documents, and other client-related needs.",
      },
    ],
    importantNote:
      "The responsibilities listed above are NOT LIMITED TO these tasks only. As part of Team Padua, interns will be exposed to different functions, projects, and responsibilities across the organization to maximize learning, professional growth, and real-world business experience.",
  },
];

/**
 * Executes operations logic for getDepartmentByCode.
 *
 * @param code: string
 * @returns State operations sequence.
 */
export function getDepartmentByCode(code: string): Department | undefined {
  return DEPARTMENTS.find(
    (d) => d.code.toLowerCase() === code.toLowerCase()
  );
}
