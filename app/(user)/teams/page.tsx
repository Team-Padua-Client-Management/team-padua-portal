"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/teams/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/user/teams/page.module.css";
import React from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Users,
  Briefcase,
  Headphones,
  Palette,
  Shield,
  Sparkles,
  Trophy,
  TrendingUp,
  ChevronDown,
  Calendar,
  Clock,
  Image as ImageIcon,
  Rocket
} from "lucide-react";

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

const departments = [
  {
    code: "ASA",
    title: "Advisor Support Associate",
    icon: Briefcase,
    description: "Administrative support, documentation, tracking systems, and operations.",
    members: ["John Renz C. Bandianon", "Marilyn Cantada"]
  },
  {
    code: "BSA",
    title: "Business Support Associate",
    icon: Users,
    description: "Client onboarding, proposals, requirements gathering, and business support.",
    members: ["Trisha De La Cruz", "Jazz Princess Noveno"]
  },
  {
    code: "CRA",
    title: "Client Relations Associate",
    icon: Headphones,
    description: "Client servicing, communication, relationship management, and support.",
    members: ["Krystel Kapangyarihan", "Lorena Isabel Dela Cruz"]
  },
  {
    code: "DCA",
    title: "Design Content Associate",
    icon: Palette,
    description: "Branding, graphics, multimedia production, and marketing content.",
    members: ["Dan Andrew Asis"]
  }
];

const values = [
  { icon: TrendingUp, title: "Growth", description: "Continuous learning and professional development." },
  { icon: Crown, title: "Leadership", description: "Leading through action, accountability, and service." },
  { icon: Users, title: "Collaboration", description: "Working together toward shared goals." },
  { icon: Sparkles, title: "Innovation", description: "Improving processes and embracing creativity." },
  { icon: Shield, title: "Integrity", description: "Doing the right thing with professionalism." },
  { icon: Trophy, title: "Excellence", description: "Delivering quality results in every task." }
];

const galleryImages = [
  { url: "/Image/teampadua.png", caption: "Collaboration Sessions" },
  { url: "/Image/strategy_planning.png", caption: "Strategy Planning" },
  { url: "/Image/leadership_workshop.png", caption: "Leadership Workshops" },
  { url: "/Image/team_alignment.png", caption: "Team Alignment" }
];

const roadmap = [
  "Leadership Academy",
  "Certification Program",
  "Performance Dashboard",
  "Skills Tracking",
  "Mentor Matching",
  "Achievement System"
];

/**
 * TeamsPage
 *
 * Renders the TeamsPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for TeamsPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function TeamsPage() {
  return (
    <div className={styles.text_0}>
      {/* Header */}
      <div className={styles.div_1}>
        <div className={styles.table_2} />
        <div className={styles.div_3}>
          <div className={styles.container_4}>
            <Users className={styles.text_5} />
            <span className={styles.table_6}>Directory</span>
          </div>
          <h2 className={styles.table_7}>Team Directory</h2>
          <p className={styles.table_8}>Collaborate and connect with cohort members</p>
        </div>
      </div>

      {/* Banner */}
      <section className={styles.text_9}>
        <div className={styles.container_10}>
          <div className={styles.card_11}>
            <span className={styles.container_12}>
              <Calendar className={styles.text_13} /> Orientation: June 17, 2026
            </span>
            <span className={styles.text_14}>|</span>
            <span className={styles.container_15}>
              <Clock className={styles.text_16} /> Week 1 Active (June 24, 2026)
            </span>
          </div>
          
          <h1 className={styles.table_17}>
            TEAM <span className={styles.text_18}>PADUA</span>
          </h1>
          <p className={styles.table_19}>
            A collaborative business development cohort dedicated to cultivation of emerging leaders through cross-functional exposure in modern enterprise ecosystems.
          </p>
        </div>

        <div className={styles.container_20}>
          {[
            "1 Founder",
            "2 Senior Leaders",
            "4 Departments",
            "7 Active Interns",
            "Onboarding Active"
          ].map((item) => (
            <div
              key={item}
              className={styles.card_21}
            >
              <h3 className={styles.table_22}>{item}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Progress Section */}
      <section className={styles.div_23}>
        <div className={styles.card_24}>
          <div className={styles.container_25}>
            <div className={styles.div_26}>
              <h2 className={styles.text_27}>Cohort Integration Flow</h2>
              <p className={styles.text_28}>
                Foundational orientation achieved on June 17, 2026. Internal operations and tracking parameters are currently online.
              </p>
            </div>

            <div className={styles.container_29}>
              {[
                { val: "7 Days", label: "Elapsed Time" },
                { val: "100%", label: "Orientation" },
                { val: "Phase 1", label: "Active Stage" }
              ].map((stat, idx) => (
                <div key={idx} className={styles.text_30}>
                  <p className={styles.text_31}>{stat.val}</p>
                  <p className={styles.table_32}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.div_33}>
            <div className={styles.table_34} />
          </div>
          <div className={styles.table_35}>
            <span>Orientation (Jun 17)</span>
            <span>Week 1 (Current)</span>
            <span>Evaluation</span>
            <span>Graduation</span>
          </div>
        </div>
      </section>

      {/* Organizational Architecture */}
      <section className={styles.div_36}>
        <div className={styles.text_37}>
          <h2 className={styles.table_38}>Organizational Architecture</h2>
          <p className={styles.table_39}>Structural hierarchy and communication lines</p>
        </div>

        <div className={styles.container_40}>
          {/* Founder Card */}
          <div className={styles.card_41}>
            <div className={styles.table_42}>
              <Crown className={styles.div_43} />
            </div>
            <div className={styles.div_44}>
              <img src={founder.image} alt={founder.name} className={styles.div_45} />
            </div>
            <h3 className={styles.text_46}>{founder.name}</h3>
            <p className={styles.table_47}>{founder.role}</p>
            <p className={styles.text_48}>
              {founder.description}
            </p>
          </div>

          <div className={styles.div_49}>
            <ChevronDown className={styles.text_50} />
          </div>

          {/* Leaders Card Grid */}
          <div className={styles.container_51}>
            {leaders.map((leader) => (
              <div
                key={leader.name}
                className={styles.card_52}
              >
                <div className={styles.div_53}>
                  <img src={leader.image} alt={leader.name} className={styles.div_54} />
                </div>
                <h3 className={styles.text_55}>{leader.name}</h3>
                <p className={styles.table_56}>{leader.role}</p>
                <p className={styles.text_57}>
                  {leader.description}
                </p>
              </div>
            ))}
          </div>

          <div className={styles.div_58}>
            <ChevronDown className={styles.text_59} />
          </div>

          {/* Departments Grid */}
          <div className={styles.container_60}>
            {departments.map((department) => {
              const Icon = department.icon;
              return (
                <div
                  key={department.code}
                  className={`${styles.card_61} group`}
                >
                  <div>
                    <div className={styles.container_62}>
                      <div className={`${styles.table_63} group`}>
                        <Icon className={styles.text_64} />
                      </div>
                      <span className={styles.table_65}>
                        {department.code}
                      </span>
                    </div>
                    <h3 className={styles.text_66}>{department.title}</h3>
                    <p className={styles.text_67}>
                      {department.description}
                    </p>
                  </div>
                  
                  <div className={styles.div_68}>
                    <p className={styles.table_69}>
                      Assigned Personnel
                    </p>
                    <div className={styles.div_70}>
                      {department.members.map((member) => (
                        <div
                          key={member}
                          className={styles.text_71}
                        >
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Strategic Snapshots Gallery */}
      <section className={styles.div_72}>
        <div className={styles.text_73}>
          <h2 className={styles.table_74}>
            <ImageIcon className={styles.text_75} /> Strategic Snapshots
          </h2>
          <p className={styles.text_76}>Milestone environments and operational alignment sessions</p>
        </div>

        <div className={styles.container_77}>
          {galleryImages.map((image, idx) => (
            <div key={idx} className={`${styles.container_78} group`}>
              <img
                src={image.url}
                alt={image.caption}
                className={`${styles.table_79} group`}
              />
              <div className={`${styles.table_80} group`}>
                <p className={styles.table_81}>{image.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cultural Framework */}
      <section className={styles.div_82}>
        <div className={styles.text_83}>
          <h2 className={styles.table_84}>Cultural Framework</h2>
        </div>
        <div className={styles.container_85}>
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                className={`${styles.card_86} group`}
              >
                <div className={`${styles.table_87} group`}>
                  <Icon className={styles.text_88} />
                </div>
                <h3 className={styles.table_89}>{value.title}</h3>
                <p className={styles.text_90}>
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Future Pipelines */}
      <section className={styles.div_91}>
        <div className={styles.card_92}>
          <div className={styles.table_93} />
          <Rocket className={styles.text_94} />
          <h2 className={styles.table_95}>
            Future Pipelines
          </h2>
          <p className={styles.text_96}>
            Iterative expansions, modern integration tracks, advanced systems training frameworks, and cross-functional matching architectures are currently slated for development.
          </p>
          <div className={styles.container_97}>
            {roadmap.map((item) => (
              <div
                key={item}
                className={styles.card_98}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
