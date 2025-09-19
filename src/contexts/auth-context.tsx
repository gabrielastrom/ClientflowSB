"use client";

import * as React from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
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
    "/notes",
    "/gear",
];

const publicRoutes = ["/login", "/signup"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      const user = session?.user ?? null;
      setUser(user);
      setIsLoading(false);
      if (user) {
        upsertTeamMemberFromUser(user).catch(console.error);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const user = session?.user ?? null;
      setUser(user);
      
      if (event === 'SIGNED_IN' && user) {
        try {
          await upsertTeamMemberFromUser(user);
        } catch (error) {
          console.error('Failed to upsert team member:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.includes(pathname);
    const shouldRedirect = (!user && isProtectedRoute) || (user && isPublicRoute);

    if (shouldRedirect && !isNavigating) {
      setIsNavigating(true);
      const redirectTo = !user ? "/login" : "/home";
      
      // Use a timeout to ensure consistent navigation behavior
      setTimeout(() => {
        router.replace(redirectTo);
      }, 0);
    }
  }, [user, isLoading, pathname, router, isNavigating]);

  // Reset navigation state after navigation is complete
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsNavigating(false);
    }, 1000); // Give enough time for navigation to complete

    return () => clearTimeout(timeoutId);
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
