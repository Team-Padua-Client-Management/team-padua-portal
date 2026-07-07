"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/faq/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/user/faq/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, CircleHelp, Tag } from "lucide-react";
import Header from "@/app/components/user/UserHeader/page";
import Sidebar from "@/app/components/user/UserSidebar/page";
import { supabase } from "@/app/lib/supabase/client";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPinned: boolean;
  tags: string[];
}

/**
 * FAQPage
 *
 * Renders the FAQPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for FAQPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    /**
 * Executes operations logic for loadFaqs.
 *
 * 
 * @returns State operations sequence.
 */
async function loadFaqs() {
      try {
        const { data } = await supabase
          .from("faqs")
          .select("*")
          .eq("status", "Published");
        if (data) {
          setFaqs(data.map((f: any) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            category: f.category || "General",
            isPinned: f.is_pinned || false,
            tags: f.tags || []
          })));
        }
      } catch (err) {
        console.error("Error loading FAQs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(faqs.map(f => f.category));
    return ["All", ...Array.from(cats)];
  }, [faqs]);

  const filteredFAQs = useMemo(() => {
    return faqs
      .filter((f) => {
        const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [faqs, searchQuery, selectedCategory]);

  return (
    <div className={styles.text_0}>
      <Sidebar />
      <div className={styles.container_1}>
        <Header />
        <main className={styles.div_2}>
          
          <div className={styles.div_3}>
            <div className={styles.table_4}>
              <span>Support Desk</span>
              <span className={styles.text_5}>|</span>
              <span className={styles.text_6}>Knowledge Base</span>
            </div>
            <h1 className={styles.table_7}>
              Frequently Asked Questions
            </h1>
            <p className={styles.text_8}>Explore standard operating directives and platform answers</p>
          </div>

          <div className={styles.container_9}>
            <div className={styles.container_10}>
              <Search className={styles.text_11} size={14} />
              <input
                type="text"
                placeholder="Search question payload or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.card_12}
              />
            </div>
            <div className={styles.div_13}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.card_14}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.div_15}>
            {loading ? (
              <p className={styles.table_16}>Loading Knowledge Matrix...</p>
            ) : filteredFAQs.length === 0 ? (
              <div className={styles.card_17}>
                <CircleHelp className={styles.text_18} />
                <p className={styles.table_19}>No FAQ objects found matching criteria</p>
              </div>
            ) : (
              <div className={styles.div_20}>
                {filteredFAQs.map((faq) => {
                  const isExpanded = expandedId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`${styles.card_33} ${
                        isExpanded ? "border-[#F4C542] shadow-2xs" : "border-border hover:border-border/80"
                      }`}
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                        className={styles.table_21}
                      >
                        <div className={styles.div_22}>
                          <div className={styles.container_23}>
                            {faq.isPinned && (
                              <span className={styles.text_24} title="Pinned Directive">📌</span>
                            )}
                            <span className={styles.text_25}>
                              {faq.category}
                            </span>
                          </div>
                          <h4 className={styles.text_26}>
                            {faq.question}
                          </h4>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={16} className={styles.text_27} />
                        ) : (
                          <ChevronDown size={16} className={styles.text_28} />
                        )}
                      </button>

                      {isExpanded && (
                        <div className={styles.div_29}>
                          <p className={styles.text_30}>
                            {faq.answer}
                          </p>
                          {faq.tags.length > 0 && (
                            <div className={styles.container_31}>
                              {faq.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={styles.table_32}
                                >
                                  <Tag size={8} /> {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
