"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/header";
import { AdminSidebar } from "@/components/admin/sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="min-h-screen px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        {children}
      </main>
    </div>
  );
}
