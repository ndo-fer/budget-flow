import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import supabase from "../lib/supabase";

const DEFAULT_CATEGORIES = [
  { name: "Makan", budget_amount: 300000, color: "#FF6B6B" },
  { name: "Transport", budget_amount: 200000, color: "#4ECDC4" },
  { name: "Entertainment", budget_amount: 150000, color: "#95E1D3" },
  { name: "Shopping", budget_amount: 200000, color: "#F38181" },
  { name: "Utilities", budget_amount: 100000, color: "#AA96DA" },
  { name: "Health", budget_amount: 150000, color: "#FCBAD3" },
  { name: "Education", budget_amount: 100000, color: "#A8D8EA" },
  { name: "Other", budget_amount: 100000, color: "#C7CEEA" },
];

type AuthContextValue = {
  user: any;
  isLoading: boolean;
  error: string;
  signUp: (email: string, password: string) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const setupDefaultCategories = async (userId: string) => {
  const { data, error } = await supabase
    .from("budget_categories")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (error) throw error;
  if (data && data.length > 0) return;

  const { error: insertError } = await supabase.from("budget_categories").insert(
    DEFAULT_CATEGORIES.map((category) => ({ ...category, user_id: userId })),
  );

  if (insertError) {
    throw insertError;
  }
};

const setupDefaultCategoriesSafely = async (userId: string) => {
  try {
    await Promise.race([
      setupDefaultCategories(userId),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Timeout setting up default categories.")), 8000);
      }),
    ]);
  } catch (err) {
    console.warn("Skipping default category setup:", err);
  }
};

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

      if (restoredSession?.user) {
        setupDefaultCategoriesSafely(restoredSession.user.id);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && event === "SIGNED_IN") {
        setupDefaultCategoriesSafely(session.user.id);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setError("");
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
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
