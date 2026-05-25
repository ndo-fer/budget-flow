import supabase from "../lib/supabase";

let cachedUserId: string | null = null;

// Listen to auth changes to keep the cached user ID synchronized
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user?.id) {
    cachedUserId = session.user.id;
  } else {
    cachedUserId = null;
  }
});

export const getCurrentUserId = async () => {
  if (cachedUserId) return cachedUserId;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (session?.user?.id) {
    cachedUserId = session.user.id;
    return cachedUserId;
  }

  // Fallback to network-based getUser if the local session is missing or uninitialized
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user?.id) {
    throw new Error("User session not found");
  }

  cachedUserId = user.id;
  return cachedUserId;
};

