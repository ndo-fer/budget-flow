// src/screens/RecurringExpensesScreen.js  
import React, { useState, useEffect } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  ScrollView,  
  TouchableOpacity,  
  ActivityIndicator,  
  FlatList,  
  Alert,  
  RefreshControl,  
} from 'react-native';  
import RecurringExpenseModal from '../components/RecurringExpenseModal';  
import {  
  getRecurringExpenses,  
  deleteRecurringExpense,  
  syncRecurringExpensesForMonth,  
} from '../api/recurringService';  

export default function RecurringExpensesScreen() {  
  const [recurringExpenses, setRecurringExpenses] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);  
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

  const handleDeleteRecurring = (recurringId) => {  
    Alert.alert('Delete', 'Remove this recurring expense?', [  
      { text: 'Cancel' },  
      {  
        text: 'Delete',  
        onPress: async () => {  
          try {  
            await deleteRecurringExpense(recurringId);  
            loadRecurringExpenses();  
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
      const month = new Date().toISOString().substring(0, 7);  
      const count = await syncRecurringExpensesForMonth(month);  
      Alert.alert('Success', `Generated ${count} new recurring expenses for this month`);  
      loadRecurringExpenses();  
    } catch (err) {  
      Alert.alert('Error', err.message);  
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
    .filter((r) => r.frequency === 'monthly')  
    .reduce((sum, r) => sum + r.amount, 0);  

  if (isLoading) {  
    return (  
      <View style={styles.container}>  
        <ActivityIndicator size="large" color="#0000ff" />  
      </View>  
    );  
  }  

  return (  
    <View style={styles.container}>  
      {/* Header */}  
      <View style={styles.header}>  
        <View>  
          <Text style={styles.title}>Recurring</Text>  
          <Text style={styles.subtitle}>  
            {recurringExpenses.length} active recurring  
          </Text>  
        </View>  
        <TouchableOpacity  
          style={styles.addBtn}  
          onPress={handleAddRecurring}  
        >  
          <Text style={styles.addBtnText}>+ Add</Text>  
        </TouchableOpacity>  
      </View>  

      <ScrollView  
        style={styles.content}  
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}  
      >  
        {/* Monthly Total */}  
        {totalMonthlyRecurring > 0 && (  
          <View style={styles.summaryCard}>  
            <Text style={styles.summaryLabel}>Monthly Recurring Total</Text>  
            <Text style={styles.summaryValue}>  
              Rp {totalMonthlyRecurring.toLocaleString('id-ID')}  
            </Text>  
          </View>  
        )}  

        {/* Sync Button */}  
        <TouchableOpacity style={styles.syncBtn} onPress={handleSyncMonth}>  
          <Text style={styles.syncBtnText}>🔄 Sync Month</Text>  
        </TouchableOpacity>  

        {/* Recurring List */}  
        {recurringExpenses.length === 0 ? (  
          <View style={styles.emptyState}>  
            <Text style={styles.emptyStateIcon}>📅</Text>  
            <Text style={styles.emptyStateText}>No recurring expenses</Text>  
            <Text style={styles.emptyStateSubText}>  
              Add your first recurring expense  
            </Text>  
          </View>  
        ) : (  
          <View style={styles.recurringList}>  
            {recurringExpenses.map((recurring) => (  
              <TouchableOpacity  
                key={recurring.id}  
                style={styles.recurringItem}  
                onPress={() => handleEditRecurring(recurring)}  
                onLongPress={() => handleDeleteRecurring(recurring.id)}  
              >  
                <View style={styles.recurringLeft}>  
                  <View  
                    style={[  
                      styles.categoryDot,  
                      {  
                        backgroundColor:  
                          recurring.budget_categories?.color || '#999',  
                      },  
                    ]}  
                  />  
                  <View style={styles.recurringInfo}>  
                    <Text style={styles.recurringCategory}>  
                      {recurring.budget_categories?.name || 'Unknown'}  
                    </Text>  
                    <Text style={styles.recurringDetails}>  
                      {getFrequencyLabel(recurring.frequency)}  
                      {recurring.frequency === 'monthly' && recurring.day_of_month  
                        ? ` on day ${recurring.day_of_month}`  
                        : ''}  
                    </Text>  
                    {recurring.note && (  
                      <Text style={styles.recurringNote}>{recurring.note}</Text>  
                    )}  
                  </View>  
                </View>  
                <View style={styles.recurringRight}>  
                  <Text style={styles.recurringAmount}>  
                    Rp {recurring.amount.toLocaleString('id-ID')}  
                  </Text>  
                  {recurring.end_date && (  
                    <Text style={styles.recurringEndDate}>  
                      Until: {recurring.end_date}  
                    </Text>  
                  )}  
                </View>  
              </TouchableOpacity>  
            ))}  
          </View>  
        )}  

        <View style={{ height: 30 }} />  
      </ScrollView>  

      {/* Modal */}  
      <RecurringExpenseModal  
        visible={modalVisible}  
        onClose={() => setModalVisible(false)}  
        onSave={loadRecurringExpenses}  
        recurring={selectedRecurring}  
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
    marginTop: 2,  
  },  
  addBtn: {  
    backgroundColor: '#1976d2',  
    paddingHorizontal: 14,  
    paddingVertical: 8,  
    borderRadius: 6,  
  },  
  addBtnText: {  
    color: 'white',  
    fontWeight: '600',  
    fontSize: 12,  
  },  
  content: {  
    flex: 1,  
    paddingHorizontal: 16,  
    paddingTop: 12,  
  },  
  summaryCard: {  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
    marginBottom: 12,  
    borderLeftWidth: 4,  
    borderLeftColor: '#1976d2',  
  },  
  summaryLabel: {  
    fontSize: 11,  
    color: '#999',  
    marginBottom: 6,  
  },  
  summaryValue: {  
    fontSize: 18,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  syncBtn: {  
    backgroundColor: '#e8f5e9',  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 14,  
    alignItems: 'center',  
  },  
  syncBtnText: {  
    color: '#2e7d32',  
    fontWeight: '600',  
    fontSize: 13,  
  },  
  recurringList: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    overflow: 'hidden',  
  },  
  recurringItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'flex-start',  
    paddingHorizontal: 14,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: '#f0f0f0',  
  },  
  recurringLeft: {  
    flexDirection: 'row',  
    alignItems: 'flex-start',  
    flex: 1,  
  },  
  categoryDot: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 10,  
    marginTop: 4,  
  },  
  recurringInfo: {  
    flex: 1,  
  },  
  recurringCategory: {  
    fontSize: 14,  
    fontWeight: '600',  
    color: '#333',  
  },  
  recurringDetails: {  
    fontSize: 12,  
    color: '#999',  
    marginTop: 2,  
  },  
  recurringNote: {  
    fontSize: 11,  
    color: '#bbb',  
    marginTop: 2,  
    fontStyle: 'italic',  
  },  
  recurringRight: {  
    alignItems: 'flex-end',  
    marginLeft: 10,  
  },  
  recurringAmount: {  
    fontSize: 14,  
    fontWeight: '700',  
    color: '#d32f2f',  
  },  
  recurringEndDate: {  
    fontSize: 10,  
    color: '#bbb',  
    marginTop: 4,  
  },  
  emptyState: {  
    justifyContent: 'center',  
    alignItems: 'center',  
    paddingVertical: 60,  
  },  
  emptyStateIcon: {  
    fontSize: 48,  
    marginBottom: 12,  
  },  
  emptyStateText: {  
    fontSize: 16,  
    fontWeight: '600',  
    color: '#999',  
    marginBottom: 6,  
  },  
  emptyStateSubText: {  
    fontSize: 13,  
    color: '#bbb',  
  },  
});
