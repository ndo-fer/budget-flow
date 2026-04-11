// src/screens/ExpenseHistoryScreen.js  
import React, { useState, useEffect, useCallback } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  ScrollView,  
  ActivityIndicator,  
  RefreshControl,  
  FlatList,  
  TouchableOpacity,  
  Alert,  
  SectionList,  
} from 'react-native';  
import ExpenseCalendar from '../components/ExpenseCalendar';  
import ExpenseFilters from '../components/ExpenseFilters';  
import {  
  getExpensesByDateRange,  
  getExpensesByCategory,  
  searchExpenses,  
  deleteExpense,  
} from '../api/expenseService';  

export default function ExpenseHistoryScreen({ navigation }) {  
  const [selectedDate, setSelectedDate] = useState(null); // No selected date by default
  const [startDate, setStartDate] = useState(  
    new Date(new Date().setFullYear(new Date().getFullYear(), new Date().getMonth() - 2))  
      .toISOString()  
      .split('T')[0]  
  );  
  const [endDate, setEndDate] = useState(  
    new Date(new Date().setFullYear(new Date().getFullYear(), new Date().getMonth() + 0))  
      .toISOString() 
      .split('T')[0] + "T23:59:59.999Z" // Up to end of today
  );  

  const [selectedCategory, setSelectedCategory] = useState(null);  
  const [searchQuery, setSearchQuery] = useState('');  
  const [expenses, setExpenses] = useState([]);  
  const [allExpenses, setAllExpenses] = useState([]); // For finding expense dates  
  const [isLoading, setIsLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  
  const [error, setError] = useState(null);  

  useEffect(() => {  
    loadExpenses();  
  }, []);  

  // Load expenses whenever filters change  
  useEffect(() => {  
    filterExpenses();  
  }, [selectedCategory, searchQuery, selectedDate, allExpenses]);  

  const loadExpenses = async () => {  
    try {  
      setIsLoading(true);  
      setError(null);  

      // Fetch broad range of expenses from the last few months 
      const fetchStart = new Date();
      fetchStart.setMonth(fetchStart.getMonth() - 6);
      
      const allExp = await getExpensesByDateRange(fetchStart.toISOString().split('T')[0], endDate.split('T')[0]);  
      setAllExpenses(allExp || []);  
    } catch (err) {  
      setError(err.message);  
      console.error('Error loading expenses:', err);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  const filterExpenses = async () => {  
    try {  
      let filtered = allExpenses;  

      // Strict filter for one day if selected
      if (selectedDate) {
        filtered = filtered.filter((exp) => exp.date === selectedDate);
      }

      // Filter by category  
      if (selectedCategory) {  
        filtered = filtered.filter((exp) => exp.category_id === selectedCategory);  
      }  

      // Filter by search query  
      if (searchQuery.trim()) {  
        const query = searchQuery.toLowerCase();  
        filtered = filtered.filter((exp) =>  
          exp.note?.toLowerCase().includes(query)  
        );  
      }  

      // Group by date  
      const grouped = {};  
      filtered.forEach((expense) => {  
        if (!grouped[expense.date]) {  
          grouped[expense.date] = [];  
        }  
        grouped[expense.date].push(expense);  
      });  

      // Convert to SectionList format  
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
              // Remove from state  
              setAllExpenses(  
                allExpenses.filter((exp) => exp.id !== expenseId)  
              );  
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

  const handleResetFilters = () => {  
    setSelectedCategory(null);  
    setSearchQuery('');  
    setSelectedDate(null);
  };  

  const formatDate = (dateStr) => {  
    const date = new Date(dateStr + 'T00:00:00');  
    return date.toLocaleDateString('id-ID', {  
      weekday: 'long',  
      year: 'numeric',  
      month: 'long',  
      day: 'numeric',  
    });  
  };  

  const getExpenseDates = () => {  
    return allExpenses.map((exp) => exp.date);  
  };  

  if (isLoading) {  
    return (  
      <View style={styles.container}>  
        <ActivityIndicator size="large" color="#0000ff" />  
      </View>  
    );  
  }  

  let displayedAmount = expenses.reduce((sectionSum, section) => sectionSum + section.summary, 0);
  let displayedLength = expenses.reduce((sectionLen, section) => sectionLen + section.data.length, 0);

  return (  
    <View style={styles.container}>  
      {/* Header */}  
      <View style={styles.header}>  
        <Text style={styles.title}>History</Text>  
      </View>  

      <ScrollView  
        style={styles.content}  
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}  
        nestedScrollEnabled={true}
      >  
        {/* Calendar */}  
        <ExpenseCalendar  
          selectedDate={selectedDate || new Date().toISOString().split('T')[0]}  
          onDateSelect={setSelectedDate}  
          expenseDates={getExpenseDates()}  
        />  

        {/* Filters */}  
        <ExpenseFilters  
          selectedCategory={selectedCategory}  
          onCategoryChange={setSelectedCategory}  
          searchQuery={searchQuery}  
          onSearchChange={setSearchQuery}  
          onReset={handleResetFilters}  
        />  

        {/* Summary Cards */}  
        <View style={styles.summarySection}>  
          <View style={styles.summaryCard}>  
            <Text style={styles.summaryLabel}>Total Result</Text>  
            <Text style={styles.summaryValue}>{displayedLength}</Text>  
          </View>  

          <View style={styles.summaryCard}>  
            <Text style={styles.summaryLabel}>Total Amount</Text>  
            <Text style={styles.summaryValue}>  
              Rp {displayedAmount.toLocaleString('id-ID')}  
            </Text>  
          </View>  
        </View>  

        {/* Error Message */}  
        {error && (  
          <View style={styles.errorBox}>  
            <Text style={styles.errorText}>{error}</Text>  
          </View>  
        )}  

        {/* Expenses List */}  
        {expenses.length === 0 ? (  
          <View style={styles.emptyState}>  
            <Text style={styles.emptyStateIcon}>💸</Text>  
            <Text style={styles.emptyStateText}>No expenses found</Text>  
            <Text style={styles.emptyStateSubText}>  
              Try adjusting your filters or date
            </Text>  
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
                  onLongPress={() =>  
                    handleDeleteExpense(item.id, item.note)  
                  }  
                >  
                  <View style={styles.expenseLeft}>  
                    <View  
                      style={[  
                        styles.categoryColor,  
                        {  
                          backgroundColor:  
                            item.budget_categories?.color || '#999',  
                        },  
                      ]}  
                    />  
                    <View style={styles.expenseText}>  
                      <Text style={styles.expenseName}>  
                        {item.budget_categories?.name || 'Unknown'}  
                      </Text>  
                      {item.note && (  
                        <Text style={styles.expenseNote}>{item.note}</Text>  
                      )}  
                    </View>  
                  </View>  
                  <Text style={styles.expenseAmount}>  
                    Rp {item.amount.toLocaleString('id-ID')}  
                  </Text>  
                </TouchableOpacity>  
                <Text style={styles.deleteHint}>Hold to delete</Text>  
              </View>  
            )}  
            renderSectionHeader={({ section: { title, summary } }) => (  
              <View style={styles.sectionHeader}>  
                <Text style={styles.sectionTitle}>{title}</Text>  
                <Text style={styles.sectionSummary}>  
                  Rp {summary.toLocaleString('id-ID')}  
                </Text>  
              </View>  
            )}  
          />  
        )}  

        {/* Spacer */}  
        <View style={{ height: 60 }} />  
      </ScrollView>  
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
  content: {  
    flex: 1,  
    paddingHorizontal: 16,  
    paddingTop: 12,  
  },  
  summarySection: {  
    flexDirection: 'row',  
    gap: 10,  
    marginBottom: 16,  
  },  
  summaryCard: {  
    flex: 1,  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
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
  errorBox: {  
    backgroundColor: '#ffebee',  
    padding: 12,  
    borderRadius: 8,  
    marginBottom: 16,  
  },  
  errorText: {  
    color: '#c62828',  
    fontSize: 13,  
  },  
  sectionHeader: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    backgroundColor: '#e3f2fd',  
    paddingVertical: 10,  
    paddingHorizontal: 12,  
    marginTop: 12,  
    borderRadius: 8,  
    marginBottom: 8,
  },  
  sectionTitle: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#1565c0',  
  },  
  sectionSummary: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: '#1976d2',  
  },  
  expenseItem: {  
    marginBottom: 0,  
  },  
  expenseContent: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    backgroundColor: 'white',  
    padding: 12,  
    borderRadius: 8,  
    marginBottom: 2,
  },  
  expenseLeft: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    flex: 1,  
  },  
  categoryColor: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 10,  
  },  
  expenseText: {  
    flex: 1,  
  },  
  expenseName: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },  
  expenseNote: {  
    fontSize: 11,  
    color: '#999',  
    marginTop: 2,  
  },  
  expenseAmount: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: '#d32f2f',  
  },  
  deleteHint: {  
    fontSize: 9,  
    color: '#ccc',  
    textAlign: 'center',  
    marginBottom: 8,  
    marginTop: 2,
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
