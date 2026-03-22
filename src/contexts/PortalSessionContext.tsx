"use client";

import { createClientIfConfigured } from "@/lib/supabase/client";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PortalSessionState = {
  session: Session | null;
  loading: boolean;
  supabase: SupabaseClient | null;
  configured: boolean;
};

const PortalSessionContext = createContext<PortalSessionState>({
  session: null,
  loading: true,
  supabase: null,
  configured: false,
});

export function PortalSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClientIfConfigured(), []);
  const configured = supabase !== null;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        setSession(newSession);
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo(
    () => ({
      session,
      loading,
      supabase,
      configured,
    }),
    [session, loading, supabase, configured],
  );

  return (
    <PortalSessionContext.Provider value={value}>
      {children}
    </PortalSessionContext.Provider>
  );
}

export function usePortalSession() {
  return useContext(PortalSessionContext);
}
