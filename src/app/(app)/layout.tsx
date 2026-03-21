import { AdminShell } from "@/components/admin/admin-shell";
import { AuthGate } from "@/components/admin/auth-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AdminShell>{children}</AdminShell>
    </AuthGate>
  );
}
