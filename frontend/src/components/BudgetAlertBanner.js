// src/components/BudgetAlertBanner.js  
import React from 'react';  
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';  

export default function BudgetAlertBanner({ alertStatus, onPress }) {  
  if (!alertStatus || alertStatus.alertLevel === 'safe') {  
    return null;  
  }  

  const getAlertConfig = (level) => {  
    switch (level) {  
      case 'danger':  
        return {  
          icon: '🚨',  
          bgColor: '#ffebee',  
          textColor: '#c62828',  
          borderColor: '#c62828',  
          title: 'Over Budget!',  
          message: `You spent Rp ${Math.abs(alertStatus.remaining).toLocaleString('id-ID')} over`,  
        };  
      case 'warning':  
        return {  
          icon: '⚠️',  
          bgColor: '#fff3e0',  
          textColor: '#e65100',  
          borderColor: '#ff9800',  
          title: 'Budget Alert',  
          message: `${Math.round(alertStatus.percentUsed)}% spent, ${Math.round(100 - alertStatus.percentUsed)}% remaining`,  
        };  
      case 'info':  
        return {  
          icon: 'ℹ️',  
          bgColor: '#e3f2fd',  
          textColor: '#1565c0',  
          borderColor: '#1976d2',  
          title: 'Mid-Budget',  
          message: `${Math.round(alertStatus.percentUsed)}% of budget used`,  
        };  
      default:  
        return null;  
    }  
  };  

  const config = getAlertConfig(alertStatus.alertLevel);  

  return (  
    <TouchableOpacity onPress={onPress}>  
      <View  
        style={[  
          styles.container,  
          {  
            backgroundColor: config.bgColor,  
            borderLeftColor: config.borderColor,  
          },  
        ]}  
      >  
        <Text style={styles.icon}>{config.icon}</Text>  
        <View style={styles.content}>  
          <Text style={[styles.title, { color: config.textColor }]}>  
            {alertStatus.categoryName ? `${alertStatus.categoryName} - ${config.title}` : config.title}  
          </Text>  
          <Text style={[styles.message, { color: config.textColor }]}>  
            {config.message}  
          </Text>  
        </View>  
      </View>  
    </TouchableOpacity>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    borderLeftWidth: 4,  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 12,  
  },  
  icon: {  
    fontSize: 20,  
    marginRight: 10,  
  },  
  content: {  
    flex: 1,  
  },  
  title: {  
    fontSize: 13,  
    fontWeight: '700',  
    marginBottom: 2,  
  },  
  message: {  
    fontSize: 12,  
    opacity: 0.8,  
  },  
});
