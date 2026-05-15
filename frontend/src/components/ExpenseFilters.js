// src/components/ExpenseFilters.js  
import React, { useState, useEffect } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  TouchableOpacity,  
  ScrollView,  
  TextInput,  
  ActivityIndicator,  
} from 'react-native';  
import { getCategories } from '../api/categoryService'; // FIX: import from categoryService 
import { colors } from '../constants/colors';
import { borderRadius, spacing } from '../constants/spacing';

export default function ExpenseFilters({  
  selectedCategory,  
  onCategoryChange,  
  searchQuery,  
  onSearchChange,  
  onReset,  
}) {  
  const [categories, setCategories] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);  

  useEffect(() => {  
    loadCategories();  
  }, []);  

  const loadCategories = async () => {  
    try {  
      setIsLoading(true);  
      const data = await getCategories();  
      setCategories(data || []);  
    } catch (err) {  
      console.error('Error loading categories:', err);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  return (  
    <View style={styles.container}>  
      {/* Search */}  
      <View style={styles.searchBox}>  
        <Text style={styles.searchIcon}>🔍</Text>  
        <TextInput  
          style={styles.searchInput}  
          placeholder="Search by note..."  
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}  
          onChangeText={onSearchChange}  
        />  
        {searchQuery ? (  
          <TouchableOpacity onPress={() => onSearchChange('')}>  
            <Text style={styles.clearBtn}>✕</Text>  
          </TouchableOpacity>  
        ) : null}  
      </View>  

      {/* Category Filter */}  
      {isLoading ? (  
        <View style={styles.loadingContainer}>  
          <ActivityIndicator size="small" color="#0000ff" />  
        </View>  
      ) : (  
        <View style={styles.categoryFilter}>  
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>  
            {/* All option */}  
            <TouchableOpacity  
              style={[  
                styles.categoryTag,  
                !selectedCategory && styles.categoryTagActive,  
              ]}  
              onPress={() => onCategoryChange(null)}  
            >  
              <Text  
                style={[  
                  styles.categoryTagText,  
                  !selectedCategory && styles.categoryTagTextActive,  
                ]}  
              >  
                All  
              </Text>  
            </TouchableOpacity>  

            {/* Category options */}  
            {categories.map((cat) => (  
              <TouchableOpacity  
                key={cat.id}  
                style={[  
                  styles.categoryTag,  
                  selectedCategory === cat.id && styles.categoryTagActive,  
                ]}  
                onPress={() => onCategoryChange(cat.id)}  
              >  
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />  
                <Text  
                  style={[  
                    styles.categoryTagText,  
                    selectedCategory === cat.id && styles.categoryTagTextActive,  
                  ]}  
                >  
                  {cat.name}  
                </Text>  
              </TouchableOpacity>  
            ))}  
          </ScrollView>  
        </View>  
      )}  

      {/* Reset Button */}  
      {(selectedCategory || searchQuery) ? (  
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>  
          <Text style={styles.resetBtnText}>Clear Filters</Text>  
        </TouchableOpacity>  
      ) : null}  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    backgroundColor: colors.surface,  
    borderRadius: borderRadius.xl,  
    padding: spacing.md,  
    marginBottom: spacing.lg,  
  },  
  searchBox: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    borderWidth: 1,  
    borderColor: colors.border,  
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.lg,  
    paddingHorizontal: spacing.md,  
    marginBottom: spacing.md,  
  },  
  searchIcon: {  
    fontSize: 16,  
    marginRight: spacing.sm,  
  },  
  searchInput: {  
    flex: 1,  
    color: colors.text,
    paddingVertical: spacing.md,  
    fontSize: 14,  
  },  
  clearBtn: {  
    fontSize: 16,  
    color: colors.textSecondary,  
  },  
  loadingContainer: {  
    paddingVertical: 16,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  categoryFilter: {  
    marginBottom: spacing.md,  
  },  
  categoryTag: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingHorizontal: spacing.md,  
    paddingVertical: spacing.sm,  
    borderRadius: borderRadius.full,  
    backgroundColor: colors.surfaceMuted,  
    marginRight: spacing.sm,  
  },  
  categoryTagActive: {  
    backgroundColor: colors.primarySoft,  
  },  
  categoryDot: {  
    width: 8,  
    height: 8,  
    borderRadius: 4,  
    marginRight: spacing.xs,  
  },  
  categoryTagText: {  
    fontSize: 12,  
    color: colors.textSecondary,  
    fontWeight: '700',  
  },  
  categoryTagTextActive: {  
    color: colors.primary,  
  },  
  resetBtn: {  
    paddingVertical: spacing.sm,  
    paddingHorizontal: spacing.md,  
    borderRadius: borderRadius.lg,  
    borderWidth: 1,  
    borderColor: colors.primary,  
    backgroundColor: colors.errorSoft,
  },  
  resetBtnText: {  
    color: colors.primary,  
    fontSize: 12,  
    fontWeight: '800',  
    textAlign: 'center',  
  },  
});
