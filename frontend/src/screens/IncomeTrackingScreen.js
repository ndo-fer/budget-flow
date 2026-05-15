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
import IncomeSourceModal from '../components/IncomeSourceModal';
import IncomeTransactionModal from '../components/IncomeTransactionModal';
import {
  getIncomeSources,
  getIncomeTransactions,
  getIncomeSummary,
  getIncomeBySource,
  deleteIncomeTransaction,
} from '../api/incomeService';
import { colors } from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { illustrationAssets } from '../constants/assets';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function IncomeTrackingScreen() {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [currentMonth, setCurrentMonth] = useState(currentMonthKey);
  const [incomeSources, setIncomeSources] = useState([]);
  const [incomeTransactions, setIncomeTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [incomeBySource, setIncomeBySource] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedTransactionSourceId, setSelectedTransactionSourceId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const sources = await getIncomeSources();
      const transactions = await getIncomeTransactions(currentMonth);
      const summ = await getIncomeSummary(currentMonth);
      const bySource = await getIncomeBySource(currentMonth);
      setIncomeSources(sources);
      setIncomeTransactions(transactions);
      setSummary(summ);
      setIncomeBySource(bySource);
    } catch (err) {
      console.error('Error loading data:', err);
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

  const handleAddSource = () => {
    setSelectedSource(null);
    setModalVisible(true);
  };

  const handleEditSource = (source) => {
    setSelectedSource(source);
    setModalVisible(true);
  };

  const handleAddTransaction = (sourceId = null) => {
    setSelectedTransaction(null);
    setSelectedTransactionSourceId(sourceId);
    setTransactionModalVisible(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setSelectedTransactionSourceId(transaction.income_source_id || null);
    setTransactionModalVisible(true);
  };

  const handleDeleteTransaction = (transaction) => {
    Alert.alert(
      'Delete Income Transaction',
      `Delete "${transaction.income_sources?.source_name || 'this income'}" transaction?`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIncomeTransaction(transaction.id);
              await loadData();
              Alert.alert('Success', 'Income transaction deleted');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedSource(null);
  };

  const closeTransactionModal = () => {
    setTransactionModalVisible(false);
    setSelectedTransactionSourceId(null);
    setSelectedTransaction(null);
  };

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    setCurrentMonth(month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    if (currentMonth === currentMonthKey) return;
    const [year, month] = currentMonth.split('-').map(Number);
    setCurrentMonth(month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`);
  };

  const getMonthLabel = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return `${MONTHS[month - 1]} ${year}`;
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
          <Text style={styles.heroEyebrow}>Income tracking</Text>
          <Text style={styles.heroTitle}>Pantau pemasukanmu biar tabungan terasa lebih kebayang.</Text>
          <Text style={styles.heroSubtitle}>
            Sumber income, transaksi masuk, dan savings bulan ini semua bisa dilihat dari satu tempat.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, incomeSources.length === 0 && styles.buttonDisabled]}
            onPress={() => handleAddTransaction()}
            disabled={incomeSources.length === 0}
          >
            <Text style={styles.secondaryButtonText}>+ Income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddSource}>
            <Text style={styles.primaryButtonText}>+ Source</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.monthNavButton} onPress={handlePrevMonth}>
            <Text style={styles.monthNavText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{getMonthLabel()}</Text>
          <TouchableOpacity
            style={[styles.monthNavButton, currentMonth === currentMonthKey && styles.buttonDisabled]}
            onPress={handleNextMonth}
            disabled={currentMonth === currentMonthKey}
          >
            <Text style={styles.monthNavText}>Next</Text>
          </TouchableOpacity>
        </View>

        {summary ? (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.cardEyebrow}>Total income</Text>
                <Text style={styles.summaryValue}>Rp {summary.totalIncome.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.cardEyebrow}>Total expenses</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  Rp {summary.totalExpenses.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.cardEyebrow}>Savings snapshot</Text>
              <Text style={[styles.savingsValue, { color: summary.savings >= 0 ? colors.teal : colors.primary }]}>
                Rp {summary.savings.toLocaleString('id-ID')}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(0, Math.min(summary.savingsRate, 100))}%`,
                      backgroundColor: summary.savings >= 0 ? colors.teal : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.savingsHint}>Savings rate: {Math.round(summary.savingsRate)}%</Text>
            </View>

            <TouchableOpacity
              style={[styles.quickCard, incomeSources.length === 0 && styles.buttonDisabled]}
              onPress={() => handleAddTransaction()}
              disabled={incomeSources.length === 0}
            >
              <View style={styles.rowText}>
                <Text style={styles.quickCardTitle}>Quick income transaction</Text>
                <Text style={styles.quickCardText}>
                  {incomeSources.length > 0
                    ? 'Catat pemasukan aktual dan biarkan ringkasannya ikut hidup.'
                    : 'Buat minimal satu income source dulu sebelum mencatat transaksi.'}
                </Text>
              </View>
              <Text style={styles.quickCardAction}>{incomeSources.length > 0 ? 'Open' : 'Locked'}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {incomeBySource.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardEyebrow}>Income by source</Text>
            <Text style={styles.sectionTitle}>Per sumber</Text>
            {incomeBySource.map((source, index) => (
              <TouchableOpacity
                key={source.sourceId}
                style={[styles.listItem, index === incomeBySource.length - 1 && styles.listItemLast]}
                onPress={() => handleEditSource(incomeSources.find((item) => item.id === source.sourceId))}
                onLongPress={() => handleAddTransaction(source.sourceId)}
              >
                <View style={styles.rowText}>
                  <Text style={styles.listTitle}>{source.sourceName}</Text>
                  <Text style={styles.listMeta}>
                    {source.frequency} | {source.transactionCount} transaction(s)
                  </Text>
                </View>
                <View style={styles.alignEnd}>
                  <Text style={styles.listValue}>Rp {source.actualAmount.toLocaleString('id-ID')}</Text>
                  <Text style={styles.listHint}>Hold to add income</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.cardEyebrow}>Income sources</Text>
          <Text style={styles.sectionTitle}>Source list</Text>

          {incomeSources.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={illustrationAssets.emptyIncome} style={styles.emptyImage} resizeMode="contain" />
              <Text style={styles.emptyTitle}>Belum ada income source</Text>
              <Text style={styles.emptyText}>Tambah sumber pemasukan pertamamu supaya tracking bulanan bisa mulai kebaca.</Text>
            </View>
          ) : (
            incomeSources.map((source, index) => (
              <TouchableOpacity
                key={source.id}
                style={[styles.listItem, index === incomeSources.length - 1 && styles.listItemLast]}
                onPress={() => handleEditSource(source)}
              >
                <View style={styles.rowText}>
                  <Text style={styles.listTitle}>{source.source_name}</Text>
                  <Text style={styles.listMeta}>{source.frequency}</Text>
                </View>
                <Text style={styles.listValue}>Rp {source.amount.toLocaleString('id-ID')}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {incomeTransactions.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardEyebrow}>Recent transactions</Text>
            <Text style={styles.sectionTitle}>Transaksi terbaru</Text>
            {incomeTransactions.slice(0, 10).map((trans, index) => (
              <TouchableOpacity
                key={trans.id}
                style={[styles.listItem, index === Math.min(incomeTransactions.length, 10) - 1 && styles.listItemLast]}
                onPress={() => handleEditTransaction(trans)}
                onLongPress={() => handleDeleteTransaction(trans)}
              >
                <View style={styles.rowText}>
                  <Text style={styles.listTitle}>{trans.income_sources?.source_name || 'Income'}</Text>
                  {trans.notes ? <Text style={styles.listMeta}>{trans.notes}</Text> : null}
                  <Text style={styles.transactionDate}>{trans.date}</Text>
                  <Text style={styles.listHint}>Tap to edit | Hold to delete</Text>
                </View>
                <Text style={[styles.listValue, { color: colors.teal }]}>+ Rp {trans.amount.toLocaleString('id-ID')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <IncomeSourceModal
        visible={modalVisible}
        onClose={closeModal}
        onSave={loadData}
        incomeSource={selectedSource}
      />

      <IncomeTransactionModal
        visible={transactionModalVisible}
        onClose={closeTransactionModal}
        onSave={loadData}
        incomeSources={incomeSources}
        selectedSourceId={selectedTransactionSourceId}
        initialMonth={currentMonth}
        incomeTransaction={selectedTransaction}
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
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  primaryButton: { flex: 1, minHeight: 52, borderRadius: borderRadius.xl, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: borderRadius.xl, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  buttonDisabled: { opacity: 0.6 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  monthNavButton: { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  monthNavText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  monthLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardEyebrow: { color: colors.textTertiary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  summaryValue: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  sectionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  savingsValue: { fontSize: 24, lineHeight: 30, fontWeight: '800', marginBottom: spacing.md },
  progressTrack: { height: 8, backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.full, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: '100%', borderRadius: borderRadius.full },
  savingsHint: { color: colors.textSecondary, fontSize: 12 },
  quickCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  quickCardTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  quickCardText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  quickCardAction: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '800', marginBottom: spacing.md },
  emptyState: { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.xl, padding: spacing.xl },
  emptyImage: { width: '100%', height: 180, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  listItemLast: { borderBottomWidth: 0, paddingBottom: 0 },
  rowText: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  listTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  listMeta: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  listHint: { color: colors.textTertiary, fontSize: 10, marginTop: spacing.xs },
  listValue: { color: colors.text, fontSize: 14, fontWeight: '800' },
  transactionDate: { color: colors.textTertiary, fontSize: 11, marginTop: spacing.xs },
});
