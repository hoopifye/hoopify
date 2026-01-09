"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";

const USER_STORAGE_KEY = "hoopify_user_data";

type StoredUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
};

type UserStoreContextType = {
  user: StoredUser | null;
  setUser: (user: StoredUser | null) => void;
  updateUser: (updates: Partial<StoredUser>) => void;
  clearUser: () => void;
};

const UserStoreContext = createContext<UserStoreContextType | undefined>(undefined);

function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse stored user data:", e);
  }
  return null;
}

function storeUser(user: StoredUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to store user data:", e);
  }
}

export function UserStoreProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser?: StoredUser | null;
}) {
  // Compute initial state - merge stored user with server user
  const computedInitialUser = useMemo(() => {
    if (typeof window === "undefined") return initialUser || null;
    const storedUser = getStoredUser();
    if (storedUser && initialUser) {
      return { ...storedUser, ...initialUser };
    }
    return storedUser || initialUser || null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only compute once on mount
  
  const [user, setUserState] = useState<StoredUser | null>(computedInitialUser);

  // Store initial user on first render
  useEffect(() => {
    if (user) {
      storeUser(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const setUser = useCallback((newUser: StoredUser | null) => {
    setUserState(newUser);
    storeUser(newUser);
  }, []);

  const updateUser = useCallback((updates: Partial<StoredUser>) => {
    setUserState((current) => {
      if (!current) return current;
      const updated = { ...current, ...updates };
      storeUser(updated);
      return updated;
    });
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    storeUser(null);
  }, []);

  // Listen for avatar updates
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent<string>) => {
      if (event.detail) {
        updateUser({ image: event.detail });
      }
    };

    window.addEventListener("avatar-updated", handleAvatarUpdate as EventListener);
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdate as EventListener);
  }, [updateUser]);

  // Listen for user updates (name changes, etc.)
  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent<Partial<StoredUser>>) => {
      if (event.detail) {
        updateUser(event.detail);
      }
    };

    window.addEventListener("user-updated", handleUserUpdate as EventListener);
    return () => window.removeEventListener("user-updated", handleUserUpdate as EventListener);
  }, [updateUser]);

  // Clear on logout
  useEffect(() => {
    const handleLogout = () => {
      clearUser();
    };

    window.addEventListener("user-logout", handleLogout);
    return () => window.removeEventListener("user-logout", handleLogout);
  }, [clearUser]);

  return (
    <UserStoreContext.Provider value={{ user, setUser, updateUser, clearUser }}>
      {children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore() {
  const context = useContext(UserStoreContext);
  if (context === undefined) {
    throw new Error("useUserStore must be used within a UserStoreProvider");
  }
  return context;
}
