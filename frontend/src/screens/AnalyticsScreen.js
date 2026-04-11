// src/screens/AnalyticsScreen.js  
import React, { useState, useEffect, useCallback } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  ScrollView,  
  ActivityIndicator,  
  TouchableOpacity,  
  RefreshControl,  
  Dimensions,  
} from 'react-native';  
import { PieChart, LineChart } from 'react-native-chart-kit';  
import {  
  calculateMonthlySummary,  
  getCategoryBreakdown,  
  getDailySpendingTrend,  
  getTopCategories,  
  getDailyAverage,  
} from '../api/analyticsService';  

const chartWidth = Dimensions.get('window').width - 32;  

export default function AnalyticsScreen() {  
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));  
  const [summary, setSummary] = useState(null);  
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);  
  const [dailyTrend, setDailyTrend] = useState([]);  
  const [topCategories, setTopCategories] = useState([]);  
  const [dailyAverage, setDailyAverage] = useState(0);  
  const [isLoading, setIsLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  
  const [error, setError] = useState(null);  

  useEffect(() => {  
    loadAnalytics();  
  }, [month]);  

  const loadAnalytics = async () => {  
    try {  
      setIsLoading(true);  
      setError(null);  

      const [summaryData, categoryData, trendData, topCatData, avgData] =  
        await Promise.all([  
          calculateMonthlySummary(month),  
          getCategoryBreakdown(month),  
          getDailySpendingTrend(month),  
          getTopCategories(month, 5),  
          getDailyAverage(month),  
        ]);  

      setSummary(summaryData);  
      setCategoryBreakdown(categoryData);  
      setDailyTrend(trendData);  
      setTopCategories(topCatData);  
      setDailyAverage(avgData);  
    } catch (err) {  
      setError(err.message);  
      console.error('Error loading analytics:', err);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  const onRefresh = async () => {  
    setRefreshing(true);  
    await loadAnalytics();  
    setRefreshing(false);  
  };  

  const changeToPreviousMonth = () => {  
    const date = new Date(month + '-01');  
    date.setMonth(date.getMonth() - 1);  
    setMonth(date.toISOString().substring(0, 7));  
  };  

  const changeToNextMonth = () => {  
    const date = new Date(month + '-01');  
    date.setMonth(date.getMonth() + 1);  
    setMonth(date.toISOString().substring(0, 7));  
  };  

  const isCurrentMonth = month === new Date().toISOString().substring(0, 7);  

  if (isLoading) {  
    return (  
      <View style={styles.container}>  
        <ActivityIndicator size="large" color="#0000ff" />  
      </View>  
    );  
  }  

  // Prepare pie chart data  
  const pieChartData =  
    categoryBreakdown.length > 0  
      ? categoryBreakdown.map((cat) => ({  
          name: cat.name,  
          amount: cat.amount,  
          color: cat.color,  
          legendFontColor: '#7F8487',  
          legendFontSize: 12,  
        }))  
      : [];  

  // Prepare line chart data  
  const lineChartData = {  
    labels: dailyTrend  
      .filter((_, i) => i % Math.ceil(dailyTrend.length / 7) === 0)  
      .map((d) => `${d.day}`),  
    datasets: [  
      {  
        data: dailyTrend.map((d) => d.amount),  
        color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,  
        strokeWidth: 2,  
      },  
    ],  
  };  

  return (  
    <View style={styles.container}>  
      {/* Header */}  
      <View style={styles.header}>  
        <Text style={styles.title}>Analytics</Text>  
      </View>  

      <ScrollView  
        style={styles.content}  
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}  
      >  
        {/* Month Selector */}  
        <View style={styles.monthSelector}>  
          <TouchableOpacity onPress={changeToPreviousMonth}>  
            <Text style={styles.monthBtn}>← Prev</Text>  
          </TouchableOpacity>  

          <Text style={styles.monthLabel}>{month}</Text>  

          <TouchableOpacity onPress={changeToNextMonth} disabled={isCurrentMonth}>  
            <Text style={[styles.monthBtn, isCurrentMonth && { opacity: 0.5 }]}>  
              Next →  
            </Text>  
          </TouchableOpacity>  
        </View>  

        {/* Error Message */}  
        {error && (  
          <View style={styles.errorBox}>  
            <Text style={styles.errorText}>{error}</Text>  
          </View>  
        )}  

        {/* Summary Cards */}  
        {summary && (  
          <View style={styles.summarySection}>  
            <View style={styles.summaryCard}>  
              <Text style={styles.summaryLabel}>Income</Text>  
              <Text style={styles.summaryValue}>  
                Rp {summary.income.toLocaleString('id-ID')}  
              </Text>  
            </View>  

            <View style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>  
              <Text style={styles.summaryLabel}>Spending</Text>  
              <Text style={[styles.summaryValue, { color: '#d32f2f' }]}>  
                Rp {summary.totalSpending.toLocaleString('id-ID')}  
              </Text>  
            </View>  

            <View  
              style={[  
                styles.summaryCard,  
                {  
                  backgroundColor: summary.remaining >= 0 ? '#e8f5e9' : '#ffebee',  
                },  
              ]}  
            >  
              <Text style={styles.summaryLabel}>Remaining</Text>  
              <Text  
                style={[  
                  styles.summaryValue,  
                  { color: summary.remaining >= 0 ? '#2e7d32' : '#d32f2f' },  
                ]}  
              >  
                Rp {summary.remaining.toLocaleString('id-ID')}  
              </Text>  
            </View>  
          </View>  
        )}  

        {/* Budget Usage */}  
        {summary && (  
          <View style={styles.usageSection}>  
            <Text style={styles.sectionTitle}>Budget Usage</Text>  
            <View style={styles.usageStats}>  
              <View style={styles.usageStat}>  
                <Text style={styles.usageLabel}>Usage</Text>  
                <Text style={styles.usageValue}>  
                  {Math.round(summary.budgetUsagePercent)}%  
                </Text>  
              </View>  
              <View style={styles.usageBar}>  
                <View  
                  style={[  
                    styles.usageBarFill,  
                    {  
                      width: `${Math.min(summary.budgetUsagePercent, 100)}%`,  
                      backgroundColor:  
                        summary.budgetUsagePercent > 100 ? '#d32f2f' : '#4caf50',  
                    },  
                  ]}  
                />  
              </View>  
              <View style={styles.usageStat}>  
                <Text style={styles.usageLabel}>Expenses</Text>  
                <Text style={styles.usageValue}>{summary.expenseCount}</Text>  
              </View>  
            </View>  
          </View>  
        )}  

        {/* Daily Average */}  
        {dailyAverage > 0 && (  
          <View style={styles.card}>  
            <Text style={styles.cardLabel}>Average Daily Spending</Text>  
            <Text style={styles.cardValue}>  
              Rp {dailyAverage.toLocaleString('id-ID')}  
            </Text>  
          </View>  
        )}  

        {/* Category Breakdown Chart */}  
        {pieChartData.length > 0 && (  
          <View style={styles.chartSection}>  
            <Text style={styles.sectionTitle}>Spending by Category</Text>  
            <PieChart  
              data={pieChartData}  
              width={chartWidth}  
              height={220}  
              chartConfig={{  
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,  
              }}  
              accessor="amount"  
              backgroundColor="transparent"  
              paddingLeft="15"  
              absolute  
            />  
          </View>  
        )}  

        {/* Daily Spending Trend */}  
        {dailyTrend.length > 0 && (  
          <View style={styles.chartSection}>  
            <Text style={styles.sectionTitle}>Daily Spending Trend</Text>  
            <LineChart  
              data={lineChartData}  
              width={chartWidth}  
              height={220}  
              chartConfig={{  
                backgroundColor: '#fff',  
                backgroundGradientFrom: '#fff',  
                backgroundGradientTo: '#fff',  
                color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,  
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,  
                strokeWidth: 2,  
              }}  
              bezier  
            />  
          </View>  
        )}  

        {/* Top Categories */}  
        {topCategories.length > 0 && (  
          <View style={styles.topCategoriesSection}>  
            <Text style={styles.sectionTitle}>Top Categories</Text>  
            {topCategories.map((cat, index) => (  
              <View key={index} style={styles.topCategoryItem}>  
                <View style={styles.topCategoryInfo}>  
                  <View  
                    style={[  
                      styles.topCategoryColor,  
                      { backgroundColor: cat.color },  
                    ]}  
                  />  
                  <View style={styles.topCategoryText}>  
                    <Text style={styles.topCategoryName}>{cat.name}</Text>  
                    <Text style={styles.topCategoryCount}>  
                      {cat.count} transaction{cat.count !== 1 ? 's' : ''}  
                    </Text>  
                  </View>  
                </View>  
                <Text style={styles.topCategoryAmount}>  
                  Rp {cat.amount.toLocaleString('id-ID')}  
                </Text>  
              </View>  
            ))}  
          </View>  
        )}  

        {/* Empty State */}  
        {summary && summary.expenseCount === 0 && (  
          <View style={styles.emptyState}>  
            <Text style={styles.emptyStateText}>📊 No expenses this month</Text>  
            <Text style={styles.emptyStateSubText}>  
              Start tracking your spending!  
            </Text>  
          </View>  
        )}  
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
  monthSelector: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
    marginBottom: 16,  
  },  
  monthBtn: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#1976d2',  
  },  
  monthLabel: {  
    fontSize: 14,  
    fontWeight: '600',  
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
  summarySection: {  
    gap: 10,  
    marginBottom: 16,  
  },  
  summaryCard: {  
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
  usageSection: {  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
    marginBottom: 16,  
  },  
  usageStats: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    gap: 10,  
    marginTop: 10,  
  },  
  usageStat: {  
    alignItems: 'center',  
  },  
  usageLabel: {  
    fontSize: 10,  
    color: '#999',  
    marginBottom: 4,  
  },  
  usageValue: {  
    fontSize: 16,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  usageBar: {  
    flex: 1,  
    height: 8,  
    backgroundColor: '#f0f0f0',  
    borderRadius: 4,  
    overflow: 'hidden',  
  },  
  usageBarFill: {  
    height: '100%',  
    borderRadius: 4,  
  },  
  card: {  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
    marginBottom: 16,  
  },  
  cardLabel: {  
    fontSize: 12,  
    color: '#999',  
    marginBottom: 6,  
  },  
  cardValue: {  
    fontSize: 20,  
    fontWeight: 'bold',  
    color: '#1976d2',  
  },  
  sectionTitle: {  
    fontSize: 15,  
    fontWeight: '600',  
    marginBottom: 12,  
    color: '#333',  
  },  
  chartSection: {  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
    marginBottom: 16,  
    alignItems: 'center',  
  },  
  topCategoriesSection: {  
    backgroundColor: 'white',  
    padding: 14,  
    borderRadius: 12,  
    marginBottom: 100,  
  },  
  topCategoryItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    paddingVertical: 10,  
    borderBottomWidth: 1,  
    borderBottomColor: '#f0f0f0',  
  },  
  topCategoryInfo: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    flex: 1,  
  },  
  topCategoryColor: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 10,  
  },  
  topCategoryText: {  
    flex: 1,  
  },  
  topCategoryName: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },  
  topCategoryCount: {  
    fontSize: 11,  
    color: '#999',  
    marginTop: 2,  
  },  
  topCategoryAmount: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: '#d32f2f',  
  },  
  emptyState: {  
    justifyContent: 'center',  
    alignItems: 'center',  
    paddingVertical: 60,  
  },  
  emptyStateText: {  
    fontSize: 16,  
    fontWeight: '600',  
    color: '#999',  
    marginBottom: 8,  
  },  
  emptyStateSubText: {  
    fontSize: 13,  
    color: '#bbb',  
  },  
});
