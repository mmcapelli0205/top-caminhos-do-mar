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
  pode_aprovar: boolean | null;
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

  // Effect 1: Auth listener only — no deps, no profile fetching
  useEffect(() => {
    let isSubscribed = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (isSubscribed) setSession(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (isSubscribed) setSession(newSession);
      }
    );

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  // Effect 2: Load profile when userId changes
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("[useAuth] Profile fetch timed out after 10s — forcing loading=false");
        setLoading(false);
      }
    }, 10_000);

    const fetchProfile = async () => {
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

        if (cancelled) return;

        setProfile(profileRes.data ? (profileRes.data as UserProfile) : null);
        setRole(roleRes.data ? roleRes.data.role : null);
      } catch (err) {
        console.error("[useAuth] Erro ao buscar perfil/role:", err);
        if (!cancelled) {
          setProfile(null);
          setRole(null);
        }
      } finally {
        clearTimeout(safetyTimeout);
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    localStorage.removeItem("top_user");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao deslogar (ignorado):", err);
    }
    setSession(null);
    setProfile(null);
    setRole(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).single(),
    ]);
    if (profileRes.data) setProfile(profileRes.data as UserProfile);
    if (roleRes.data) setRole(roleRes.data.role);
  }, [userId]);

  return { session, profile, role, loading, signOut, refreshProfile };
}
