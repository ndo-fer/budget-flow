// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getExpensesByDate, getCategories } from '../api/expenseService';
import { getCurrentPlan } from '../api/planService';

export default function HomeScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Load expenses, categories, plan
      const [expensesData, categoriesData, planData] = await Promise.all([
        getExpensesByDate(today),
        getCategories(),
        getCurrentPlan(today.substring(0, 7)),
      ]);

      setTodayExpenses(expensesData || []);
      setCategories(categoriesData || []);
      setCurrentPlan(planData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Text style={styles.buttonText}>Login / Sign Up</Text>
        </TouchableOpacity>
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
  const dailyBudget = currentPlan ? currentPlan.income / 30 : 0; // Simple average

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budget Flow</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today's Spending</Text>
          <Text style={styles.cardValue}>Rp {todaySpending.toLocaleString('id-ID')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#e8f5e9' }]}>
          <Text style={styles.cardLabel}>Daily Budget</Text>
          <Text style={styles.cardValue}>Rp {dailyBudget.toLocaleString('id-ID')}</Text>
        </View>
      </View>

      {/* Expenses List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Expenses ({todayExpenses.length})</Text>
        
        {error && <Text style={styles.error}>{error}</Text>}

        {todayExpenses.length === 0 ? (
          <Text style={styles.emptyText}>No expenses yet</Text>
        ) : (
          todayExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseName}>
                  {expense.budget_categories?.name || 'Unknown'}
                </Text>
                {expense.note && <Text style={styles.expenseNote}>{expense.note}</Text>}
              </View>
              <Text style={styles.expenseAmount}>
                Rp {expense.amount.toLocaleString('id-ID')}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>+ Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📊 Analytics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logout: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 40,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#1976d2',
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});