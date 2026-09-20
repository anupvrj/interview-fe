"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { resumeApi, type User } from "@/lib/api";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  deriveAvailableRoles,
  readStoredRole,
  resolveInitialActiveRole,
  resolvePathScopedActiveRole,
  roleHome,
  writeStoredRole,
  type ActiveRole,
} from "@/lib/roles";

type ActiveRoleContextValue = {
  profile: User | null;
  availableRoles: ActiveRole[];
  activeRole: ActiveRole | null;
  setActiveRole: (role: ActiveRole) => void;
  setActiveRoleSilent: (role: ActiveRole) => void;
  ready: boolean;
};

const ActiveRoleContext = createContext<ActiveRoleContextValue | null>(null);

export function ActiveRoleProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<ActiveRole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setProfile(null);
      setCurrentRole(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const p = await ensureUserProfile(user);
        if (cancelled) return;
        const queryClient = getQueryClient();
        queryClient.setQueryData(queryKeys.profile(user.id), p);
        if (p.defaultDesignedResume !== undefined) {
          queryClient.setQueryData(
            queryKeys.defaultResume(user.id),
            p.defaultDesignedResume,
          );
        } else {
          void queryClient.prefetchQuery({
            queryKey: queryKeys.defaultResume(user.id),
            queryFn: () => resumeApi.getDefault(user.id),
          });
        }
        setProfile(p);
        setCurrentRole(resolveInitialActiveRole(p, user.id));
      } catch {
        if (cancelled) return;
        setProfile(null);
        setCurrentRole(readStoredRole(user.id));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  useEffect(() => {
    if (!user?.id) return;
    const queryClient = getQueryClient();
    if (queryClient.getQueryData(queryKeys.defaultResume(user.id)) !== undefined) {
      return;
    }
    if (profile?.defaultDesignedResume !== undefined) {
      queryClient.setQueryData(
        queryKeys.defaultResume(user.id),
        profile.defaultDesignedResume,
      );
      return;
    }
    void queryClient.prefetchQuery({
      queryKey: queryKeys.defaultResume(user.id),
      queryFn: () => resumeApi.getDefault(user.id),
    });
  }, [user?.id, profile]);

  useEffect(() => {
    if (!profile || profile.onboardingCompleted || pathname.startsWith("/onboarding")) {
      return;
    }
    router.replace("/onboarding");
  }, [profile, pathname, router]);

  useEffect(() => {
    if (!user || !profile) return;

    const pathRole = resolvePathScopedActiveRole(pathname, profile);
    if (pathRole) {
      setCurrentRole((prev) => {
        if (prev === pathRole) return prev;
        writeStoredRole(user.id, pathRole);
        return pathRole;
      });
      return;
    }

    setCurrentRole((prev) => {
      if (prev) return prev;
      const stored = readStoredRole(user.id);
      const roles = deriveAvailableRoles(profile);
      if (stored && roles.includes(stored)) return stored;
      return prev;
    });
  }, [pathname, profile, user]);

  const availableRoles = useMemo(
    () => (profile ? deriveAvailableRoles(profile) : []),
    [profile],
  );

  const setActiveRole = useCallback(
    (role: ActiveRole) => {
      setCurrentRole(role);
      writeStoredRole(user?.id, role);
      router.push(roleHome(role, profile));
    },
    [user?.id, profile, router],
  );

  const setActiveRoleSilent = useCallback(
    (role: ActiveRole) => {
      setCurrentRole(role);
      writeStoredRole(user?.id, role);
    },
    [user?.id],
  );

  const value = useMemo<ActiveRoleContextValue>(
    () => ({
      profile,
      availableRoles,
      activeRole: currentRole,
      setActiveRole,
      setActiveRoleSilent,
      ready,
    }),
    [profile, availableRoles, currentRole, setActiveRole, setActiveRoleSilent, ready],
  );

  return (
    <ActiveRoleContext.Provider value={value}>
      {children}
    </ActiveRoleContext.Provider>
  );
}

export function useActiveRole(): ActiveRoleContextValue | null {
  return useContext(ActiveRoleContext);
}
