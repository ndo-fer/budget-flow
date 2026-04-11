// src/screens/HomeScreen.js (COMPLETE)  
import React, { useState, useEffect } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  ActivityIndicator,  
  ScrollView,  
  TouchableOpacity,  
  RefreshControl,  
  FlatList,  
  Platform,
} from 'react-native';  
import { useAuth } from '../context/AuthContext';  
import ExpenseInputModal from '../components/ExpenseInputModal';  
import MonthlyPlanModal from '../components/MonthlyPlanModal';  
import { getExpensesByDate } from '../api/expenseService';  
import { getCurrentPlan } from '../api/planService';  
import BudgetAlertBanner from '../components/BudgetAlertBanner';  
import {  
  checkBudgetStatus,  
  checkDailyBudget,  
  getAllCategoriesBudgetStatus,  
} from '../api/alertService';
import { getIncomeSummary } from '../api/incomeService';

export default function HomeScreen() {  
  const { user, isLoading: authLoading, signOut } = useAuth();  
  const [isLoading, setIsLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  
  const [todayExpenses, setTodayExpenses] = useState([]);  
  const [currentPlan, setCurrentPlan] = useState(null);  
  const [error, setError] = useState(null);  
  const [modalVisible, setModalVisible] = useState(false);  
  const [monthlyPlanVisible, setMonthlyPlanVisible] = useState(false);  
  const [selectedDate, setSelectedDate] = useState(  
    new Date().toISOString().split('T')[0]  
  );  
  const [monthlyAlertStatus, setMonthlyAlertStatus] = useState(null);  
  const [dailyAlertStatus, setDailyAlertStatus] = useState(null);  
  const [categoryAlerts, setCategoryAlerts] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState(null);

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

      const today = new Date().toISOString().split('T')[0];  
      setSelectedDate(today);  

      const [expensesData, planData] = await Promise.all([  
        getExpensesByDate(today),  
        getCurrentPlan(today.substring(0, 7)),  
      ]);  

      setTodayExpenses(expensesData || []);  
      setCurrentPlan(planData);  
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

      // Check monthly budget  
      const monthlyStatus = await checkBudgetStatus(currentMonth);  
      setMonthlyAlertStatus(monthlyStatus);  

      // Check daily budget  
      const dailyStatus = await checkDailyBudget(today);  
      setDailyAlertStatus(dailyStatus);  

      // Check category budgets  
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

  const handleExpenseAdded = (newExpense) => {  
    setTodayExpenses([newExpense, ...todayExpenses]);  
  };  

  const calculateTodaySpending = () => {  
    return todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);  
  };  

  if (authLoading) {  
    return (  
      <View style={styles.container}>  
        <ActivityIndicator size="large" color="#0000ff" />  
      </View>  
    );  
  }  

  if (!user) {  
    return (  
      <View style={styles.container}>  
        <Text style={styles.title}>Budget Flow</Text>  
        <Text style={styles.subtitle}>Please login first</Text>  
      </View>  
    );  
  }  

  if (isLoading) {  
    return (  
      <View style={styles.container}>  
        <ActivityIndicator size="large" color="#0000ff" />  
      </View>  
    );  
  }  

  const todaySpending = calculateTodaySpending();  
  const dailyBudget = currentPlan ? currentPlan.income / 30 : 0;  
  const remaining = dailyBudget - todaySpending;  

  return (  
    <View style={styles.container}>  
      {/* Header */}  
      <View style={styles.header}>  
        <View>  
          <Text style={styles.title}>Budget Flow</Text>  
          <Text style={styles.subtitle}>{selectedDate}</Text>  
        </View>  
        <View style={styles.headerActions}>  
          <TouchableOpacity   
            style={styles.headerBtn}  
            onPress={() => setMonthlyPlanVisible(true)}  
          >  
            <Text style={styles.headerBtnText}>📅</Text>  
          </TouchableOpacity>  
          <TouchableOpacity   
            style={styles.headerBtn}  
            onPress={signOut}  
          >  
            <Text style={styles.headerBtnText}>🚪</Text>  
          </TouchableOpacity>  
        </View>  
      </View>  

      <ScrollView  
        style={styles.content}  
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}  
      >  
        {/* Income Card */}
        {incomeSummary && (  
          <View style={styles.incomeCard}>  
            <Text style={styles.incomeLabel}>This Month</Text>  
            <View style={styles.incomeRow}>  
              <View>  
                <Text style={styles.incomeValue}>  
                  Rp {incomeSummary.totalIncome.toLocaleString('id-ID')}  
                </Text>  
                <Text style={styles.incomeDetail}>Income</Text>  
              </View>  
              <View style={styles.incomeStats}>  
                <Text style={styles.incomeSavings}>  
                  Saved: Rp {incomeSummary.savings.toLocaleString('id-ID')}  
                </Text>  
                <Text style={styles.incomeSavingsRate}>  
                  {Math.round(incomeSummary.savingsRate)}% savings rate  
                </Text>  
              </View>  
            </View>  
          </View>  
        )}

        {/* Monthly Plan Info Card */}  
        {currentPlan && (  
          <TouchableOpacity   
            style={styles.planCard}  
            onPress={() => setMonthlyPlanVisible(true)}  
          >  
            <View>  
              <Text style={styles.planCardLabel}>Monthly Plan</Text>  
              <Text style={styles.planCardValue}>  
                Rp {currentPlan.income.toLocaleString('id-ID')}  
              </Text>  
            </View>  
            <Text style={styles.planCardEdit}>✏️</Text>  
          </TouchableOpacity>  
        )}  

        {!currentPlan && (  
          <TouchableOpacity   
            style={styles.setupCard}  
            onPress={() => setMonthlyPlanVisible(true)}  
          >  
            <Text style={styles.setupCardTitle}>⚡ Setup Monthly Plan</Text>  
            <Text style={styles.setupCardText}>  
              Set your income to track budget accurately  
            </Text>  
          </TouchableOpacity>  
        )}  

        {/* Budget Alerts */}  
        <BudgetAlertBanner alertStatus={monthlyAlertStatus} onPress={() => {}} />  
        <BudgetAlertBanner alertStatus={dailyAlertStatus} onPress={() => {}} />  

        {/* Category Alerts */}  
        {categoryAlerts.length > 0 && (  
          <View style={styles.categoryAlertsSection}>  
            <Text style={styles.alertsTitle}>⚠️ Category Alerts</Text>  
            {categoryAlerts.map((alert, idx) => (  
              <BudgetAlertBanner key={idx} alertStatus={alert} onPress={() => {}} />  
            ))}  
          </View>  
        )}  

        {/* Dashboard Cards */}  
        <View style={styles.cardsContainer}>  
          <View style={styles.card}>  
            <Text style={styles.cardLabel}>Today Spending</Text>  
            <Text style={styles.cardValue}>Rp {todaySpending.toLocaleString('id-ID')}</Text>  
          </View>  

          <View style={[styles.card, { backgroundColor: remaining >= 0 ? '#e8f5e9' : '#ffebee' }]}>  
            <Text style={styles.cardLabel}>Remaining</Text>  
            <Text style={[styles.cardValue, { color: remaining >= 0 ? '#2e7d32' : '#c62828' }]}>  
              Rp {remaining.toLocaleString('id-ID')}  
            </Text>  
          </View>  
        </View>  

        {/* Progress Bar */}  
        {dailyBudget > 0 && (  
          <View style={styles.progressSection}>  
            <View style={styles.progressHeader}>  
              <Text style={styles.progressLabel}>Daily Budget Used</Text>  
              <Text style={styles.progressPercent}>  
                {Math.round((todaySpending / dailyBudget) * 100)}%  
              </Text>  
            </View>  
            <View style={styles.progressBar}>  
              <View  
                style={[  
                  styles.progressFill,  
                  {  
                    width: `${Math.min((todaySpending / dailyBudget) * 100, 100)}%`,  
                    backgroundColor: todaySpending > dailyBudget ? '#d32f2f' : '#4caf50',  
                  },  
                ]}  
              />  
            </View>  
          </View>  
        )}  

        {/* Error Message */}  
        {error && (  
          <View style={styles.errorContainer}>  
            <Text style={styles.error}>{error}</Text>  
          </View>  
        )}  

        {/* Expenses List */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>Today's Expenses ({todayExpenses.length})</Text>  

          {todayExpenses.length === 0 ? (  
            <Text style={styles.emptyText}>No expenses yet. Start tracking! 💰</Text>  
          ) : (  
            <FlatList  
              scrollEnabled={false}  
              data={todayExpenses}  
              keyExtractor={(item) => item.id.toString()}  
              renderItem={({ item }) => (  
                <View style={styles.expenseItem}>  
                  <View style={styles.expenseInfo}>  
                    <Text style={styles.expenseName}>  
                      {item.budget_categories?.name || 'Unknown'}  
                    </Text>  
                    {item.note && <Text style={styles.expenseNote}>{item.note}</Text>}  
                  </View>  
                  <Text style={styles.expenseAmount}>  
                    Rp {item.amount.toLocaleString('id-ID')}  
                  </Text>  
                </View>  
              )}  
            />  
          )}  
        </View>  
      </ScrollView>  

      {/* Add Expense Button */}  
      <TouchableOpacity  
        style={styles.fab}  
        onPress={() => setModalVisible(true)}  
      >  
        <Text style={styles.fabText}>+ Add Expense</Text>  
      </TouchableOpacity>  

      {/* Modals */}  
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

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#f5f5f5',  
    paddingTop: 40,  
  },  
  header: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    paddingHorizontal: 20,  
    paddingBottom: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: '#eee',  
    backgroundColor: 'white',  
  },  
  title: {  
    fontSize: 26,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  subtitle: {  
    fontSize: 12,  
    color: '#999',  
    marginTop: 4,  
  },  
  headerActions: {  
    flexDirection: 'row',  
    gap: 8,  
  },  
  headerBtn: {  
    width: 40,  
    height: 40,  
    borderRadius: 8,  
    backgroundColor: '#f0f0f0',  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  headerBtnText: {  
    fontSize: 18,  
  },  
  content: {  
    flex: 1,  
    paddingHorizontal: 16,  
    paddingTop: 12,  
  },  
  planCard: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    backgroundColor: 'white',  
    padding: 16,  
    borderRadius: 12,  
    marginBottom: 12,  
    borderLeftWidth: 4,  
    borderLeftColor: '#1976d2',  
  },  
  planCardLabel: {  
    fontSize: 11,  
    color: '#999',  
    marginBottom: 4,  
  },  
  planCardValue: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  planCardEdit: {  
    fontSize: 16,  
  },  
  setupCard: {  
    backgroundColor: '#fff3cd',  
    padding: 14,  
    borderRadius: 12,  
    marginBottom: 12,  
    borderLeftWidth: 4,  
    borderLeftColor: '#ffc107',  
  },  
  setupCardTitle: {  
    fontSize: 14,  
    fontWeight: '600',  
    color: '#856404',  
    marginBottom: 4,  
  },  
  setupCardText: {  
    fontSize: 12,  
    color: '#856404',  
  },  
  cardsContainer: {  
    flexDirection: 'row',  
    gap: 10,  
    marginBottom: 16,  
  },  
  card: {  
    flex: 1,  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
    ...(Platform.OS === 'web' ? {  
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',  
    } : {  
      shadowColor: '#000',  
      shadowOffset: { width: 0, height: 2 },  
      shadowOpacity: 0.1,  
      shadowRadius: 4,  
      elevation: 3,  
    })
  },  
  cardLabel: {  
    fontSize: 12,  
    color: '#999',  
    marginBottom: 6,  
  },  
  cardValue: {  
    fontSize: 16,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  progressSection: {  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
    marginBottom: 16,  
  },  
  progressHeader: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    marginBottom: 8,  
  },  
  progressLabel: {  
    fontSize: 13,  
    color: '#666',  
    fontWeight: '600',  
  },  
  progressPercent: {  
    fontSize: 13,  
    color: '#1976d2',  
    fontWeight: 'bold',  
  },  
  progressBar: {  
    height: 6,  
    backgroundColor: '#f0f0f0',  
    borderRadius: 3,  
    overflow: 'hidden',  
  },  
  progressFill: {  
    height: '100%',  
    borderRadius: 3,  
  },  
  errorContainer: {  
    backgroundColor: '#ffebee',  
    padding: 12,  
    borderRadius: 8,  
    marginBottom: 12,  
  },  
  error: {  
    color: '#c62828',  
    fontSize: 13,  
  },  
  section: {  
    marginBottom: 100,  
  },  
  sectionTitle: {  
    fontSize: 15,  
    fontWeight: '600',  
    marginBottom: 10,  
    color: '#333',  
  },  
  expenseItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    backgroundColor: 'white',  
    padding: 12,  
    borderRadius: 8,  
    marginBottom: 8,  
  },  
  expenseInfo: {  
    flex: 1,  
  },  
  expenseName: {  
    fontSize: 14,  
    fontWeight: '600',  
    color: '#333',  
  },  
  expenseNote: {  
    fontSize: 12,  
    color: '#999',  
    marginTop: 3,  
  },  
  expenseAmount: {  
    fontSize: 14,  
    fontWeight: '700',  
    color: '#d32f2f',  
  },  
  emptyText: {  
    textAlign: 'center',  
    color: '#999',  
    paddingVertical: 30,  
    fontSize: 14,  
  },  
  fab: {  
    position: 'absolute',  
    bottom: 30,  
    right: 20,  
    backgroundColor: '#1976d2',  
    paddingVertical: 12,  
    paddingHorizontal: 20,  
    borderRadius: 50,  
    ...(Platform.OS === 'web' ? {  
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',  
    } : {  
      shadowColor: '#000',  
      shadowOffset: { width: 0, height: 4 },  
      shadowOpacity: 0.3,  
      shadowRadius: 8,  
      elevation: 8,  
    })
  },  
  fabText: {  
    color: 'white',  
    fontSize: 13,  
    fontWeight: '600',  
  },  
  incomeCard: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    padding: 14,  
    marginBottom: 16,  
    borderLeftWidth: 4,  
    borderLeftColor: '#4caf50',  
  },  
  incomeLabel: {  
    fontSize: 11,  
    color: '#999',  
    marginBottom: 8,  
  },  
  incomeRow: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
  },  
  incomeValue: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    color: '#4caf50',  
  },  
  incomeDetail: {  
    fontSize: 11,  
    color: '#999',  
    marginTop: 4,  
  },  
  incomeStats: {  
    alignItems: 'flex-end',  
  },  
  incomeSavings: {  
    fontSize: 12,  
    fontWeight: '600',  
    color: '#333',  
  },  
  incomeSavingsRate: {  
    fontSize: 11,  
    color: '#999',  
    marginTop: 2,  
  },
  categoryAlertsSection: {
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d32f2f',
  },
});