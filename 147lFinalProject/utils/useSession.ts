// Citation: `useSession.ts` provided code in A3
/**
 * Hook that returns the current Supabase auth session.
 * Starts as null and returns the session once it's found.
 * If the user is not logged in, returns null.
 */

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import supabase from "../supabase";

export default function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          // If there's an auth error (like invalid refresh token), clear the session
          console.log("Auth error, clearing session:", error.message);
          setSession(null);
          // Sign out to clear any stale tokens
          await supabase.auth.signOut();
          return;
        }

        setSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
        setSession(null);
      }
    };

    // Get session on mount
    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
      }
      if (_event === 'SIGNED_OUT') {
        console.log("User signed out");
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return session;
}
