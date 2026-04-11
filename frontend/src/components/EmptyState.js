import React from 'react';  
import { View, Text, StyleSheet } from 'react-native';  
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';  
import Button from './Button';  

export default function EmptyState({  
  icon = '📭',  
  title = 'No data',  
  description = 'There is nothing to display',  
  actionLabel = null,  
  onAction = null,  
}) {  
  return (  
    <View style={styles.container}>  
      <Text style={styles.icon}>{icon}</Text>  
      <Text style={styles.title}>{title}</Text>  
      <Text style={styles.description}>{description}</Text>  
      {actionLabel && onAction && (  
        <Button  
          title={actionLabel}  
          onPress={onAction}  
          size="md"  
          style={styles.button}  
        />  
      )}  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    alignItems: 'center',  
    justifyContent: 'center',  
    paddingVertical: SPACING.xxxl,  
    paddingHorizontal: SPACING.lg,  
  },  
  icon: {  
    fontSize: 48,  
    marginBottom: SPACING.lg,  
  },  
  title: {  
    fontSize: FONT_SIZES.lg,  
    fontWeight: '600',  
    color: COLORS.textPrimary,  
    marginBottom: SPACING.sm,  
    textAlign: 'center',  
  },  
  description: {  
    fontSize: FONT_SIZES.sm,  
    color: COLORS.textSecondary,  
    textAlign: 'center',  
    marginBottom: SPACING.xl,  
  },  
  button: {  
    minWidth: 120,  
  },  
});
