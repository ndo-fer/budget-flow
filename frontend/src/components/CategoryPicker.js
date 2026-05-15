// src/components/CategoryPicker.js  
import React, { useState, useEffect } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  ScrollView,  
  TouchableOpacity,  
  ActivityIndicator,  
} from 'react-native';  
import { getCategories } from '../api/categoryService';  
import { colors } from '../constants/colors';
import { borderRadius, spacing } from '../constants/spacing';

export default function CategoryPicker({ selectedId, onSelect }) {  
  const [categories, setCategories] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);  
  const [error, setError] = useState(null);  

  useEffect(() => {  
    loadCategories();  
  }, []);  

  const loadCategories = async () => {  
    try {  
      setIsLoading(true);  
      setError(null);  
      const data = await getCategories();  
      setCategories(data || []);  
    } catch (err) {  
      setError(err.message);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  if (isLoading) {  
    return (  
      <View style={styles.loadingContainer}>  
        <ActivityIndicator size="small" color="#0000ff" />  
      </View>  
    );  
  }  

  if (error) {  
    return <Text style={styles.error}>{error}</Text>;  
  }  

  return (  
    <ScrollView   
      style={styles.container}  
      horizontal  
      showsHorizontalScrollIndicator={false}  
    >  
      {categories.map((category) => (  
        <TouchableOpacity  
          key={category.id}  
          style={[  
            styles.categoryBtn,  
            {  
              backgroundColor: selectedId === category.id ? `${category.color}22` : colors.surfaceMuted,  
              borderWidth: 1,  
              borderColor: selectedId === category.id ? category.color : colors.border,  
            },  
          ]}  
          onPress={() => onSelect(category.id)}  
        >  
          <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
          <Text style={styles.categoryText}>{category.name}</Text>  
          <Text style={styles.categoryBudget}>  
            Rp {category.budget_amount.toLocaleString('id-ID')}  
          </Text>  
        </TouchableOpacity>  
      ))}  
    </ScrollView>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flexDirection: 'row',  
    marginVertical: spacing.sm,  
  },  
  categoryBtn: {  
    paddingHorizontal: spacing.md,  
    paddingVertical: spacing.md,  
    borderRadius: borderRadius.xl,  
    marginRight: spacing.sm,  
    minWidth: 120,  
    justifyContent: 'center',  
    alignItems: 'flex-start',  
  },  
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  categoryText: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: colors.text,  
  },  
  categoryBudget: {  
    fontSize: 11,  
    color: colors.textSecondary,  
    marginTop: spacing.xs,  
  },  
  loadingContainer: {  
    justifyContent: 'center',  
    alignItems: 'center',  
    paddingVertical: 20,  
  },  
  error: {  
    color: colors.error,  
    textAlign: 'center',  
    paddingVertical: 10,  
  },  
});
