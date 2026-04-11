// src/components/BudgetSummary.js  
import React from 'react';  
import { View, Text, StyleSheet } from 'react-native';  

export default function BudgetSummary({ budgetStatus, type = 'monthly' }) {  
  if (!budgetStatus) {  
    return (  
      <View style={styles.container}>  
        <Text style={styles.loadingText}>Loading budget info...</Text>  
      </View>  
    );  
  }  

  const getProgressColor = (level) => {  
    switch (level) {  
      case 'danger':  
        return '#d32f2f';  
      case 'warning':  
        return '#ff9800';  
      case 'info':  
        return '#1976d2';  
      case 'safe':  
        return '#4caf50';  
      default:  
        return '#999';  
    }  
  };  

  const label =  
    type === 'monthly'  
      ? 'Monthly Budget'  
      : type === 'daily'  
      ? 'Today\'s Budget'  
      : 'Category Budget';  

  return (  
    <View style={styles.container}>  
      <View style={styles.header}>  
        <Text style={styles.label}>{label}</Text>  
        <Text  
          style={[  
            styles.status,  
            {  
              color:  
                budgetStatus.alertLevel === 'danger'  
                  ? '#d32f2f'  
                  : budgetStatus.alertLevel === 'warning'  
                  ? '#ff9800'  
                  : '#4caf50',  
            },  
          ]}  
        >  
          {Math.round(budgetStatus.percentUsed)}% Used  
        </Text>  
      </View>  

      {/* Progress Bar */}  
      <View style={styles.progressContainer}>  
        <View  
          style={[  
            styles.progressBar,  
            {  
              width: `${Math.min(budgetStatus.percentUsed, 100)}%`,  
              backgroundColor: getProgressColor(budgetStatus.alertLevel),  
            },  
          ]}  
        />  
      </View>  

      {/* Stats */}  
      <View style={styles.stats}>  
        <View style={styles.stat}>  
          <Text style={styles.statLabel}>Budget</Text>  
          <Text style={styles.statValue}>  
            Rp {(budgetStatus.income || budgetStatus.dailyBudget || budgetStatus.budget).toLocaleString(  
              'id-ID'  
            )}  
          </Text>  
        </View>  

        <View style={styles.stat}>  
          <Text style={styles.statLabel}>Spent</Text>  
          <Text style={styles.statValue}>  
            Rp {(budgetStatus.totalSpending || budgetStatus.todaySpending || budgetStatus.spending).toLocaleString(  
              'id-ID'  
            )}  
          </Text>  
        </View>  

        <View style={styles.stat}>  
          <Text style={styles.statLabel}>Remaining</Text>  
          <Text  
            style={[  
              styles.statValue,  
              {  
                color: budgetStatus.remaining >= 0 ? '#4caf50' : '#d32f2f',  
              },  
            ]}  
          >  
            Rp {budgetStatus.remaining.toLocaleString('id-ID')}  
          </Text>  
        </View>  
      </View>  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    padding: 14,  
    marginBottom: 14,  
  },  
  loadingText: {  
    textAlign: 'center',  
    color: '#999',  
    fontSize: 12,  
  },  
  header: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    marginBottom: 10,  
  },  
  label: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },  
  status: {  
    fontSize: 13,  
    fontWeight: '700',  
  },  
  progressContainer: {  
    height: 8,  
    backgroundColor: '#f0f0f0',  
    borderRadius: 4,  
    overflow: 'hidden',  
    marginBottom: 12,  
  },  
  progressBar: {  
    height: '100%',  
    borderRadius: 4,  
  },  
  stats: {  
    flexDirection: 'row',  
    justifyContent: 'space-around',  
  },  
  stat: {  
    alignItems: 'center',  
  },  
  statLabel: {  
    fontSize: 11,  
    color: '#999',  
    marginBottom: 4,  
  },  
  statValue: {  
    fontSize: 12,  
    fontWeight: '700',  
    color: '#333',  
  },  
});
