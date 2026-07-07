/**
 * page.tsx
 *
 * Main component module in features path: app/(user)/dashboard/all/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(user)\dashboard\all\page.tsx
"use client";

import styles from "@/styles/user/dashboard/all/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================
import React, { useState } from "react";
import { Download, Filter, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

/**
 * Executes operations logic for DashboardPage.
 *
 * 
 * @returns State operations sequence.
 */
const DashboardPage = () => {
    const roles = [
        {
            id: "asa",
            name: "ASA",
            title: "Advisor Support Associate",
            color: "from-amber-400 to-amber-500",
            members: [
                { id: 1, name: "John Renz C. Bandianon", progress: 95, avatar: "JB", tasks: 20, completed: 19 },
                { id: 2, name: "Marilyn Cantada", progress: 85, avatar: "MC", tasks: 20, completed: 17 }
            ]
        },
        {
            id: "bsa",
            name: "BSA",
            title: "Business Support Associate",
            color: "from-amber-500 to-amber-600",
            members: [
                { id: 3, name: "Trisha De La Cruz", progress: 88, avatar: "TC", tasks: 25, completed: 22 },
                { id: 4, name: "Jazz Princess Noveno", progress: 80, avatar: "JN", tasks: 15, completed: 12 }
            ]
        },
        {
            id: "cra",
            name: "CRA",
            title: "Client Relations Associate",
            color: "from-yellow-500 to-yellow-600",
            members: [
                { id: 5, name: "Krystel Kapangyarihan", progress: 92, avatar: "KK", tasks: 12, completed: 11 },
                { id: 6, name: "Lorena Isabel Dela Cruz", progress: 90, avatar: "LC", tasks: 30, completed: 27 }
            ]
        },
        {
            id: "dca",
            name: "DCA",
            title: "Design Content Associate",
            color: "from-orange-400 to-orange-500",
            members: [
                { id: 7, name: "Dan Andrew Asis", progress: 76, avatar: "DA", tasks: 17, completed: 13 }
            ]
        }
    ];

    const weeklyTasks = [
        { role: "ASA", associate: "John Renz C. Bandianon", task: "Prepare quarterly advisor reviews and forms", status: "completed", date: "2026-06-25" },
        { role: "BSA", associate: "Trisha De La Cruz", task: "Generate proposals and onboarding reports", status: "completed", date: "2026-06-26" },
        { role: "CRA", associate: "Lorena Isabel Dela Cruz", task: "Resolve client relations query ticket #402", status: "in progress", date: "2026-06-27" },
        { role: "DCA", associate: "Dan Andrew Asis", task: "Design slide templates for leadership workshop", status: "pending", date: "2026-06-28" }
    ];

    const overallStats = {
        today: 72,
        completed: 62,
        pending: 10,
        overallProgress: 86
    };

    /**
 * Executes operations logic for getRoleColor.
 *
 * @param roleId: string
 * @returns State operations sequence.
 */
const getRoleColor = (roleId: string) => {
        switch (roleId) {
            case "asa": return "from-amber-400 to-amber-500";
            case "bsa": return "from-amber-500 to-amber-600";
            case "cra": return "from-yellow-500 to-yellow-600";
            case "dca": return "from-orange-400 to-orange-500";
            default: return "from-[#F4C542] to-[#c59d28]";
        }
    };

    /**
 * Executes operations logic for getProgressColor.
 *
 * @param progress: number
 * @returns State operations sequence.
 */
const getProgressColor = (progress: number) => {
        if (progress >= 90) return "from-emerald-400 to-emerald-500";
        if (progress >= 80) return "from-[#F4C542] to-amber-500";
        return "from-orange-400 to-orange-500";
    };

    /**
 * Executes operations logic for getStatusColor.
 *
 * @param status: string
 * @returns State operations sequence.
 */
const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-emerald-500 text-white";
            case "in progress":
                return "bg-blue-500 text-white";
            default:
                return "bg-amber-500 text-black";
        }
    };

    return (
        <div className={styles.div_0}>
            <div className={styles.container_1}>
                <div>
                    <h2 className={styles.text_2}>
                        Team Padua 2026
                    </h2>
                    <p className={styles.text_3}>
                        Real-time monitoring dashboard
                    </p>
                </div>
                <div className={styles.container_4}>
                    <button className={styles.table_5}>
                        <Download className={styles.div_6} />
                        <span className={styles.div_7}>Export</span>
                    </button>
                    <button className={styles.table_8}>
                        <Filter className={styles.div_9} />
                        <span className={styles.div_10}>Filter</span>
                    </button>
                </div>
            </div>

            <div className={styles.container_11}>
                <div className={styles.text_12}>
                    <p className={styles.text_13}>
                        TODAY'S TOTAL TASKS
                    </p>
                    <p className={styles.text_14}>
                        {overallStats.today}
                    </p>
                    <p className={styles.text_15}>Updated in real-time</p>
                </div>

                <div className={styles.text_16}>
                    <p className={styles.text_17}>
                        TOTAL COMPLETED TASKS
                    </p>
                    <p className={styles.text_18}>{overallStats.completed}</p>
                    <p className={styles.text_19}>
                        {overallStats.today > 0
                            ? Math.round((overallStats.completed / overallStats.today) * 100)
                            : 0}% completion rate
                    </p>
                </div>
            </div>

            <div className={styles.container_20}>
                <div className={styles.card_21}>
                    <div className={styles.container_22}>
                        <h3 className={styles.text_23}>OVERALL PROGRESS</h3>
                        <TrendingUp className={styles.text_24} />
                    </div>
                    <div className={styles.div_25}>
                        <div className={styles.container_26}>
                            {roles.map((role, idx) => (
                                <div key={idx} className={styles.container_27}>
                                    <div className={styles.div_28}>
                                        <div
                                            className={`${styles.div_102} ${getRoleColor(role.id)} transition-all duration-300`}
                                            style={{ height: `${(idx + 1) * 20}%` }}
                                        ></div>
                                    </div>
                                    <p className={styles.text_29}>{role.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.text_30}>
                        <p className={styles.text_31}>{overallStats.overallProgress}%</p>
                        <p className={styles.text_32}>Team Progress</p>
                    </div>
                </div>

                <div className={styles.card_33}>
                    <h3 className={styles.text_34}>INDIVIDUAL PROGRESS</h3>
                    <div className={styles.div_35}>
                        {roles.flatMap((role) =>
                            role.members.slice(0, 2).map((member) => (
                                <div key={member.id} className={styles.div_36}>
                                    <div className={styles.text_37}>
                                        <span className={styles.table_38}>{member.name}</span>
                                        <span className={styles.text_39}>{member.progress}%</span>
                                    </div>
                                    <div className={styles.div_40}>
                                        <div
                                            className={`${styles.div_103} ${getProgressColor(member.progress)}`}
                                            style={{ width: `${member.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={styles.card_41}>
                    <h3 className={styles.text_42}>TASKS STATUS</h3>
                    <div className={styles.div_43}>
                        <div className={styles.table_44}>
                            <span className={styles.text_45}>
                                <CheckCircle className={styles.div_46} />
                                Completed
                            </span>
                            <span className={styles.text_47}>{overallStats.completed}</span>
                        </div>
                        <div className={styles.table_48}>
                            <span className={styles.text_49}>
                                <Clock className={styles.div_50} />
                                Pending
                            </span>
                            <span className={styles.text_51}>{overallStats.pending}</span>
                        </div>
                        <div className={styles.table_52}>
                            <span className={styles.text_53}>
                                <AlertCircle className={styles.div_54} />
                                On Hold
                            </span>
                            <span className={styles.text_55}>0</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.container_56}>
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className={styles.card_57}
                    >
                        <div className={`${styles.div_104} ${getRoleColor(role.id)} px-4 md:px-8 py-4 md:py-6 text-white`}>
                            <h3 className={styles.text_58}>{role.name}</h3>
                            <p className={styles.text_59}>{role.title}</p>
                        </div>
                        <div className={styles.div_60}>
                            <div className={styles.container_61}>
                                {role.members.map((member) => (
                                    <div
                                        key={member.id}
                                        className={styles.table_62}
                                    >
                                        <div className={styles.container_63}>
                                            <div className={styles.container_64}>
                                                <div
                                                    className={`${styles.div_105} ${getRoleColor(role.id)} rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-md shrink-0`}
                                                >
                                                    {member.avatar}
                                                </div>
                                                <div className={styles.div_65}>
                                                    <p className={styles.table_66}>{member.name}</p>
                                                    <p className={styles.table_67}>{role.title}</p>
                                                </div>
                                            </div>
                                            <span className={styles.text_68}>
                                                {member.progress}%
                                            </span>
                                        </div>
                                        <div className={styles.div_69}>
                                            <div className={styles.div_70}>
                                                <div
                                                    className={`${styles.div_106} ${getProgressColor(member.progress)} shadow-sm`}
                                                    style={{ width: `${member.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className={styles.text_71}>
                                            <div className={styles.card_72}>
                                                <p className={styles.text_73}>{member.tasks}</p>
                                                <p className={styles.text_74}>Total</p>
                                            </div>
                                            <div className={styles.table_75}>
                                                <p className={styles.text_76}>{member.completed}</p>
                                                <p className={styles.text_77}>Done</p>
                                            </div>
                                            <div className={styles.table_78}>
                                                <p className={styles.text_79}>
                                                    {Math.ceil(member.tasks - member.completed)}
                                                </p>
                                                <p className={styles.text_80}>Pending</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.card_81}>
                <div className={styles.text_82}>
                    <h3 className={styles.text_83}>WEEKLY ASSIGNED TASKS</h3>
                </div>
                <div className={styles.div_84}>
                    <table className={styles.text_85}>
                        <thead className={styles.table_86}>
                            <tr>
                                <th className={styles.text_87}>Role</th>
                                <th className={styles.text_88}>Associate</th>
                                <th className={styles.text_89}>Task</th>
                                <th className={styles.text_90}>Status</th>
                                <th className={styles.text_91}>Date</th>
                            </tr>
                        </thead>
                        <tbody className={styles.card_92}>
                            {weeklyTasks.map((task, idx) => {
                                const roleData = roles.find((r) => r.name === task.role)
                                return (
                                    <tr key={idx} className={styles.table_93}>
                                        <td className={styles.div_94}>
                                            <span
                                                className={`${styles.text_107} ${roleData ? getRoleColor(roleData.id) : 'from-amber-400 to-amber-500'} shadow-sm`}
                                            >
                                                {task.role}
                                            </span>
                                        </td>
                                        <td className={styles.div_95}>
                                            <p className={styles.text_96}>{task.associate}</p>
                                        </td>
                                        <td className={styles.div_97}>
                                            <p className={styles.text_98}>{task.task}</p>
                                        </td>
                                        <td className={styles.div_99}>
                                            <span className={`${styles.text_108} ${getStatusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className={styles.div_100}>
                                            <p className={styles.text_101}>{task.date}</p>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
