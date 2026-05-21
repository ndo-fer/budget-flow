import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ExpenseCalendar from '../components/ExpenseCalendar';
import ExpenseFilters from '../components/ExpenseFilters';
import ExpenseInputModal from '../components/ExpenseInputModal';
import { getExpensesByDateRange, deleteExpense } from '../api/expenseService';
import { colors } from '../constants/colors';
import { borderRadius, shadows, spacing } from '../constants/spacing';
import { illustrationAssets } from '../constants/assets';

export default function ExpenseHistoryScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [selectedCategory, searchQuery, selectedDate, allExpenses]);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchStart = new Date();
      fetchStart.setMonth(fetchStart.getMonth() - 6);

      const allExp = await getExpensesByDateRange(fetchStart.toISOString().split('T')[0], today);
      setAllExpenses(allExp || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExpenses = () => {
    try {
      let filtered = allExpenses;

      if (selectedDate) {
        filtered = filtered.filter((exp) => exp.date === selectedDate);
      }

      if (selectedCategory) {
        filtered = filtered.filter((exp) => exp.category_id === selectedCategory);
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((exp) => exp.note?.toLowerCase().includes(query));
      }

      const grouped = {};
      filtered.forEach((expense) => {
        if (!grouped[expense.date]) {
          grouped[expense.date] = [];
        }
        grouped[expense.date].push(expense);
      });

      const sections = Object.entries(grouped)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .map(([date, items]) => ({
          title: formatDate(date),
          data: items,
          summary: items.reduce((sum, exp) => sum + exp.amount, 0),
        }));

      setExpenses(sections);
    } catch (err) {
      console.error('Error filtering expenses:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleDeleteExpense = (expenseId, expenseNote) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expenseNote || 'this expense'}"?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteExpense(expenseId);
              setAllExpenses((current) => current.filter((exp) => exp.id !== expenseId));
              Alert.alert('Success', 'Expense deleted');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setIsEditModalVisible(true);
  };

  const handleExpenseSaved = (updatedExpense) => {
    if (!updatedExpense) {
      return;
    }

    setAllExpenses((current) =>
      current.map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense))
    );
    setIsEditModalVisible(false);
    setSelectedExpense(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedExpense(null);
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSelectedDate(null);
  };

  const handleShowToday = () => {
    setSelectedDate(today);
  };

  const formatDate = (dateStr) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getExpenseDates = () => allExpenses.map((exp) => exp.date);

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayedAmount = expenses.reduce((sectionSum, section) => sectionSum + section.summary, 0);
  const displayedLength = expenses.reduce((sectionLen, section) => sectionLen + section.data.length, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        nestedScrollEnabled
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>History</Text>
          <Text style={styles.heroTitle}>Cari pola belanja, edit transaksi, dan rapikan catatanmu.</Text>
          <Text style={styles.heroSubtitle}>
            Filter berdasarkan tanggal, kategori, atau note supaya history tetap gampang dipahami.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <ExpenseCalendar
            selectedDate={selectedDate || today}
            onDateSelect={setSelectedDate}
            expenseDates={getExpenseDates()}
          />

          <View style={styles.selectionRow}>
            <Text style={styles.selectionText}>
              {selectedDate ? `Showing ${formatDate(selectedDate)}` : 'Showing all dates'}
            </Text>
            <TouchableOpacity style={styles.selectionButton} onPress={selectedDate ? handleResetFilters : handleShowToday}>
              <Text style={styles.selectionButtonText}>
                {selectedDate ? 'Show all' : 'Show today'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.cardEyebrow}>Filters</Text>
          <ExpenseFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onReset={handleResetFilters}
          />
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.cardEyebrow}>Total result</Text>
            <Text style={styles.summaryValue}>{displayedLength}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardEyebrow}>Total amount</Text>
            <Text style={styles.summaryValue}>Rp {displayedAmount.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.cardEyebrow}>Expense list</Text>
          <Text style={styles.sectionTitle}>Filtered result</Text>

          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={illustrationAssets.emptyExpense} style={styles.emptyImage} resizeMode="contain" />
              <Text style={styles.emptyTitle}>Tidak ada expense yang cocok</Text>
              <Text style={styles.emptyText}>Coba ganti tanggal, kategori, atau kata kunci note.</Text>
            </View>
          ) : (
            <SectionList
              scrollEnabled={false}
              sections={expenses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.expenseItem}>
                  <TouchableOpacity
                    style={styles.expenseContent}
                    onPress={() => handleEditExpense(item)}
                    onLongPress={() => handleDeleteExpense(item.id, item.note)}
                  >
                    <View style={styles.expenseLeft}>
                      <View
                        style={[
                          styles.categoryColorWrap,
                          {
                            backgroundColor: `${item.budget_categories?.color || colors.sky}22`,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.categoryColor,
                            {
                              backgroundColor: item.budget_categories?.color || colors.sky,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.expenseText}>
                        <Text style={styles.expenseName}>{item.budget_categories?.name || 'Unknown'}</Text>
                        {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
                      </View>
                    </View>
                    <Text style={styles.expenseAmount}>Rp {item.amount.toLocaleString('id-ID')}</Text>
                  </TouchableOpacity>
                  <Text style={styles.deleteHint}>Tap to edit | Hold to delete</Text>
                </View>
              )}
              renderSectionHeader={({ section: { title, summary } }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderTitle}>{title}</Text>
                  <Text style={styles.sectionHeaderSummary}>Rp {summary.toLocaleString('id-ID')}</Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      <ExpenseInputModal
        visible={isEditModalVisible}
        onClose={handleCloseEditModal}
        onExpenseSaved={handleExpenseSaved}
        expense={selectedExpense}
        initialDate={selectedExpense?.date || selectedDate || today}
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
  heroEyebrow: { color: colors.sky, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  heroTitle: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  heroSubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: spacing.md },
  sectionCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xxl, padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  selectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  selectionText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  selectionButton: { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selectionButtonText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  cardEyebrow: { color: colors.textTertiary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  summaryValue: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  errorCard: { backgroundColor: colors.errorSoft, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: '#F3C8BE' },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 20 },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '800', marginBottom: spacing.md },
  emptyState: { backgroundColor: colors.surfaceMuted, borderRadius: borderRadius.xl, padding: spacing.xl },
  emptyImage: { width: '100%', height: 180, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceMuted, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.xl, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionHeaderTitle: { color: colors.text, fontSize: 13, fontWeight: '800', flex: 1, marginRight: spacing.md },
  sectionHeaderSummary: { color: colors.expense, fontSize: 13, fontWeight: '800' },
  expenseItem: { marginBottom: spacing.sm },
  expenseContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceMuted, padding: spacing.md, borderRadius: borderRadius.xl },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
  categoryColorWrap: { width: 34, height: 34, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  categoryColor: { width: 12, height: 12, borderRadius: borderRadius.full },
  expenseText: { flex: 1 },
  expenseName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  expenseNote: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  expenseAmount: { color: colors.expense, fontSize: 13, fontWeight: '800' },
  deleteHint: { color: colors.textTertiary, fontSize: 10, textAlign: 'center', marginTop: spacing.xs },
});
