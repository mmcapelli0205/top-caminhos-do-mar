import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  numero_legendario: string | null;
  area_preferencia: string | null;
  cargo: string | null;
  status: string | null;
  motivo_recusa: string | null;
  created_at: string | null;
}

export interface UseAuthReturn {
  session: Session | null;
  profile: UserProfile | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .limit(1)
          .single(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as UserProfile);
      } else {
        setProfile(null);
      }

      if (roleRes.data) {
        setRole(roleRes.data.role);
      } else {
        setRole(null);
      }
    } catch {
      setProfile(null);
      setRole(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadProfile(s.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRole(null);
  }, []);

  return { session, profile, role, loading, signOut, refreshProfile };
}
