// src/screens/BudgetVsActualScreen.js  
import React, { useState, useEffect } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  ScrollView,  
  TouchableOpacity,  
  ActivityIndicator,  
  Alert,  
  RefreshControl,  
} from 'react-native';  
import {  
  getBudgetVsActual,  
  getBudgetVsActualSummary,  
  getSpendingRecommendations,  
} from '../api/comparisonService';  

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
    if (month === 1) {  
      setCurrentMonth(`${year - 1}-12`);  
    } else {  
      setCurrentMonth(`${year}-${String(month - 1).padStart(2, '0')}`);  
    }  
  };  

  const handleNextMonth = () => {  
    const [year, month] = currentMonth.split('-').map(Number);  
    if (month === 12) {  
      setCurrentMonth(`${year + 1}-01`);  
    } else {  
      setCurrentMonth(`${year}-${String(month + 1).padStart(2, '0')}`);  
    }  
  };  

  const getMonthLabel = () => {  
    const [year, month] = currentMonth.split('-').map(Number);  
    return `${MONTHS[month - 1]} ${year}`;  
  };  

  const getStatusColor = (status) => {  
    switch (status) {  
      case 'over':  
        return '#d32f2f';  
      case 'under':  
        return '#4caf50';  
      case 'on-track':  
        return '#1976d2';  
      default:  
        return '#999';  
    }  
  };  

  const getStatusIcon = (status) => {  
    switch (status) {  
      case 'over':  
        return '🚨';  
      case 'under':  
        return '✅';  
      case 'on-track':  
        return '📊';  
      default:  
        return '❓';  
    }  
  };  

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
        <Text style={styles.title}>Budget vs Actual</Text>  
      </View>  

      <ScrollView  
        style={styles.content}  
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}  
      >  
        {/* Month Navigation */}  
        <View style={styles.monthNav}>  
          <TouchableOpacity onPress={handlePrevMonth}>  
            <Text style={styles.navBtn}>←</Text>  
          </TouchableOpacity>  
          <Text style={styles.monthLabel}>{getMonthLabel()}</Text>  
          <TouchableOpacity onPress={handleNextMonth}>  
            <Text style={styles.navBtn}>→</Text>  
          </TouchableOpacity>  
        </View>  

        {/* Summary Cards */}  
        {summary && (  
          <>  
            <View style={styles.summaryRow}>  
              <View style={styles.summaryCard}>  
                <Text style={styles.summaryLabel}>Total Budget</Text>  
                <Text style={styles.summaryValue}>  
                  Rp {summary.totalBudget.toLocaleString('id-ID')}  
                </Text>  
              </View>  
              <View style={styles.summaryCard}>  
                <Text style={styles.summaryLabel}>Total Spent</Text>  
                <Text style={[styles.summaryValue, { color: '#d32f2f' }]}>  
                  Rp {summary.totalActual.toLocaleString('id-ID')}  
                </Text>  
              </View>  
            </View>  

            {/* Utilization Bar */}  
            <View style={styles.utilizationCard}>  
              <View style={styles.utilizationHeader}>  
                <Text style={styles.utilizationLabel}>Overall Utilization</Text>  
                <Text style={styles.utilizationPercent}>  
                  {Math.round(summary.utilizationPercent)}%  
                </Text>  
              </View>  
              <View style={styles.utilizationBarContainer}>  
                <View  
                  style={[  
                    styles.utilizationBar,  
                    {  
                      width: `${Math.min(summary.utilizationPercent, 100)}%`,  
                      backgroundColor:  
                        summary.utilizationPercent > 100  
                          ? '#d32f2f'  
                          : summary.utilizationPercent > 80  
                          ? '#ff9800'  
                          : '#4caf50',  
                    },  
                  ]}  
                />  
              </View>  
              <View style={styles.utilizationStats}>  
                <View style={styles.stat}>  
                  <Text style={styles.statLabel}>On Track</Text>  
                  <Text style={styles.statValue}>{summary.onTrackCount}</Text>  
                </View>  
                <View style={styles.stat}>  
                  <Text style={styles.statLabel}>Under</Text>  
                  <Text style={[styles.statValue, { color: '#4caf50' }]}>  
                    {summary.underBudgetCount}  
                  </Text>  
                </View>  
                <View style={styles.stat}>  
                  <Text style={styles.statLabel}>Over</Text>  
                  <Text style={[styles.statValue, { color: '#d32f2f' }]}>  
                    {summary.overBudgetCount}  
                  </Text>  
                </View>  
              </View>  
            </View>  

            {/* Remaining */}  
            <View style={styles.remainingCard}>  
              <Text style={styles.remainingLabel}>Remaining</Text>  
              <Text  
                style={[  
                  styles.remainingValue,  
                  {  
                    color: summary.totalVariance >= 0 ? '#4caf50' : '#d32f2f',  
                  },  
                ]}  
              >  
                Rp {summary.totalVariance.toLocaleString('id-ID')}  
              </Text>  
            </View>  
          </>  
        )}  

        {/* Recommendations */}  
        {recommendations.length > 0 && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>💡 Recommendations</Text>  
            {recommendations.map((rec, idx) => (  
              <View  
                key={idx}  
                style={[  
                  styles.recommendationCard,  
                  {  
                    borderLeftColor:  
                      rec.type === 'warning' ? '#d32f2f' : '#ff9800',  
                  },  
                ]}  
              >  
                <Text style={styles.recIcon}>{rec.icon}</Text>  
                <View style={styles.recContent}>  
                  <Text style={styles.recMessage}>{rec.message}</Text>  
                </View>  
              </View>  
            ))}  
          </View>  
        )}  

        {/* Category Breakdown */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>📊 Category Breakdown</Text>  

          {comparison.length === 0 ? (  
            <View style={styles.emptyState}>  
              <Text style={styles.emptyStateText}>No categories</Text>  
            </View>  
          ) : (  
            <View style={styles.categoryList}>  
              {comparison.map((cat, idx) => (  
                <View key={idx} style={styles.categoryItem}>  
                  <View style={styles.categoryHeader}>  
                    <View style={styles.categoryLeft}>  
                      <Text style={styles.statusIcon}>  
                        {getStatusIcon(cat.status)}  
                      </Text>  
                      <View>  
                        <Text style={styles.categoryName}>{cat.categoryName}</Text>  
                        <Text style={styles.transactionCount}>  
                          {cat.transactionCount} transactions  
                        </Text>  
                      </View>  
                    </View>  
                    <Text  
                      style={[  
                        styles.varianceText,  
                        { color: getStatusColor(cat.status) },  
                      ]}  
                    >  
                      {cat.variance >= 0 ? '+' : '-'}Rp{' '}  
                      {Math.abs(cat.variance).toLocaleString('id-ID')}  
                    </Text>  
                  </View>  

                  {/* Budget vs Actual Bar */}  
                  <View style={styles.comparisonBar}>  
                    <View  
                      style={[  
                        styles.budgetPortion,  
                        { width: `${Math.min(cat.utilization, 100)}%` },  
                      ]}  
                    />  
                    {cat.utilization > 100 && (  
                      <View  
                        style={[  
                          styles.overBudgetPortion,  
                          {  
                            width: `${Math.min(  
                              cat.utilization - 100,  
                              100  
                            )}%`,  
                          },  
                        ]}  
                      />  
                    )}  
                  </View>  

                  {/* Stats */}  
                  <View style={styles.categoryStats}>  
                    <View style={styles.stat}>  
                      <Text style={styles.statLabel}>Budget</Text>  
                      <Text style={styles.statValue}>  
                        Rp {cat.budget.toLocaleString('id-ID')}  
                      </Text>  
                    </View>  
                    <View style={styles.stat}>  
                      <Text style={styles.statLabel}>Actual</Text>  
                      <Text  
                        style={[  
                          styles.statValue,  
                          { color: getStatusColor(cat.status) },  
                        ]}  
                      >  
                        Rp {cat.actual.toLocaleString('id-ID')}  
                      </Text>  
                    </View>  
                    <View style={styles.stat}>  
                      <Text style={styles.statLabel}>Usage</Text>  
                      <Text style={styles.statValue}>  
                        {Math.round(cat.utilization)}%  
                      </Text>  
                    </View>  
                  </View>  
                </View>  
              ))}  
            </View>  
          )}  
        </View>  

        {/* Spacer */}  
        <View style={{ height: 30 }} />  
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
  monthNav: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    backgroundColor: 'white',  
    borderRadius: 12,  
    paddingVertical: 12,  
    paddingHorizontal: 14,  
    marginBottom: 16,  
  },  
  navBtn: {  
    fontSize: 18,  
    color: '#1976d2',  
    fontWeight: 'bold',  
  },  
  monthLabel: {  
    fontSize: 14,  
    fontWeight: '600',  
    color: '#333',  
  },  
  summaryRow: {  
    flexDirection: 'row',  
    gap: 10,  
    marginBottom: 12,  
  },  
  summaryCard: {  
    flex: 1,  
    backgroundColor: 'white',  
    padding: 12,  
    borderRadius: 12,  
    borderLeftWidth: 4,  
    borderLeftColor: '#1976d2',  
  },  
  summaryLabel: {  
    fontSize: 11,  
    color: '#999',  
    marginBottom: 4,  
  },  
  summaryValue: {  
    fontSize: 16,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  utilizationCard: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    padding: 14,  
    marginBottom: 12,  
  },  
  utilizationHeader: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    marginBottom: 10,  
  },  
  utilizationLabel: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },  
  utilizationPercent: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: '#1976d2',  
  },  
  utilizationBarContainer: {  
    height: 10,  
    backgroundColor: '#f0f0f0',  
    borderRadius: 5,  
    overflow: 'hidden',  
    marginBottom: 12,  
  },  
  utilizationBar: {  
    height: '100%',  
    borderRadius: 5,  
  },  
  utilizationStats: {  
    flexDirection: 'row',  
    justifyContent: 'space-around',  
  },  
  stat: {  
    alignItems: 'center',  
  },  
  statLabel: {  
    fontSize: 10,  
    color: '#999',  
    marginBottom: 2,  
  },  
  statValue: {  
    fontSize: 14,  
    fontWeight: '700',  
    color: '#333',  
  },  
  remainingCard: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    padding: 14,  
    marginBottom: 16,  
    alignItems: 'center',  
  },  
  remainingLabel: {  
    fontSize: 12,  
    color: '#999',  
    marginBottom: 6,  
  },  
  remainingValue: {  
    fontSize: 22,  
    fontWeight: 'bold',  
  },  
  section: {  
    marginBottom: 20,  
  },  
  sectionTitle: {  
    fontSize: 15,  
    fontWeight: '600',  
    color: '#333',  
    marginBottom: 10,  
  },  
  recommendationCard: {  
    flexDirection: 'row',  
    backgroundColor: 'white',  
    borderRadius: 12,  
    borderLeftWidth: 4,  
    padding: 12,  
    marginBottom: 8,  
  },  
  recIcon: {  
    fontSize: 18,  
    marginRight: 10,  
  },  
  recContent: {  
    flex: 1,  
  },  
  recMessage: {  
    fontSize: 12,  
    color: '#333',  
    fontWeight: '500',  
  },  
  categoryList: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    overflow: 'hidden',  
  },  
  categoryItem: {  
    padding: 14,  
    borderBottomWidth: 1,  
    borderBottomColor: '#f0f0f0',  
  },  
  categoryHeader: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    marginBottom: 10,  
  },  
  categoryLeft: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    flex: 1,  
  },  
  statusIcon: {  
    fontSize: 18,  
    marginRight: 8,  
  },  
  categoryName: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },  
  transactionCount: {  
    fontSize: 11,  
    color: '#999',  
    marginTop: 2,  
  },  
  varianceText: {  
    fontSize: 13,  
    fontWeight: '700',  
  },  
  comparisonBar: {  
    flexDirection: 'row',  
    height: 8,  
    backgroundColor: '#f0f0f0',  
    borderRadius: 4,  
    overflow: 'hidden',  
    marginBottom: 10,  
  },  
  budgetPortion: {  
    height: '100%',  
    backgroundColor: '#1976d2',  
  },  
  overBudgetPortion: {  
    height: '100%',  
    backgroundColor: '#d32f2f',  
  },  
  categoryStats: {  
    flexDirection: 'row',  
    justifyContent: 'space-around',  
  },  
  emptyState: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    padding: 30,  
    alignItems: 'center',  
  },  
  emptyStateText: {  
    color: '#999',  
    fontSize: 13,  
  },  
});
