// src/components/ui/Card.js
import React from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  Platform,  
} from 'react-native';  

export function Card({ style, ...props }) {  
  return <View style={[styles.card, style]} {...props} />;  
}  

export function CardHeader({ style, ...props }) {  
  return <View style={[styles.header, style]} {...props} />;  
}  

export function CardTitle({ style, ...props }) {  
  return <Text style={[styles.title, style]} {...props} />;  
}  

export function CardDescription({ style, ...props }) {  
  return <Text style={[styles.description, style]} {...props} />;  
}  

export function CardContent({ style, ...props }) {  
  return <View style={[styles.content, style]} {...props} />;  
}  

export function CardFooter({ style, ...props }) {  
  return <View style={[styles.footer, style]} {...props} />;  
}  

const styles = StyleSheet.create({  
  card: {  
    backgroundColor: '#ffffff',  
    borderRadius: 12,  
    borderWidth: Platform.OS === 'web' ? 1 : 0,  
    borderColor: 'rgba(0, 0, 0, 0.08)',  
    overflow: 'hidden',  
    // Shadow untuk iOS  
    ...Platform.select({  
      ios: {  
        shadowColor: '#000',  
        shadowOffset: { width: 0, height: 2 },  
        shadowOpacity: 0.1,  
        shadowRadius: 8,  
      },  
      // Shadow untuk Android  
      android: {  
        elevation: 3,  
      },  
      // Shadow untuk Web (gunakan boxShadow)  
      web: {  
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',  
      },  
    }),  
  },  

  header: {  
    padding: 16,  
    gap: 4,  
    borderBottomWidth: 1,  
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',  
  },  

  title: {  
    fontSize: 16,  
    fontWeight: '600',  
    color: '#0f172a',  
    lineHeight: 24,  
  },  

  description: {  
    fontSize: 14,  
    color: '#64748b',  
    lineHeight: 20,  
  },  

  content: {  
    padding: 16,  
  },  

  footer: {  
    padding: 16,  
    backgroundColor: 'rgba(0, 0, 0, 0.02)',  
    borderTopWidth: 1,  
    borderTopColor: 'rgba(0, 0, 0, 0.05)',  
    flexDirection: 'row',  
    alignItems: 'center',  
    justifyContent: 'space-between',  
  },  
});  
