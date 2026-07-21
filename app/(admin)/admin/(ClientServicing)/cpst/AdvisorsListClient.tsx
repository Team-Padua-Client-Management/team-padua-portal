// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Users, ChevronRight, Search } from 'lucide-react';
// import AdminHeader from '@/app/components/admin/AdminHeader';
// import AdminSidebar from '@/app/components/admin/AdminSidebar';
// import { supabase } from "@/app/lib/supabase/client";

// interface AdvisorGroup {
//   name: string;
//   clientCount: number;
//   totalPremium: number;
// }

// export default function AdvisorsListClient() {
//   const router = useRouter();
//   const [advisors, setAdvisors] = useState<AdvisorGroup[]>([]);
//   const [search, setSearch] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   useEffect(() => {
//     const fetchAdvisors = async () => {
//       setLoading(true);
//       try {
//         const { data, error } = await supabase
//           .from('cpst_clients')
//           .select('advisor, annual_premium');

//         if (error) throw error;

//         const groups: Record<string, AdvisorGroup> = {};
//         (data || []).forEach((row: any) => {
//           const raw = (row.advisor || '').trim();
//           if (!raw) return;
//           const key = raw.toLowerCase();
//           if (!groups[key]) {
//             groups[key] = { name: raw, clientCount: 0, totalPremium: 0 };
//           }
//           groups[key].clientCount += 1;
//           groups[key].totalPremium += row.annual_premium || 0;
//         });

//         setAdvisors(Object.values(groups).sort((a, b) => a.name.localeCompare(b.name)));
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAdvisors();
//   }, []);

//   const filtered = advisors.filter(a =>
//     a.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="flex min-h-screen bg-card text-text font-sans antialiased">
//       <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
//       <div className="flex-1 flex flex-col min-w-0">
//         <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
//         <main className="p-4 md:p-6 lg:p-8 w-full max-w-[1920px] mx-auto space-y-8">
//           <div>
//             <h1 className="text-xl font-serif font-semibold text-text">Client Prospect Servicing Tracker</h1>
//             <p className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider mt-0.5">
//               Select an advisor to view their client registry.
//             </p>
//           </div>

//           <div className="relative w-full max-w-xs">
//             <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
//             <input
//               type="text"
//               placeholder="Search advisor..."
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               className="w-full bg-card border border-border rounded-full pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary text-text"
//             />
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//             {loading ? (
//               <p className="text-sm text-text-secondary col-span-full text-center py-10">Loading advisors...</p>
//             ) : filtered.length === 0 ? (
//               <p className="text-sm text-text-secondary col-span-full text-center py-10">No advisors found.</p>
//             ) : (
//               filtered.map(advisor => (
//                 <button
//                   key={advisor.name}
//                   onClick={() => router.push(`/admin/cpst/${encodeURIComponent(advisor.name)}`)}
//                   className="flex items-center justify-between text-left bg-card border border-border p-5 rounded-3xl shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
//                       {advisor.name.charAt(0).toUpperCase()}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-text">{advisor.name}</p>
//                       <p className="text-[11px] text-text-secondary">
//                         ₱{advisor.totalPremium.toLocaleString()} total premium
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="flex items-center gap-1 text-xs font-semibold text-text-secondary">
//                       <Users size={13} /> {advisor.clientCount}
//                     </span>
//                     <ChevronRight size={16} className="text-muted" />
//                   </div>
//                 </button>
//               ))
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }