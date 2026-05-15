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
import RecurringExpenseModal from '../components/RecurringExpenseModal';
import {
  getRecurringExpenses,
  deleteRecurringExpense,
  syncRecurringExpensesForMonth,
} from '../api/recurringService';
import { colors } from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { illustrationAssets } from '../constants/assets';

export default function RecurringExpensesScreen() {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState(null);

  useEffect(() => {
    loadRecurringExpenses();
  }, []);

  const loadRecurringExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await getRecurringExpenses();
      setRecurringExpenses(data || []);
    } catch (err) {
      console.error('Error loading recurring expenses:', err);
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecurringExpenses();
    setRefreshing(false);
  };

  const handleAddRecurring = () => {
    setSelectedRecurring(null);
    setModalVisible(true);
  };

  const handleEditRecurring = (recurring) => {
    setSelectedRecurring(recurring);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRecurring(null);
  };

  const handleDeleteRecurring = (recurringId) => {
    Alert.alert('Archive recurring expense', 'Remove this recurring expense from the active list?', [
      { text: 'Cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          try {
            await deleteRecurringExpense(recurringId);
            await loadRecurringExpenses();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleSyncMonth = async () => {
    try {
      setIsSyncing(true);
      const month = new Date().toISOString().substring(0, 7);
      const count = await syncRecurringExpensesForMonth(month);
      Alert.alert('Success', `Generated ${count} recurring expense(s) for ${month}.`);
      await loadRecurringExpenses();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return frequency;
    }
  };

  const totalMonthlyRecurring = recurringExpenses
    .filter((item) => item.frequency === 'monthly')
    .reduce((sum, item) => sum + item.amount, 0);

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
          <Text style={styles.heroEyebrow}>Recurring</Text>
          <Text style={styles.heroTitle}>Jaga pengeluaran rutin tetap rapi dan tidak gampang kelupaan.</Text>
          <Text style={styles.heroSubtitle}>
            Sinkronkan expense berulang untuk bulan ini dan edit item aktif kapan saja.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddRecurring}>
            <Text style={styles.primaryButtonText}>+ Add recurring</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, isSyncing && styles.buttonDisabled]}
            onPress={handleSyncMonth}
            disabled={isSyncing}
          >
            <Text style={styles.secondaryButtonText}>{isSyncing ? 'Syncing...' : 'Sync month'}</Text>
          </TouchableOpacity>
        </View>

        {totalMonthlyRecurring > 0 ? (
          <View style={styles.summaryCard}>
            <Text style={styles.cardEyebrow}>Monthly recurring total</Text>
            <Text style={styles.summaryValue}>Rp {totalMonthlyRecurring.toLocaleString('id-ID')}</Text>
            <Text style={styles.summaryHint}>Perkiraan total dari item dengan frekuensi bulanan.</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.cardEyebrow}>Recurring list</Text>
          <Text style={styles.sectionTitle}>Item aktif</Text>
          <Text style={styles.sectionSubtitle}>Tap untuk edit. Hold untuk archive.</Text>

          {recurringExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={illustrationAssets.emptyRecurring} style={styles.emptyImage} resizeMode="contain" />
              <Text style={styles.emptyTitle}>Belum ada recurring expense</Text>
              <Text style={styles.emptyText}>Tambah satu item dulu supaya pengeluaran rutinmu bisa ikut tersinkron otomatis.</Text>
            </View>
          ) : (
            recurringExpenses.map((recurring, index) => (
              <TouchableOpacity
                key={recurring.id}
                style={[styles.recurringItem, index === recurringExpenses.length - 1 && styles.recurringItemLast]}
                onPress={() => handleEditRecurring(recurring)}
                onLongPress={() => handleDeleteRecurring(recurring.id)}
              >
                <View style={styles.recurringLeft}>
                  <View
                    style={[
                      styles.categoryDotWrap,
                      { backgroundColor: `${recurring.budget_categories?.color || colors.sky}22` },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: recurring.budget_categories?.color || colors.sky },
                      ]}
                    />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.recurringCategory}>
                      {recurring.budget_categories?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.recurringDetails}>
                      {getFrequencyLabel(recurring.frequency)}
                      {recurring.frequency === 'monthly' && recurring.day_of_month
                        ? ` | day ${recurring.day_of_month}`
                        : ''}
                    </Text>
                    {recurring.note ? <Text style={styles.recurringNote}>{recurring.note}</Text> : null}
                  </View>
                </View>
                <View style={styles.recurringRight}>
                  <Text style={styles.recurringAmount}>Rp {recurring.amount.toLocaleString('id-ID')}</Text>
                  {recurring.end_date ? <Text style={styles.recurringEndDate}>Until {recurring.end_date}</Text> : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <RecurringExpenseModal
        visible={modalVisible}
        onClose={closeModal}
        onSave={loadRecurringExpenses}
        recurring={selectedRecurring}
      />
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
  heroEyebrow: { color: colors.teal, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  heroTitle: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  heroSubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  primaryButton: { flex: 1, minHeight: 52, borderRadius: borderRadius.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: borderRadius.xl, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.teal, fontSize: 13, fontWeight: '800' },
  buttonDisabled: { opacity: 0.6 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  cardEyebrow: { color: colors.textTertiary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  summaryValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  summaryHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 19, marginTop: spacing.sm },
  sectionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  sectionSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm, marginBottom: spacing.md },
  emptyState: { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.xl, padding: spacing.xl, marginTop: spacing.md },
  emptyImage: { width: '100%', height: 180, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  recurringItem: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  recurringItemLast: { borderBottomWidth: 0, paddingBottom: 0 },
  recurringLeft: { flexDirection: 'row', gap: spacing.md, flex: 1 },
  categoryDotWrap: { width: 38, height: 38, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  categoryDot: { width: 12, height: 12, borderRadius: borderRadius.full },
  rowText: { flex: 1 },
  recurringCategory: { color: colors.text, fontSize: 14, fontWeight: '800' },
  recurringDetails: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  recurringNote: { color: colors.textTertiary, fontSize: 12, marginTop: spacing.xs },
  recurringRight: { alignItems: 'flex-end' },
  recurringAmount: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  recurringEndDate: { color: colors.textTertiary, fontSize: 11, marginTop: spacing.xs },
});
