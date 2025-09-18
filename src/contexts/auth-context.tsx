"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { upsertTeamMemberFromUser } from "@/services/teamService";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isNavigating: boolean;
};

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isNavigating: false,
});

const protectedRoutes = [
    "/home",
    "/dashboard",
    "/calendar",
    "/clients",
    "/team",
    "/finance",
    "/content",
    "/tracking",
    "/trips",
    "/knowledge-base",
    "/settings",
];

const publicRoutes = ["/login", "/signup"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      const user = session?.user ?? null;
      setIsNavigating(true);
      if (user) {
        await upsertTeamMemberFromUser(user);
      }
      setUser(user);
      setIsLoading(false);
      setIsNavigating(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      setIsNavigating(true);
      router.replace("/login");
    } else if (user && isPublicRoute) {
      setIsNavigating(true);
      router.replace("/home");
    }
  }, [user, isLoading, pathname, router]);

  // Reset navigation state when pathname changes
  React.useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);


  if ((isLoading || isNavigating) && protectedRoutes.some(route => pathname.startsWith(route))) {
    return (
      <div className="flex items-center justify-center h-screen">
         <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
         </div>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, isLoading, isNavigating }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);
