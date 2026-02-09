import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
];

const THROTTLE_MS = 30_000; // only process activity once per 30s

export function useInactivityTimeout(minutes: number) {
  const navigate = useNavigate();
  const timeoutMs = minutes * 60 * 1000;
  const warningMs = (minutes - 5) * 60 * 1000;

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
  }, []);

  const doLogout = useCallback(async () => {
    clearTimers();
    toast.error("Sessão encerrada por inatividade");
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }, [clearTimers, navigate]);

  const resetTimers = useCallback(() => {
    clearTimers();
    warnedRef.current = false;
    lastActivityRef.current = Date.now();

    warningTimerRef.current = setTimeout(() => {
      warnedRef.current = true;
      toast.warning("Sua sessão expira em 5 minutos por inatividade", {
        duration: 60_000,
        action: {
          label: "Continuar",
          onClick: () => {
            resetTimers();
          },
        },
      });
    }, warningMs);

    logoutTimerRef.current = setTimeout(() => {
      doLogout();
    }, timeoutMs);
  }, [clearTimers, doLogout, warningMs, timeoutMs]);

  useEffect(() => {
    let lastHandled = Date.now();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastHandled < THROTTLE_MS) return;
      lastHandled = now;
      resetTimers();
    };

    EVENTS.forEach((e) => document.addEventListener(e, handleActivity, { passive: true }));
    resetTimers();

    return () => {
      EVENTS.forEach((e) => document.removeEventListener(e, handleActivity));
      clearTimers();
    };
  }, [resetTimers, clearTimers]);
}
