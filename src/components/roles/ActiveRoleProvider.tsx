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
import type { User } from "@/lib/api";
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

    if (currentRole) return;

    const stored = readStoredRole(user.id);
    const roles = deriveAvailableRoles(profile);
    if (stored && roles.includes(stored)) {
      setCurrentRole(stored);
    }
  }, [pathname, profile, user, currentRole]);

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
