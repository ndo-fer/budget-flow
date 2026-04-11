// src/screens/IncomeTrackingScreen.js  
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
import IncomeSourceModal from '../components/IncomeSourceModal';  
import {  
  getIncomeSources,  
  getIncomeTransactions,  
  getIncomeSummary,  
  getIncomeBySource,  
} from '../api/incomeService';  

const MONTHS = [  
  'January', 'February', 'March', 'April', 'May', 'June',  
  'July', 'August', 'September', 'October', 'November', 'December',  
];  

export default function IncomeTrackingScreen() {  
  const today = new Date();  
  const [currentMonth, setCurrentMonth] = useState(  
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`  
  );  
  const [incomeSources, setIncomeSources] = useState([]);  
  const [incomeTransactions, setIncomeTransactions] = useState([]);  
  const [summary, setSummary] = useState(null);  
  const [incomeBySource, setIncomeBySource] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  
  const [modalVisible, setModalVisible] = useState(false);  
  const [selectedSource, setSelectedSource] = useState(null);  

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
          <Text style={styles.title}>Income Tracking</Text>  
          <Text style={styles.subtitle}>{incomeSources.length} sources</Text>  
        </View>  
        <TouchableOpacity  
          style={styles.addBtn}  
          onPress={handleAddSource}  
        >  
          <Text style={styles.addBtnText}>+ Add</Text>  
        </TouchableOpacity>  
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

        {/* Summary */}  
        {summary && (  
          <>  
            <View style={styles.summaryRow}>  
              <View style={styles.summaryCard}>  
                <Text style={styles.summaryLabel}>Total Income</Text>  
                <Text style={styles.summaryValue}>  
                  Rp {summary.totalIncome.toLocaleString('id-ID')}  
                </Text>  
              </View>  
              <View style={styles.summaryCard}>  
                <Text style={styles.summaryLabel}>Total Expenses</Text>  
                <Text style={[styles.summaryValue, { color: '#d32f2f' }]}>  
                  Rp {summary.totalExpenses.toLocaleString('id-ID')}  
                </Text>  
              </View>  
            </View>  

            <View style={styles.summaryCard2}>  
              <Text style={styles.summaryLabel}>Savings</Text>  
              <Text  
                style={[  
                  styles.summaryValue2,  
                  { color: summary.savings >= 0 ? '#4caf50' : '#d32f2f' },  
                ]}  
              >  
                Rp {summary.savings.toLocaleString('id-ID')}  
              </Text>  
              <View style={styles.savingsRateBar}>  
                <View  
                  style={[  
                    styles.savingsRateProgress,  
                    {  
                      width: `${Math.max(0, summary.savingsRate)}%`,  
                      backgroundColor: summary.savings >= 0 ? '#4caf50' : '#d32f2f',  
                    },  
                  ]}  
                />  
              </View>  
              <Text style={styles.savingsRateText}>  
                Savings Rate: {Math.round(summary.savingsRate)}%  
              </Text>  
            </View>  
          </>  
        )}  

        {/* Income By Source */}  
        {incomeBySource.length > 0 && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>📊 Income by Source</Text>  

            <View style={styles.sourceList}>  
              {incomeBySource.map((source, idx) => (  
                <TouchableOpacity  
                  key={idx}  
                  style={styles.sourceItem}  
                  onPress={() => handleEditSource(incomeSources.find(s => s.id === source.sourceId))}  
                >  
                  <View style={styles.sourceLeft}>  
                    <View>  
                      <Text style={styles.sourceName}>{source.sourceName}</Text>  
                      <Text style={styles.sourceFrequency}>  
                        {source.frequency} • {source.transactionCount} transactions  
                      </Text>  
                    </View>  
                  </View>  
                  <View style={styles.sourceRight}>  
                    <Text style={styles.sourceActual}>  
                      Rp {source.actualAmount.toLocaleString('id-ID')}  
                    </Text>  
                    {source.variance !== 0 && (  
                      <Text  
                        style={[  
                          styles.sourceVariance,  
                          { color: source.variance > 0 ? '#4caf50' : '#d32f2f' },  
                        ]}  
                      >  
                        {source.variance > 0 ? '+' : ''}Rp{' '}  
                        {source.variance.toLocaleString('id-ID')}  
                      </Text>  
                    )}  
                  </View>  
                </TouchableOpacity>  
              ))}  
            </View>  
          </View>  
        )}  

        {/* Income Sources */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>💰 Income Sources</Text>  

          {incomeSources.length === 0 ? (  
            <View style={styles.emptyState}>  
              <Text style={styles.emptyStateIcon}>💸</Text>  
              <Text style={styles.emptyStateText}>No income sources</Text>  
            </View>  
          ) : (  
            <View style={styles.sourceList}>  
              {incomeSources.map((source) => (  
                <TouchableOpacity  
                  key={source.id}  
                  style={styles.sourceItem}  
                  onPress={() => handleEditSource(source)}  
                >  
                  <View style={styles.sourceLeft}>  
                    <View>  
                      <Text style={styles.sourceName}>{source.source_name}</Text>  
                      <Text style={styles.sourceFrequency}>  
                        {source.frequency}  
                      </Text>  
                    </View>  
                  </View>  
                  <Text style={styles.sourceAmount}>  
                    Rp {source.amount.toLocaleString('id-ID')}  
                  </Text>  
                </TouchableOpacity>  
              ))}  
            </View>  
          )}  
        </View>  

        {/* Recent Transactions */}  
        {incomeTransactions.length > 0 && (  
          <View style={styles.section}>  
            <Text style={styles.sectionTitle}>📝 Recent Transactions</Text>  

            <View style={styles.transactionList}>  
              {incomeTransactions.slice(0, 10).map((trans) => (  
                <View key={trans.id} style={styles.transactionItem}>  
                  <View>  
                    <Text style={styles.transactionSource}>  
                      {trans.income_sources?.source_name || 'Income'}  
                    </Text>  
                    {trans.notes && (  
                      <Text style={styles.transactionNote}>{trans.notes}</Text>  
                    )}  
                    <Text style={styles.transactionDate}>{trans.date}</Text>  
                  </View>  
                  <Text style={styles.transactionAmount}>  
                    + Rp {trans.amount.toLocaleString('id-ID')}  
                  </Text>  
                </View>  
              ))}  
            </View>  
          </View>  
        )}  

        <View style={{ height: 30 }} />  
      </ScrollView>  

      {/* Modal */}  
      <IncomeSourceModal  
        visible={modalVisible}  
        onClose={() => setModalVisible(false)}  
        onSave={loadData}  
        incomeSource={selectedSource}  
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
    borderLeftColor: '#4caf50',  
  },  
  summaryCard2: {  
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
    marginBottom: 4,  
  },  
  summaryValue: {  
    fontSize: 16,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  summaryValue2: {  
    fontSize: 20,  
    fontWeight: 'bold',  
    marginBottom: 10,  
  },  
  savingsRateBar: {  
    height: 6,  
    backgroundColor: '#f0f0f0',  
    borderRadius: 3,  
    overflow: 'hidden',  
    marginBottom: 8,  
  },  
  savingsRateProgress: {  
    height: '100%',  
    borderRadius: 3,  
  },  
  savingsRateText: {  
    fontSize: 12,  
    color: '#999',  
    textAlign: 'center',  
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
  sourceList: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    overflow: 'hidden',  
  },  
  sourceItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    padding: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: '#f0f0f0',  
  },  
  sourceLeft: {  
    flex: 1,  
  },  
  sourceRight: {  
    alignItems: 'flex-end',  
  },  
  sourceName: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },  
  sourceFrequency: {  
    fontSize: 11,  
    color: '#999',  
    marginTop: 2,  
  },  
  sourceAmount: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: '#4caf50',  
  },  
  sourceActual: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: '#4caf50',  
  },  
  sourceVariance: {  
    fontSize: 11,  
    fontWeight: '600',  
    marginTop: 2,  
  },  
  transactionList: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    overflow: 'hidden',  
  },  
  transactionItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'flex-start',  
    padding: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: '#f0f0f0',  
  },  
  transactionSource: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },  
  transactionNote: {  
    fontSize: 11,  
    color: '#999',  
    marginTop: 2,  
  },  
  transactionDate: {  
    fontSize: 10,  
    color: '#bbb',  
    marginTop: 4,  
  },  
  transactionAmount: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: '#4caf50',  
  },  
  emptyState: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    padding: 30,  
    alignItems: 'center',  
  },  
  emptyStateIcon: {  
    fontSize: 48,  
    marginBottom: 12,  
  },  
  emptyStateText: {  
    color: '#999',  
    fontSize: 13,  
  },  
});
