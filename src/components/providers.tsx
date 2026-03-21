"use client";

import { AdminAuthProvider } from "@/hooks/use-admin-auth";
import { ThemeProvider } from "@/hooks/use-theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminAuthProvider>{children}</AdminAuthProvider>
    </ThemeProvider>
  );
}
