import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import ExpenseInputModal from '../components/ExpenseInputModal';
import MonthlyPlanModal from '../components/MonthlyPlanModal';
import { getExpensesByDate, hasAnyExpenses } from '../api/expenseService';
import { getCurrentPlan } from '../api/planService';
import { getCategoryCount } from '../api/categoryService';
import BudgetAlertBanner from '../components/BudgetAlertBanner';
import {
  checkBudgetStatus,
  checkDailyBudget,
  getAllCategoriesBudgetStatus,
} from '../api/alertService';
import { getIncomeSummary } from '../api/incomeService';
import { getDaysInMonth } from '../utils/dateUtils';
import { colors } from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { illustrationAssets } from '../constants/assets';

export default function HomeScreen({ onNavigateTab }) {
  const { user, isLoading: authLoading } = useAuth();
  const { isChecklistHidden, hideChecklist, showChecklist } = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [monthlyPlanVisible, setMonthlyPlanVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyAlertStatus, setMonthlyAlertStatus] = useState(null);
  const [dailyAlertStatus, setDailyAlertStatus] = useState(null);
  const [categoryAlerts, setCategoryAlerts] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [starterTasks, setStarterTasks] = useState({
    hasPlan: false,
    hasCategories: false,
    hasExpense: false,
  });
  const [checklistError, setChecklistError] = useState('');
  const [isChecklistUpdating, setIsChecklistUpdating] = useState(false);

  const loadIncomeSummary = async () => {
    try {
      const month = new Date().toISOString().substring(0, 7);
      const summary = await getIncomeSummary(month);
      setIncomeSummary(summary);
    } catch (err) {
      console.error('Error loading income:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setChecklistError('');

      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);

      const [expensesData, planData, categoryCount, expenseHistory] = await Promise.all([
        getExpensesByDate(today),
        getCurrentPlan(today.substring(0, 7)),
        getCategoryCount(),
        hasAnyExpenses(),
      ]);

      setTodayExpenses(expensesData || []);
      setCurrentPlan(planData);
      setStarterTasks({
        hasPlan: Boolean(planData),
        hasCategories: categoryCount > 0,
        hasExpense: expenseHistory,
      });
      await loadAlerts(today);
      await loadIncomeSummary();
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async (today) => {
    try {
      const currentMonth = today.substring(0, 7);
      const monthlyStatus = await checkBudgetStatus(currentMonth);
      setMonthlyAlertStatus(monthlyStatus);
      const dailyStatus = await checkDailyBudget(today);
      setDailyAlertStatus(dailyStatus);
      const catStatuses = await getAllCategoriesBudgetStatus(currentMonth);
      const warnings = catStatuses.filter((s) => s.alertLevel !== 'safe');
      setCategoryAlerts(warnings);
    } catch (err) {
      console.error('Error loading alerts:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleExpenseAdded = async () => {
    await loadData();
  };

  const handleHideChecklist = async () => {
    try {
      setChecklistError('');
      setIsChecklistUpdating(true);
      await hideChecklist();
    } catch (err) {
      setChecklistError(err.message || 'Gagal menyembunyikan checklist.');
    } finally {
      setIsChecklistUpdating(false);
    }
  };

  const handleShowChecklist = async () => {
    try {
      setChecklistError('');
      setIsChecklistUpdating(true);
      await showChecklist();
    } catch (err) {
      setChecklistError(err.message || 'Gagal menampilkan checklist.');
    } finally {
      setIsChecklistUpdating(false);
    }
  };

  const calculateTodaySpending = () =>
    todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (authLoading || isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.heroTitle}>Budget Flow</Text>
        <Text style={styles.heroSubtitle}>Silakan login dulu ya.</Text>
      </View>
    );
  }

  const todaySpending = calculateTodaySpending();
  const currentMonth = selectedDate.substring(0, 7);
  const dailyBudget = currentPlan ? currentPlan.income / (getDaysInMonth(currentMonth) || 30) : 0;
  const remaining = dailyBudget - todaySpending;
  const spentPercent = dailyBudget > 0 ? Math.round((todaySpending / dailyBudget) * 100) : 0;
  const checklistItems = [
    {
      key: 'plan',
      label: 'Set monthly plan',
      hint: 'Biar budget harian dan alert langsung terasa nyambung.',
      done: starterTasks.hasPlan,
      actionLabel: starterTasks.hasPlan ? 'Done' : 'Open',
      onPress: () => setMonthlyPlanVisible(true),
    },
    {
      key: 'categories',
      label: 'Rapikan kategori',
      hint: 'Supaya transaksi dan ringkasanmu lebih relevan.',
      done: starterTasks.hasCategories,
      actionLabel: starterTasks.hasCategories ? 'Review' : 'Open',
      onPress: () => onNavigateTab && onNavigateTab('settings'),
    },
    {
      key: 'expense',
      label: 'Tambah expense pertama',
      hint: 'Sekali catat, dashboard langsung mulai hidup.',
      done: starterTasks.hasExpense,
      actionLabel: starterTasks.hasExpense ? 'Done' : 'Add',
      onPress: () => setModalVisible(true),
    },
  ];
  const allChecklistDone = checklistItems.every((item) => item.done);
  const shouldShowChecklist = !isChecklistHidden && !allChecklistDone;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroAccentCoral} />
          <View style={styles.heroAccentSky} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Today</Text>
              <Text style={styles.heroTitle}>Budget terasa lebih ringan kalau kelihatan arahnya.</Text>
              <Text style={styles.heroSubtitle}>{selectedDate}</Text>
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroActionButton} onPress={() => setMonthlyPlanVisible(true)}>
                <Text style={styles.heroActionText}>Plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>Hari ini keluar</Text>
              <Text style={styles.quickStatValue}>Rp {todaySpending.toLocaleString('id-ID')}</Text>
              <Text style={styles.quickStatMeta}>{todayExpenses.length} transaksi</Text>
            </View>

            <View style={[styles.quickStatCard, styles.quickStatAccent]}>
              <Text style={styles.quickStatLabel}>Sisa budget hari ini</Text>
              <Text
                style={[
                  styles.quickStatValue,
                  { color: remaining >= 0 ? colors.teal : colors.primary },
                ]}
              >
                Rp {remaining.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.quickStatMeta}>
                Target Rp {Math.round(dailyBudget).toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>

        {shouldShowChecklist && (
          <View style={styles.checklistCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionEyebrow}>Mulai di sini</Text>
                <Text style={styles.sectionTitle}>Biar awalnya tidak kagok</Text>
                <Text style={styles.sectionSubtitle}>
                  Tiga langkah ini cukup buat bikin app langsung terasa kepakai.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.inlineActionButton, isChecklistUpdating && styles.buttonDisabled]}
                onPress={handleHideChecklist}
                disabled={isChecklistUpdating}
              >
                <Text style={styles.inlineActionText}>Hide</Text>
              </TouchableOpacity>
            </View>

            {checklistItems.map((item, index) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.checklistItem, index === checklistItems.length - 1 && styles.checklistItemLast]}
                onPress={item.onPress}
              >
                <View style={[styles.checklistMarker, item.done && styles.checklistMarkerDone]}>
                  <Text style={[styles.checklistMarkerText, item.done && styles.checklistMarkerDoneText]}>
                    {item.done ? 'OK' : index + 1}
                  </Text>
                </View>
                <View style={styles.checklistCopy}>
                  <Text style={styles.checklistItemLabel}>{item.label}</Text>
                  <Text style={styles.checklistItemHint}>{item.hint}</Text>
                </View>
                <Text style={[styles.checklistAction, item.done && styles.checklistActionDone]}>
                  {item.actionLabel}
                </Text>
              </TouchableOpacity>
            ))}

            {checklistError ? <Text style={styles.checklistError}>{checklistError}</Text> : null}
          </View>
        )}

        {!shouldShowChecklist && isChecklistHidden && !allChecklistDone && (
          <TouchableOpacity
            style={[styles.showChecklistButton, isChecklistUpdating && styles.buttonDisabled]}
            onPress={handleShowChecklist}
            disabled={isChecklistUpdating}
          >
            <Text style={styles.showChecklistText}>Tampilkan starter checklist lagi</Text>
          </TouchableOpacity>
        )}

        {incomeSummary ? (
          <View style={styles.sectionCard}>
            <Text style={styles.cardEyebrow}>Ringkasan bulan ini</Text>
            <View style={styles.incomeRow}>
              <View style={styles.incomePrimary}>
                <Text style={styles.incomeValue}>Rp {incomeSummary.totalIncome.toLocaleString('id-ID')}</Text>
                <Text style={styles.incomeHint}>Total income</Text>
              </View>
              <View style={styles.incomeSecondary}>
                <Text style={styles.incomeSecondaryValue}>
                  Rp {incomeSummary.savings.toLocaleString('id-ID')}
                </Text>
                <Text style={styles.incomeHint}>Saved</Text>
                <Text style={styles.incomeRate}>{Math.round(incomeSummary.savingsRate)}% savings rate</Text>
              </View>
            </View>
          </View>
        ) : null}

        {currentPlan ? (
          <TouchableOpacity style={styles.planCard} onPress={() => setMonthlyPlanVisible(true)}>
            <View>
              <Text style={styles.cardEyebrow}>Monthly plan</Text>
              <Text style={styles.planValue}>Rp {currentPlan.income.toLocaleString('id-ID')}</Text>
              <Text style={styles.planHint}>Tap untuk ubah plan bulananmu</Text>
            </View>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Edit</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.setupCard} onPress={() => setMonthlyPlanVisible(true)}>
            <Text style={styles.setupTitle}>Mulai dari monthly plan</Text>
            <Text style={styles.setupText}>
              Sekali isi income bulanan, dashboard dan alert akan terasa jauh lebih berguna.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.cardEyebrow}>Daily budget used</Text>
            <Text style={styles.metricValue}>{dailyBudget > 0 ? `${spentPercent}%` : '--'}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(spentPercent, 100)}%`,
                    backgroundColor: todaySpending > dailyBudget ? colors.primary : colors.teal,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.cardEyebrow}>Budget mood</Text>
            <Text style={styles.metricValue}>{remaining >= 0 ? 'Aman' : 'Watch it'}</Text>
            <Text style={styles.metricHint}>
              {remaining >= 0
                ? 'Masih ada ruang buat hari ini.'
                : 'Pengeluaranmu sudah lewat target harian.'}
            </Text>
          </View>
        </View>

        <BudgetAlertBanner alertStatus={monthlyAlertStatus} onPress={() => {}} />
        <BudgetAlertBanner alertStatus={dailyAlertStatus} onPress={() => {}} />

        {categoryAlerts.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardEyebrow}>Perlu dilihat</Text>
            <Text style={styles.sectionTitle}>Category alerts</Text>
            <View style={styles.alertList}>
              {categoryAlerts.map((alert, idx) => (
                <BudgetAlertBanner key={idx} alertStatus={alert} onPress={() => {}} />
              ))}
            </View>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.cardEyebrow}>Aktivitas hari ini</Text>
          <Text style={styles.sectionTitle}>Today's expenses</Text>

          {todayExpenses.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Image source={illustrationAssets.emptyExpense} style={styles.emptyStateImage} resizeMode="contain" />
              <Text style={styles.emptyStateTitle}>Belum ada pengeluaran hari ini</Text>
              <Text style={styles.emptyStateText}>
                Tambah satu transaksi kecil dulu supaya dashboard mulai terasa hidup.
              </Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={todayExpenses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.expenseItem}>
                  <View style={styles.expenseCategoryDotWrap}>
                    <View
                      style={[
                        styles.expenseCategoryDot,
                        { backgroundColor: item.budget_categories?.color || colors.sky },
                      ]}
                    />
                  </View>
                  <View style={styles.expenseCopy}>
                    <Text style={styles.expenseName}>{item.budget_categories?.name || 'Unknown'}</Text>
                    {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
                  </View>
                  <Text style={styles.expenseAmount}>Rp {item.amount.toLocaleString('id-ID')}</Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Add Expense</Text>
      </TouchableOpacity>

      <ExpenseInputModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onExpenseAdded={handleExpenseAdded}
        initialDate={selectedDate}
      />

      <MonthlyPlanModal
        visible={monthlyPlanVisible}
        onClose={() => setMonthlyPlanVisible(false)}
        onPlanUpdated={loadData}
        month={selectedDate.substring(0, 7)}
      />
    </View>
  );
}

const webShadow = (value) => (Platform.OS === 'web' ? { boxShadow: value } : null);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  heroCard: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...(webShadow('0 20px 42px rgba(201,111,87,0.10)') || shadows.card),
  },
  heroAccentCoral: {
    position: 'absolute',
    top: -40,
    right: -24,
    width: 140,
    height: 140,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primarySoft,
  },
  heroAccentSky: {
    position: 'absolute',
    top: 40,
    right: 70,
    width: 90,
    height: 90,
    borderRadius: borderRadius.full,
    backgroundColor: colors.skySoft,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  heroActions: {
    gap: spacing.sm,
  },
  heroActionButton: {
    minWidth: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  heroActionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  quickStatAccent: {
    backgroundColor: colors.skySoft,
  },
  quickStatLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  quickStatValue: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  quickStatMeta: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: spacing.sm,
  },
  checklistCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionEyebrow: {
    color: colors.mango,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  inlineActionButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inlineActionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checklistItemLast: {
    borderBottomWidth: 0,
  },
  checklistMarker: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mangoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistMarkerDone: {
    backgroundColor: colors.tealSoft,
  },
  checklistMarkerText: {
    color: colors.mango,
    fontSize: 12,
    fontWeight: '800',
  },
  checklistMarkerDoneText: {
    color: colors.teal,
  },
  checklistCopy: {
    flex: 1,
  },
  checklistItemLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  checklistItemHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 3,
  },
  checklistAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  checklistActionDone: {
    color: colors.teal,
  },
  checklistError: {
    marginTop: spacing.sm,
    color: colors.error,
    fontSize: 12,
  },
  showChecklistButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  showChecklistText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEyebrow: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  incomePrimary: {
    flex: 1,
  },
  incomeValue: {
    color: colors.teal,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  incomeHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  incomeSecondary: {
    alignItems: 'flex-end',
  },
  incomeSecondaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  incomeRate: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planValue: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  planHint: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12,
  },
  planBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  planBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  setupCard: {
    backgroundColor: colors.mangoSoft,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  setupTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  setupText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  metricHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },
  progressTrack: {
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  alertList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  errorCard: {
    backgroundColor: colors.errorSoft,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#F5C7C0',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyStateCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  emptyStateImage: {
    width: '100%',
    height: 180,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  expenseCategoryDotWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  expenseCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
  },
  expenseCopy: {
    flex: 1,
  },
  expenseName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  expenseNote: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  expenseAmount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 30,
    minHeight: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...(webShadow('0 16px 32px rgba(201,111,87,0.22)') || shadows.floating),
  },
  fabText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
