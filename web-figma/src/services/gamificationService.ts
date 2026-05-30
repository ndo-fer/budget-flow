import supabase from "../lib/supabase";
import { getCurrentUserId } from "./queryUtils";
import { toLocalDateString, getLocalDayBounds, getToday } from "../utils/date";

export interface UserGamification {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  coins: number;
  streak_freezes: number;
  last_streak_date: string | null;
  last_coin_date: string | null;
  updated_at: string;
}

// ── FETCH / INITIALIZE ─────────────────────────────────────────

export const getUserGamification = async (): Promise<UserGamification> => {
  try {
    const userId = await getCurrentUserId();
    
    // Coba ambil data gamifikasi user
    const { data, error } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return data as UserGamification;
    }

    // Jika belum ada, buat record baru default
    const newRecord = {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      coins: 0,
      streak_freezes: 0,
      last_streak_date: null,
      last_coin_date: null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("user_gamification")
      .insert([newRecord])
      .select()
      .single();

    if (insertError) throw insertError;
    return inserted as UserGamification;
  } catch (err) {
    console.error("Error fetching/initializing gamification:", err);
    throw err;
  }
};

// ── SHOP ACTIONS ───────────────────────────────────────────────

export const buyStreakFreeze = async (cost = 25): Promise<UserGamification> => {
  try {
    const userId = await getCurrentUserId();
    const current = await getUserGamification();

    if (current.coins < cost) {
      throw new Error(`Koin tidak cukup! Butuh ${cost} koin, kamu punya ${current.coins}.`);
    }

    const { data, error } = await supabase
      .from("user_gamification")
      .update({
        coins: current.coins - cost,
        streak_freezes: current.streak_freezes + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as UserGamification;
  } catch (err) {
    console.error("Error purchasing streak freeze:", err);
    throw err;
  }
};

// ── CATEGORY EXCLUSION SETTINGS ────────────────────────────────

export const updateCategoryExclusion = async (
  categoryId: string | number,
  exclude: boolean
) => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from("budget_categories")
      .update({ exclude_from_daily_streak: exclude })
      .eq("user_id", userId)
      .eq("id", categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating category exclusion:", err);
    throw err;
  }
};

// ── ZERO SPEND DAY CONFIRMATION ───────────────────────────────

export const recordZeroSpendDay = async (): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    const todayStr = getToday();
    const { startUtc, endUtc } = getLocalDayBounds(todayStr);

    // Cek apakah hari ini sudah ada transaksi
    const { data: existing, error: checkError } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", userId)
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      throw new Error("Kamu sudah memiliki transaksi hari ini, tidak bisa menandai sebagai Zero-Spend.");
    }

    // Insert transaksi Rp 0 khusus untuk menandai Zero-Spend Day
    const { error: insertError } = await supabase
      .from("wallet_transactions")
      .insert([
        {
          user_id: userId,
          amount: 0,
          direction: "out",
          type: "expense",
          category: "Zero-Spend",
          note: "Zero-Spend Day",
          source: "manual",
          confidence: 1.0,
          occurred_at: new Date().toISOString(),
        },
      ]);

    if (insertError) throw insertError;
    
    // Jalankan evaluasi langsung untuk mengupdate streak hari ini
    await evaluateDailyGamification();
  } catch (err) {
    console.error("Error recording Zero-Spend Day:", err);
    throw err;
  }
};

// ── RETROSPECTIVE EVALUATION LOGIC ─────────────────────────────

const getYesterdayString = (dateStr: string): string => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
};

export const evaluateDailyGamification = async (): Promise<{
  updated: boolean;
  streakIncremented: boolean;
  coinsEarned: number;
  freezeUsed: boolean;
  state: UserGamification;
}> => {
  try {
    const userId = await getCurrentUserId();
    const stats = await getUserGamification();
    const todayStr = getToday();
    const yesterdayStr = getYesterdayString(todayStr);

    // Jika streak terakhir sudah hari ini atau hari kemarin, skip evaluasi streak utama harian
    // Namun kita tetap return state saat ini.
    if (stats.last_streak_date === todayStr) {
      return {
        updated: false,
        streakIncremented: false,
        coinsEarned: 0,
        freezeUsed: false,
        state: stats,
      };
    }

    // Tentukan hari awal evaluasi: jika last_streak_date null, evaluasi mulai kemarin
    const evalStartDate = stats.last_streak_date
      ? getYesterdayString(stats.last_streak_date) > yesterdayStr
        ? yesterdayStr // pengaman jika tanggal di masa depan
        : stats.last_streak_date
      : yesterdayStr;

    // Ambil semua transaksi pengeluaran (out) dari evalStartDate hingga kemarin
    const { startUtc } = getLocalDayBounds(evalStartDate);
    const { endUtc } = getLocalDayBounds(yesterdayStr);

    const { data: txs, error: txError } = await supabase
      .from("wallet_transactions")
      .select(`
        amount,
        occurred_at,
        category_id,
        budget_categories (
          exclude_from_daily_streak
        )
      `)
      .eq("user_id", userId)
      .eq("direction", "out")
      .eq("is_duplicate", false)
      .gte("occurred_at", startUtc)
      .lte("occurred_at", endUtc);

    if (txError) throw txError;

    // Group transaksi berdasarkan tanggal lokal
    const txByDate: Record<string, typeof txs> = {};
    (txs || []).forEach((tx) => {
      const dateKey = toLocalDateString(tx.occurred_at);
      if (!txByDate[dateKey]) txByDate[dateKey] = [];
      txByDate[dateKey].push(tx);
    });

    // Ambil daily budget (default ke 100k jika tidak bisa dihitung)
    let dailyBudgetLimit = 100000;
    try {
      const currentMonthStr = todayStr.substring(0, 7);
      const { data: plan } = await supabase
        .from("monthly_plans")
        .select("income")
        .eq("user_id", userId)
        .eq("month", currentMonthStr)
        .maybeSingle();

      if (plan && plan.income > 0) {
        // Ambil tagihan bulanan
        const { data: recurring } = await supabase
          .from("recurring_expenses")
          .select("amount")
          .eq("user_id", userId)
          .eq("frequency", "monthly")
          .eq("is_active", true);

        const totalBills = (recurring || []).reduce((sum, r) => sum + r.amount, 0);
        const daysInMonth = new Date(
          parseInt(currentMonthStr.split("-")[0]),
          parseInt(currentMonthStr.split("-")[1]),
          0
        ).getDate();

        dailyBudgetLimit = Math.max((plan.income - totalBills) / daysInMonth, 20000);
      }
    } catch (e) {
      console.warn("Failed to dynamically calculate daily budget for gamification:", e);
    }

    // Variabel kalkulasi baru
    let newStreak = stats.current_streak;
    let newCoins = stats.coins;
    let newFreezes = stats.streak_freezes;
    let finalStreakDate = stats.last_streak_date || yesterdayStr;
    let finalCoinDate = stats.last_coin_date;
    let freezeUsed = false;
    let coinsEarned = 0;
    let streakIncremented = false;

    // Iterasi hari dari setelah last_streak_date sampai kemarin
    // Jika last_streak_date null, kita evaluasi yesterday saja.
    const datesToEvaluate: string[] = [];
    let currDate = stats.last_streak_date
      ? new Date(`${stats.last_streak_date}T00:00:00`)
      : new Date(`${yesterdayStr}T00:00:00`);
    
    if (stats.last_streak_date) {
      // Tambah 1 hari untuk mulai evaluasi hari berikutnya
      currDate.setDate(currDate.getDate() + 1);
    }

    const yesterdayObj = new Date(`${yesterdayStr}T00:00:00`);
    while (currDate <= yesterdayObj) {
      datesToEvaluate.push(toLocalDateString(currDate));
      currDate.setDate(currDate.getDate() + 1);
    }

    for (const targetDate of datesToEvaluate) {
      const dayTxs = txByDate[targetDate] || [];
      const hasActivity = dayTxs.length > 0;

      if (hasActivity) {
        // Lapis 1: Rantai streak berlanjut karena aktif mencatat
        newStreak += 1;
        finalStreakDate = targetDate;
        streakIncremented = true;

        // Lapis 2: Cek apakah di bawah daily budget (abaikan pengeluaran dengan exclude_from_daily_streak = true)
        const evaluatedSpent = dayTxs.reduce((sum, tx: any) => {
          const isExcluded = tx.budget_categories?.exclude_from_daily_streak === true;
          return sum + (isExcluded ? 0 : tx.amount);
        }, 0);

        if (evaluatedSpent <= dailyBudgetLimit) {
          newCoins += 5;
          coinsEarned += 5;
          finalCoinDate = targetDate;
        }
      } else {
        // Tidak ada aktivitas hari itu
        if (newFreezes > 0) {
          // Selamatkan streak pakai Freeze
          newFreezes -= 1;
          freezeUsed = true;
          finalStreakDate = targetDate; // streak dilompati secara aman
        } else {
          // Streak putus
          newStreak = 0;
        }
      }
    }

    // Jika hari ini sudah melakukan aktivitas pertama kali (misal input transaksi hari ini),
    // kita juga bisa memajukan last_active/streak_date ke hari ini secara optimis.
    const { data: todayTxs, error: todayError } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("user_id", userId)
      .gte("occurred_at", getLocalDayBounds(todayStr).startUtc)
      .lte("occurred_at", getLocalDayBounds(todayStr).endUtc)
      .limit(1);

    if (!todayError && todayTxs && todayTxs.length > 0) {
      // Jika streak kemarin berlanjut atau freeze terpakai, dan hari ini ada aktivitas, set ke today
      if (finalStreakDate === yesterdayStr || datesToEvaluate.length === 0) {
        if (finalStreakDate !== todayStr) {
          newStreak += 1;
          finalStreakDate = todayStr;
          streakIncremented = true;
        }
      }
    }

    const longestStreak = Math.max(stats.longest_streak, newStreak);

    // Update di database
    const { data: updatedStats, error: updateError } = await supabase
      .from("user_gamification")
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        coins: newCoins,
        streak_freezes: newFreezes,
        last_streak_date: finalStreakDate,
        last_coin_date: finalCoinDate || stats.last_coin_date,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      updated: true,
      streakIncremented,
      coinsEarned,
      freezeUsed,
      state: updatedStats as UserGamification,
    };
  } catch (err) {
    console.error("Error evaluating daily gamification:", err);
    throw err;
  }
};
