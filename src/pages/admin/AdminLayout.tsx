import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuth } from "@/contexts/AuthContext";
import AdminLogin from "./AdminLogin";
import {
  LayoutDashboard,
  Users,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Bell,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const bottomTabs = [
  { label: "Queue", icon: LayoutDashboard, to: "/admin" },
  { label: "Partners", icon: Users, to: "/admin/partners" },
  { label: "Badges", icon: Shield, to: "/admin/badges" },
  { label: "Bookings", icon: Ticket, to: "/admin/bookings" },
  { label: "Reports", icon: BarChart3, to: "/admin/reports" },
];

export default function AdminLayout() {
  const { isAdmin, loading } = useAdminCheck();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  if (loading && !justLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || (!isAdmin && !justLoggedIn)) {
    return <AdminLogin onSuccess={() => setJustLoggedIn(true)} />;
  }

  if (!isAdmin && !loading) {
    return <AdminLogin onSuccess={() => setJustLoggedIn(true)} />;
  }

  const isListingDetail = location.pathname.includes("/admin/listings/");

  return (
    <div className="relative min-h-screen bg-background pb-20">
      {/* Background blobs */}
      <div className="blob-warm-1 pointer-events-none fixed -right-32 -top-32 h-80 w-80 rounded-full" />
      <div className="blob-warm-2 pointer-events-none fixed -left-20 top-1/3 h-64 w-64 rounded-full" />

      {/* Main content */}
      <main className="relative z-10">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      {!isListingDetail && (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-around border-t border-border/50 bg-background/90 backdrop-blur-xl px-2 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
          {bottomTabs.map((tab) => {
            const isActive =
              tab.to === "/admin"
                ? location.pathname === "/admin" ||
                  location.pathname.startsWith("/admin/listings")
                : location.pathname === tab.to;

            return (
              <button
                key={tab.label}
                onClick={() => {
                  if (tab.to) navigate(tab.to);
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
