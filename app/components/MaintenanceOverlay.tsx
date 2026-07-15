"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, ShieldAlert, Hammer, Power, Terminal, Play } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";

export default function MaintenanceOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bypass, setBypass] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Check if current user is admin/manager
  useEffect(() => {
    async function checkUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          
          if (
            profile?.role === "Admin" || 
            profile?.role === "Manager" || 
            session.user.user_metadata?.role === "Admin" ||
            session.user.user_metadata?.role === "Manager"
          ) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Error checking user role for bypass:", err);
      } finally {
        setLoading(false);
      }
    }
    checkUserRole();
  }, [pathname]);

  // Check if maintenance mode is enabled
  useEffect(() => {
    const checkMaintenance = async () => {
      // 1. Check local storage
      const local = !!localStorage.getItem("site_maintenance");
      
      // 2. Check Supabase database announcements
      let dbMaintenance = false;
      try {
        const { data } = await supabase
          .from("announcements")
          .select("id")
          .eq("title", "SYSTEM_MAINTENANCE")
          .eq("status", "Published")
          .limit(1);
        if (data && data.length > 0) {
          dbMaintenance = true;
        }
      } catch (err) {
        // Fallback silently if table or permissions are missing
      }

      setEnabled(local || dbMaintenance);
    };

    checkMaintenance();
    window.addEventListener("storage", checkMaintenance);
    window.addEventListener("maintenance-mode-change", checkMaintenance);
    return () => {
      window.removeEventListener("storage", checkMaintenance);
      window.removeEventListener("maintenance-mode-change", checkMaintenance);
    };
  }, []);

  if (!enabled || bypass) return null;

  const disableMaintenance = async () => {
    if (!confirm("Disable maintenance mode system-wide?")) return;
    
    localStorage.removeItem("site_maintenance");
    try {
      await supabase
        .from("announcements")
        .delete()
        .eq("title", "SYSTEM_MAINTENANCE");
    } catch (err) {
      console.error("Error deleting database maintenance flag:", err);
    }

    window.dispatchEvent(new CustomEvent("maintenance-mode-change"));
    setEnabled(false);
  };

  const handleAdminBypass = () => {
    setBypass(true);
  };

  return (
    <div style={{ zIndex: 999999 }} className="fixed inset-0 flex items-center justify-center bg-slate-950 text-slate-100 p-6 overflow-hidden">
      {/* Background gradients and grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#FFC72C]/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative max-w-xl w-full text-center bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-[32px] p-8 md:p-12 shadow-2xl">
        
        {/* Glow status dot */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20 relative">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/5 animate-pulse" />
          <Wrench className="h-10 w-10 text-[#FFC72C] animate-bounce duration-1000" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[#FFC72C] text-[10px] font-bold uppercase tracking-wider mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC72C] animate-ping" />
          Undergoing Optimization
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl leading-tight">
          System Maintenance
        </h1>
        
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          The Team Padua Portal is currently undergoing scheduled platform upgrades and database migrations to improve performance and stability. 
        </p>
        
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-left text-xs space-y-2 max-w-md mx-auto">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Terminal size={12} className="text-[#FFC72C]" /> System status
          </p>
          <p className="text-slate-500">
            • Database node replication: <span className="text-emerald-400">Completed</span>
          </p>
          <p className="text-slate-500">
            • Server cache clear: <span className="text-emerald-400">Completed</span>
          </p>
          <p className="text-slate-500">
            • Workspace routing reload: <span className="text-amber-400">Pending verification</span>
          </p>
        </div>

        {/* Action controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAdmin ? (
            <>
              <button
                onClick={handleAdminBypass}
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold text-xs uppercase tracking-wider transition hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Play size={12} />
                Bypass & Enter
              </button>
              <button
                onClick={disableMaintenance}
                className="w-full sm:w-auto px-6 py-3 bg-[#FFC72C] hover:bg-[#ebd04e] text-slate-950 rounded-full font-bold text-xs uppercase tracking-wider transition hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Power size={12} />
                End Maintenance
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Access is limited to authorized system administrators only.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
