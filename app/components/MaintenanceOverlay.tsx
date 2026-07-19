"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Wrench, Power, Play, Terminal } from "lucide-react";
import { supabase } from "@/app/lib/supabase/client";

/**
 * MaintenanceOverlay
 *
 * A client-side fallback overlay that checks Supabase maintenance_settings.
 * Primary enforcement is done server-side via the proxy layer.
 * This overlay catches edge cases like client-side navigation.
 *
 * Only shows for non-admin users when full_system or the current module is under maintenance.
 */
export default function MaintenanceOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bypass, setBypass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moduleName, setModuleName] = useState<string | null>(null);
  const pathname = usePathname();

  // Check if current user is admin
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

  // Check maintenance status from Supabase
  useEffect(() => {
    const checkMaintenance = async () => {
      // Skip exempt paths
      const exemptions = ["/admin/settings", "/auth", "/maintenance", "/api"];
      if (exemptions.some(e => pathname.startsWith(e))) {
        setEnabled(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("maintenance_settings")
          .select("module_key, enabled");

        if (!data) {
          setEnabled(false);
          return;
        }

        // Check full system first
        const fullSystem = data.find((s: { module_key: string; enabled: boolean }) => s.module_key === "full_system");
        if (fullSystem?.enabled) {
          setEnabled(true);
          setModuleName(null);
          return;
        }

        // Check module-specific maintenance
        const pathToModule: Record<string, string> = {
          dashboard: "dashboard", calendar: "calendar", attendance: "attendance",
          messages: "messages", faq: "faq", teams: "teams",
          members: "members", users: "members", profile: "profile",
          acr: "acr", bcr: "bcr", aca: "aca",
          "fund-switching": "fund_switching", "fund-withdrawal": "fund_withdrawal",
          "reinstatement-sro": "sro", "reinstatement-pdi": "pdi",
          cpst: "cpst", cpc: "cpc", fst: "fst", mngt: "mngt", ppu: "ppu",
        };

        const segments = pathname.replace(/^\//, "").split("/");
        const moduleSegment = segments[0] === "admin" ? segments[1] : segments[0];
        const moduleKey = pathToModule[moduleSegment];

        if (moduleKey) {
          const mod = data.find((s: { module_key: string; enabled: boolean }) => s.module_key === moduleKey);
          if (mod?.enabled) {
            setEnabled(true);
            setModuleName(moduleKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
            return;
          }

          // Check client_servicing group
          const csModules = new Set(["acr", "bcr", "aca", "fund_switching", "fund_withdrawal", "sro", "pdi", "cpst", "cpc", "fst", "mngt", "ppu"]);
          if (csModules.has(moduleKey)) {
            const group = data.find((s: { module_key: string; enabled: boolean }) => s.module_key === "client_servicing");
            if (group?.enabled) {
              setEnabled(true);
              setModuleName(moduleKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
              return;
            }
          }
        }

        setEnabled(false);
      } catch (err) {
        console.error("Maintenance check error:", err);
        setEnabled(false);
      }
    };

    checkMaintenance();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("overlay_maintenance_changes")
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'maintenance_settings' },
        () => checkMaintenance()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname]);

  if (!enabled || bypass || loading) return null;

  const disableMaintenance = async () => {
    if (!confirm("Disable all maintenance modes system-wide?")) return;
    
    try {
      // Disable all maintenance settings
      const { error } = await supabase
        .from("maintenance_settings")
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .neq("module_key", "___never_match___"); // Update all rows

      if (error) throw error;
      setEnabled(false);
    } catch (err) {
      console.error("Error disabling maintenance:", err);
    }
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
          {moduleName ? 'Module Maintenance' : 'Undergoing Optimization'}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl leading-tight">
          {moduleName ? `🚧 ${moduleName} Under Maintenance` : 'System Maintenance'}
        </h1>
        
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          {moduleName 
            ? `The ${moduleName} module is currently undergoing maintenance and cannot be used at this time.`
            : 'The Team Padua Portal is currently undergoing scheduled platform upgrades and database migrations to improve performance and stability.'
          }
        </p>
        
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-left text-xs space-y-2 max-w-md mx-auto">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Terminal size={12} className="text-[#FFC72C]" /> System status
          </p>
          <p className="text-slate-500">
            • {moduleName ? `${moduleName}` : 'All services'}: <span className="text-amber-400">Under maintenance</span>
          </p>
          <p className="text-slate-500">
            • {moduleName ? 'Other modules' : 'Estimated downtime'}: <span className={moduleName ? "text-emerald-400" : "text-slate-300"}>{moduleName ? 'Operational' : 'Check back soon'}</span>
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
