import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const AppInitContext = createContext(null);

const LAST_USER_KEY = "payvle_last_user_id";
const TRIAL_DAYS = 14;

function computeTrial(user) {
  const diffDays = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
  return {
    daysLeft: Math.max(0, TRIAL_DAYS - diffDays),
    trialExpired: diffDays >= TRIAL_DAYS,
  };
}

// Single source of truth for session/auth state. This is the ONLY place in the
// app that calls supabase.auth.getSession()/onAuthStateChange() at startup —
// previously AppContext and AuthGate each ran their own independent listener,
// which meant two separate "who is signed in" answers that could disagree
// during the startup window.
//
// status:
//   "initializing" — session restore in flight, nothing is known yet
//   "authenticated" — a signed-in user has been confirmed
//   "signed-out"    — confirmed there is no session
//   "error"         — the session restore call itself failed (rare — this is
//                     not a wrong-password login failure, it's e.g. a network
//                     failure while asking Supabase "is there a session?")
export function AppInitProvider({ children }) {
  const [status, setStatus] = useState("initializing");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    function applySession(session) {
      const currentUser = session?.user ?? null;
      // Stored so a returning user can be recognised instantly on next load
      // (see AuthGate) without waiting on a network round-trip first.
      if (currentUser) {
        localStorage.setItem(LAST_USER_KEY, currentUser.id);
      } else {
        localStorage.removeItem(LAST_USER_KEY);
      }
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "signed-out");
    }

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) throw error;
        applySession(session);
      })
      .catch((err) => {
        console.error("Session restore failed:", err);
        if (!mounted) return;
        setAuthError("Could not verify your session. Check your connection and try again.");
        setStatus("error");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      applySession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const trial = useMemo(
    () => (user ? computeTrial(user) : { daysLeft: TRIAL_DAYS, trialExpired: false }),
    [user]
  );

  const value = useMemo(
    () => ({
      status,
      user,
      userId: user?.id || null,
      authError,
      daysLeft: trial.daysLeft,
      trialExpired: trial.trialExpired,
    }),
    [status, user, authError, trial]
  );

  return <AppInitContext.Provider value={value}>{children}</AppInitContext.Provider>;
}

export function useAppInit() {
  const ctx = useContext(AppInitContext);
  if (!ctx) throw new Error("useAppInit must be used within an AppInitProvider");
  return ctx;
}
