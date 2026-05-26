import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import supabase from "../lib/supabase";
import { invalidateMonthlyExpensesCache } from "../services/analyticsService";

type AuthContextValue = {
  user: any;
  isLoading: boolean;
  error: string;
  signUp: (email: string, password: string) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      let restoredSession: any = null;

      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) => {
            window.setTimeout(() => {
              resolve({ data: { session: null } });
            }, 8000);
          }),
        ]);

        const { data: { session } } = sessionResult;
        restoredSession = session;

        if (!active) return;
        setUser(restoredSession?.user ?? null);
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to restore session");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      invalidateMonthlyExpensesCache();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setError("");
    const { data, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      }
    });
    if (authError) throw authError;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    return data;
  };

  const signOut = async () => {
    setError("");
    const { error: authError } = await supabase.auth.signOut();
    if (authError) throw authError;
  };

  return <AuthContext.Provider value={{ user, isLoading, error, signUp, signIn, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
