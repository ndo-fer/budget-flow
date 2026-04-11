// src/screens/HomeScreen.js  
import React, { useState, useEffect, useCallback } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  ActivityIndicator,  
  ScrollView,  
  TouchableOpacity,  
  RefreshControl,  
  FlatList,  
} from 'react-native';  
import { useAuth } from '../context/AuthContext';  
import { useFocusEffect } from '@react-navigation/native';  
import ExpenseInputModal from '../components/ExpenseInputModal';  
import { getExpensesByDate } from '../api/expenseService';  
import { getCurrentPlan } from '../api/planService';  

export default function HomeScreen() {  
  const { user, isLoading: authLoading, signOut } = useAuth();  
  const [isLoading, setIsLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  
  const [todayExpenses, setTodayExpenses] = useState([]);  
  const [currentPlan, setCurrentPlan] = useState(null);  
  const [error, setError] = useState(null);  
  const [modalVisible, setModalVisible] = useState(false);  
  const [selectedDate, setSelectedDate] = useState(  
    new Date().toISOString().split('T')[0]  
  );  

  // Load data when screen comes to focus  
  useFocusEffect(  
    useCallback(() => {  
      if (user) {  
        loadData();  
      }  
    }, [user])  
  );  

  const loadData = async () => {  
    try {  
      setError(null);  
      setIsLoading(true);  

      const today = new Date().toISOString().split('T')[0];  
      setSelectedDate(today);  

      // Load expenses & plan  
      const [expensesData, planData] = await Promise.all([  
        getExpensesByDate(today),  
        getCurrentPlan(today.substring(0, 7)),  
      ]);  

      setTodayExpenses(expensesData || []);  
      setCurrentPlan(planData);  
    } catch (err) {  
      setError(err.message);  
      console.error('Error loading data:', err);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  const onRefresh = async () => {  
    setRefreshing(true);  
    await loadData();  
    setRefreshing(false);  
  };  

  const handleExpenseAdded = (newExpense) => {  
    // Add new expense to list  
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
        <TouchableOpacity onPress={signOut}>  
          <Text style={styles.logout}>Logout</Text>  
        </TouchableOpacity>  
      </View>  

      <ScrollView  
        style={styles.content}  
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}  
      >  
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

      {/* Expense Input Modal */}  
      <ExpenseInputModal  
        visible={modalVisible}  
        onClose={() => setModalVisible(false)}  
        onExpenseAdded={handleExpenseAdded}  
        initialDate={selectedDate}  
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
    paddingBottom: 20,  
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
  logout: {  
    color: '#1976d2',  
    fontSize: 13,  
    fontWeight: '600',  
  },  
  content: {  
    flex: 1,  
    paddingHorizontal: 20,  
    paddingTop: 16,  
  },  
  cardsContainer: {  
    flexDirection: 'row',  
    gap: 12,  
    marginBottom: 20,  
  },  
  card: {  
    flex: 1,  
    backgroundColor: 'white',  
    padding: 16,  
    borderRadius: 12,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 2 },  
    shadowOpacity: 0.1,  
    shadowRadius: 4,  
    elevation: 3,  
  },  
  cardLabel: {  
    fontSize: 12,  
    color: '#999',  
    marginBottom: 8,  
  },  
  cardValue: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  progressSection: {  
    backgroundColor: 'white',  
    padding: 16,  
    borderRadius: 12,  
    marginBottom: 20,  
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
    marginBottom: 16,  
  },  
  error: {  
    color: '#c62828',  
    fontSize: 13,  
  },  
  section: {  
    marginBottom: 100,  
  },  
  sectionTitle: {  
    fontSize: 16,  
    fontWeight: '600',  
    marginBottom: 12,  
    color: '#333',  
  },  
  expenseItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    backgroundColor: 'white',  
    padding: 14,  
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
    marginTop: 4,  
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
    paddingVertical: 14,  
    paddingHorizontal: 24,  
    borderRadius: 50,  
    shadowColor: '#000',  
    shadowOffset: { width: 0, height: 4 },  
    shadowOpacity: 0.3,  
    shadowRadius: 8,  
    elevation: 8,  
  },  
  fabText: {  
    color: 'white',  
    fontSize: 14,  
    fontWeight: '600',  
  },  
});