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
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { userApi, type User } from "@/lib/api";
import {
  deriveAvailableRoles,
  readStoredRole,
  roleHome,
  writeStoredRole,
  type ActiveRole,
} from "@/lib/roles";

type ActiveRoleContextValue = {
  profile: User | null;
  availableRoles: ActiveRole[];
  activeRole: ActiveRole | null;
  /** Persist a role, update state and navigate to that role's home. */
  setActiveRole: (role: ActiveRole) => void;
  /** True once the profile fetch (success or failure) has resolved. */
  ready: boolean;
};

const ActiveRoleContext = createContext<ActiveRoleContextValue | null>(null);

export function ActiveRoleProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
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
    userApi
      .getMyProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        const roles = deriveAvailableRoles(p);
        const stored = readStoredRole(user.id);
        if (stored && roles.includes(stored)) {
          setCurrentRole(stored);
        } else if (roles.length === 1) {
          setCurrentRole(roles[0]);
          writeStoredRole(user.id, roles[0]);
        } else {
          setCurrentRole(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setCurrentRole("candidate");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

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

  const value = useMemo<ActiveRoleContextValue>(
    () => ({
      profile,
      availableRoles,
      activeRole: currentRole,
      setActiveRole,
      ready,
    }),
    [profile, availableRoles, currentRole, setActiveRole, ready],
  );

  return (
    <ActiveRoleContext.Provider value={value}>
      {children}
    </ActiveRoleContext.Provider>
  );
}

/** Returns null when used outside an ActiveRoleProvider (e.g. public site header). */
export function useActiveRole(): ActiveRoleContextValue | null {
  return useContext(ActiveRoleContext);
}
