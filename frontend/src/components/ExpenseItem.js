import React, { memo } from 'react';  
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';  
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';  

const ExpenseItem = memo(({  
  expense,  
  category,  
  onPress,  
  onLongPress,  
}) => {  
  return (  
    <TouchableOpacity  
      style={styles.item}  
      onPress={onPress}  
      onLongPress={onLongPress}  
      activeOpacity={0.7}  
    >  
      <View style={styles.left}>  
        <View  
          style={[  
            styles.categoryDot,  
            { backgroundColor: category?.color || COLORS.gray400 },  
          ]}  
        />  
        <View style={styles.content}>  
          <Text style={styles.categoryName}>{category?.name}</Text>  
          {expense.note && <Text style={styles.note}>{expense.note}</Text>}  
          <Text style={styles.date}>{expense.date}</Text>  
        </View>  
      </View>  
      <Text style={styles.amount}>  
        Rp {expense.amount.toLocaleString('id-ID')}  
      </Text>  
    </TouchableOpacity>  
  );  
}, (prevProps, nextProps) => {  
  return (  
    prevProps.expense.id === nextProps.expense.id &&  
    prevProps.category?.id === nextProps.category?.id  
  );  
});  

ExpenseItem.displayName = 'ExpenseItem';  

export default ExpenseItem;  

const styles = StyleSheet.create({  
  item: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    paddingHorizontal: SPACING.md,  
    paddingVertical: SPACING.md,  
    borderBottomWidth: 1,  
    borderBottomColor: COLORS.gray200,  
  },  
  left: {  
    flexDirection: 'row',  
    flex: 1,  
  },  
  categoryDot: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: SPACING.md,  
    marginTop: SPACING.sm,  
  },  
  content: {  
    flex: 1,  
  },  
  categoryName: {  
    fontSize: FONT_SIZES.md,  
    fontWeight: '600',  
    color: COLORS.textPrimary,  
  },  
  note: {  
    fontSize: FONT_SIZES.sm,  
    color: COLORS.textSecondary,  
    marginTop: SPACING.xs,  
  },  
  date: {  
    fontSize: FONT_SIZES.xs,  
    color: COLORS.textTertiary,  
    marginTop: SPACING.xs,  
  },  
  amount: {  
    fontSize: FONT_SIZES.md,  
    fontWeight: '700',  
    color: COLORS.error,  
    marginLeft: SPACING.md,  
  },  
});
