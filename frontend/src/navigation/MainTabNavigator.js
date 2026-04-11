// src/navigation/MainTabNavigator.js (FINAL UPDATED WITH NEW SCREENS)  
import React from 'react';  
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';  
import HomeScreen from '../screens/HomeScreen';  
import AnalyticsScreen from '../screens/AnalyticsScreen';  
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';  
import BudgetVsActualScreen from '../screens/BudgetVsActualScreen';  
import IncomeTrackingScreen from '../screens/IncomeTrackingScreen';  
import RecurringExpensesScreen from '../screens/RecurringExpensesScreen';  
import SettingsScreen from '../screens/SettingsScreen';  

const TAB_ICONS = {  
  home: '🏠',  
  budget: '📊',  
  income: '💰',  
  history: '📋',  
  recurring: '🔄',  
  settings: '⚙️',  
};  

export default function MainTabNavigator() {  
  const [activeTab, setActiveTab] = React.useState('home');  

  return (  
    <View style={styles.container}>  
      {/* Active Screen */}  
      {activeTab === 'home' && <HomeScreen />}  
      {activeTab === 'budget' && <BudgetVsActualScreen />}  
      {activeTab === 'income' && <IncomeTrackingScreen />}  
      {activeTab === 'history' && <ExpenseHistoryScreen />}  
      {activeTab === 'recurring' && <RecurringExpensesScreen />}  
      {activeTab === 'settings' && <SettingsScreen />}  

      {/* Tab Bar - Horizontal Scroll */}  
      <View style={styles.tabBar}>  
        <TouchableOpacity  
          style={[styles.tab, activeTab === 'home' && styles.activeTab]}  
          onPress={() => setActiveTab('home')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.home}</Text>  
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeLabel]}>  
            Home  
          </Text>  
        </TouchableOpacity>  

        <TouchableOpacity  
          style={[styles.tab, activeTab === 'budget' && styles.activeTab]}  
          onPress={() => setActiveTab('budget')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.budget}</Text>  
          <Text style={[styles.tabLabel, activeTab === 'budget' && styles.activeLabel]}>  
            Budget  
          </Text>  
        </TouchableOpacity>  

        <TouchableOpacity  
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}  
          onPress={() => setActiveTab('income')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.income}</Text>  
          <Text style={[styles.tabLabel, activeTab === 'income' && styles.activeLabel]}>  
            Income  
          </Text>  
        </TouchableOpacity>  

        <TouchableOpacity  
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}  
          onPress={() => setActiveTab('history')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.history}</Text>  
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.activeLabel]}>  
            History  
          </Text>  
        </TouchableOpacity>  

        <TouchableOpacity  
          style={[styles.tab, activeTab === 'recurring' && styles.activeTab]}  
          onPress={() => setActiveTab('recurring')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.recurring}</Text>  
          <Text style={[styles.tabLabel, activeTab === 'recurring' && styles.activeLabel]}>  
            Recurring  
          </Text>  
        </TouchableOpacity>  

        <TouchableOpacity  
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}  
          onPress={() => setActiveTab('settings')}  
        >  
          <Text style={styles.tabIcon}>{TAB_ICONS.settings}</Text>  
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.activeLabel]}>  
            Settings  
          </Text>  
        </TouchableOpacity>  
      </View>  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#fff',  
  },  
  tabBar: {  
    flexDirection: 'row',  
    height: 60,  
    borderTopWidth: 1,  
    borderTopColor: '#eee',  
    backgroundColor: 'white',  
    paddingBottom: 5,  
  },  
  tab: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  activeTab: {  
    borderTopWidth: 3,  
    borderTopColor: '#1976d2',  
  },  
  tabIcon: {  
    fontSize: 18,  
    marginBottom: 2,  
  },  
  tabLabel: {  
    fontSize: 8,  
    color: '#999',  
    fontWeight: '500',  
  },  
  activeLabel: {  
    color: '#1976d2',  
    fontWeight: '600',  
  },  
});
