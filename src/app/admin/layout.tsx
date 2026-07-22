import type { ReactNode } from "react";
import AdminShell from "./AdminShell";
import AdminErrorBoundary from "./AdminErrorBoundary";
import AuthProvider from "./AuthProvider";

export const metadata = {
  title: "Admin · Kerala Super Store",
  description: "Manage your Kerala Super Store website",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>
        <AdminErrorBoundary>{children}</AdminErrorBoundary>
      </AdminShell>
    </AuthProvider>
  );
}
