// Citation: Provided code in app/index.ts from A3
import { useEffect, useState } from "react";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import supabase from "../supabase";
import Loading from "../components/loading";
import Login from "../components/login";
import { Redirect } from "expo-router";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Default to true for initial load

  useEffect(() => {
    // Get the auth session from the database
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    getSession();

    // Listen for changes in the auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (session) {
    return <Redirect href="/tabs" />;
  } else if (isLoading) {
    return <Loading />;
  } else {
    console.log("No session found!");
    return <Login />;
  }
}
