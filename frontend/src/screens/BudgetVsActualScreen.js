import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getBudgetVsActual,
  getBudgetVsActualSummary,
  getSpendingRecommendations,
} from '../api/comparisonService';
import { colors } from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { illustrationAssets } from '../constants/assets';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BudgetVsActualScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  );
  const [comparison, setComparison] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const comp = await getBudgetVsActual(currentMonth);
      const summ = await getBudgetVsActualSummary(currentMonth);
      const recs = await getSpendingRecommendations(currentMonth);
      setComparison(comp);
      setSummary(summ);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading budget vs actual:', err);
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    setCurrentMonth(month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    setCurrentMonth(month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`);
  };

  const getMonthLabel = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'over':
        return colors.expense;
      case 'under':
        return colors.teal;
      case 'on-track':
        return colors.sky;
      default:
        return colors.textTertiary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'over':
        return 'Over budget';
      case 'under':
        return 'Under budget';
      case 'on-track':
        return 'On track';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Budget health</Text>
          <Text style={styles.heroTitle}>Lihat apakah rencana dan kenyataanmu masih sejalan.</Text>
          <Text style={styles.heroSubtitle}>
            Bandingkan budget per kategori dengan pengeluaran aktualmu bulan ini.
          </Text>
        </View>

        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.monthNavButton} onPress={handlePrevMonth}>
            <Text style={styles.monthNavText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{getMonthLabel()}</Text>
          <TouchableOpacity style={styles.monthNavButton} onPress={handleNextMonth}>
            <Text style={styles.monthNavText}>Next</Text>
          </TouchableOpacity>
        </View>

        {summary ? (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.cardEyebrow}>Total budget</Text>
                <Text style={styles.summaryValue}>Rp {summary.totalBudget.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.cardEyebrow}>Total spent</Text>
                <Text style={[styles.summaryValue, { color: colors.expense }]}>
                  Rp {summary.totalActual.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.utilizationHeader}>
                <View>
                  <Text style={styles.cardEyebrow}>Overall utilization</Text>
                  <Text style={styles.sectionTitle}>{Math.round(summary.utilizationPercent)}%</Text>
                </View>
                <View style={styles.remainingPill}>
                  <Text
                    style={[
                      styles.remainingPillText,
                      { color: summary.totalVariance >= 0 ? colors.teal : colors.expense },
                    ]}
                  >
                    Rp {summary.totalVariance.toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(summary.utilizationPercent, 100)}%`,
                      backgroundColor:
                        summary.utilizationPercent > 100
                          ? colors.expense
                          : summary.utilizationPercent > 80
                          ? colors.mango
                          : colors.teal,
                    },
                  ]}
                />
              </View>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>On track</Text>
                  <Text style={styles.statValue}>{summary.onTrackCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Under</Text>
                  <Text style={[styles.statValue, { color: colors.teal }]}>{summary.underBudgetCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Over</Text>
                  <Text style={[styles.statValue, { color: colors.expense }]}>{summary.overBudgetCount}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {recommendations.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardEyebrow}>Recommendations</Text>
            <Text style={styles.sectionTitle}>Bisa kamu cek dulu</Text>
            <View style={styles.recommendationList}>
              {recommendations.map((rec, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.recommendationCard,
                    {
                      backgroundColor: rec.type === 'warning' ? colors.errorSoft : colors.mangoSoft,
                    },
                  ]}
                >
                  <Text style={styles.recommendationText}>{rec.message}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.cardEyebrow}>Category breakdown</Text>
          <Text style={styles.sectionTitle}>Per kategori</Text>

          {comparison.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={illustrationAssets.emptyCategory} style={styles.emptyImage} resizeMode="contain" />
              <Text style={styles.emptyTitle}>Belum ada kategori untuk dibandingkan</Text>
              <Text style={styles.emptyText}>Mulai dari budget plan dan expense pertama, nanti ringkasannya akan muncul di sini.</Text>
            </View>
          ) : (
            comparison.map((cat, idx) => (
              <View key={idx} style={[styles.categoryItem, idx === comparison.length - 1 && styles.categoryItemLast]}>
                <View style={styles.categoryHeader}>
                  <View style={styles.rowText}>
                    <Text style={styles.categoryName}>{cat.categoryName}</Text>
                    <Text style={styles.categorySubtext}>
                      {cat.transactionCount} transaksi | {getStatusLabel(cat.status)}
                    </Text>
                  </View>
                  <Text style={[styles.varianceText, { color: getStatusColor(cat.status) }]}>
                    {cat.variance >= 0 ? '+' : '-'}Rp {Math.abs(cat.variance).toLocaleString('id-ID')}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(cat.utilization, 100)}%`,
                        backgroundColor: cat.utilization > 100 ? colors.expense : colors.sky,
                      },
                    ]}
                  />
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Budget</Text>
                    <Text style={styles.statValue}>Rp {cat.budget.toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Actual</Text>
                    <Text style={[styles.statValue, { color: getStatusColor(cat.status) }]}>
                      Rp {cat.actual.toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Usage</Text>
                    <Text style={styles.statValue}>{Math.round(cat.utilization)}%</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingTop: spacing['3xl'], paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  heroEyebrow: { color: colors.sky, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  heroTitle: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  heroSubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: spacing.md },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthNavButton: { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  monthNavText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  monthLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardEyebrow: { color: colors.textTertiary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  summaryValue: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  sectionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  utilizationHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  remainingPill: { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  remainingPillText: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.full, overflow: 'hidden', marginBottom: spacing.md },
  progressFill: { height: '100%', borderRadius: borderRadius.full },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  statItem: { flex: 1 },
  statLabel: { color: colors.textTertiary, fontSize: 11, marginBottom: spacing.xs },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '800' },
  recommendationList: { gap: spacing.sm, marginTop: spacing.md },
  recommendationCard: { borderRadius: borderRadius.xl, padding: spacing.lg },
  recommendationText: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  emptyState: { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.xl, padding: spacing.xl },
  emptyImage: { width: '100%', height: 180, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  categoryItem: { paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryItemLast: { borderBottomWidth: 0, paddingBottom: 0 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
  rowText: { flex: 1 },
  categoryName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  categorySubtext: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  varianceText: { fontSize: 13, fontWeight: '800' },
});
