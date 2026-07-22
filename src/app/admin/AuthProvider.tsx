"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";

const publicRoutes = ["/admin/login"];

export default function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("admin_auth") === "true";
      setIsAuthenticated(auth);
      
      const isAdminRoute = pathname?.startsWith("/admin") && !pathname.includes("/admin/login");
      if (isAdminRoute && !auth) {
        router.push("/admin/login");
      }
    }
  }, [pathname, router]);

  // Don't block public routes
  if (publicRoutes.some((route) => pathname?.startsWith(route))) {
    return <>{children}</>;
  }

  // For admin routes, only render if authenticated
  const isAdminRoute = pathname?.startsWith("/admin") && !pathname.includes("/admin/login");
  if (isAdminRoute) {
    if (isAuthenticated === null) {
      // Still loading - show nothing or loading state
      return null;
    }
    if (!isAuthenticated) {
      return null; // Will redirect via useEffect
    }
  }

  return <>{children}</>;
}
