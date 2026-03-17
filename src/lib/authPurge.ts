import { supabase } from "@/integrations/supabase/client";

/**
 * Robustly clears all Supabase auth state from localStorage.
 * Call this on any sign-out path to prevent stale tokens from
 * causing "needs cache clear" issues.
 */
export async function purgeAuthSession(): Promise<void> {
  // Remove legacy app key
  try {
    localStorage.removeItem("top_user");
  } catch {
    // Safari private mode — ignore
  }

  // Attempt Supabase local sign-out (skips server revocation)
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // ignored — we force-clear below
  }

  // Force-clear any remaining Supabase auth tokens
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") && key.includes("-auth-")) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // localStorage unavailable
  }
}
