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
    backgroundColor: 'white',  
    borderRadius: 12,  
    padding: 12,  
    marginBottom: 16,  
  },  
  searchBox: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    borderWidth: 1,  
    borderColor: '#ddd',  
    borderRadius: 8,  
    paddingHorizontal: 10,  
    marginBottom: 12,  
  },  
  searchIcon: {  
    fontSize: 16,  
    marginRight: 8,  
  },  
  searchInput: {  
    flex: 1,  
    paddingVertical: 10,  
    fontSize: 14,  
  },  
  clearBtn: {  
    fontSize: 16,  
    color: '#999',  
  },  
  loadingContainer: {  
    paddingVertical: 16,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  categoryFilter: {  
    marginBottom: 12,  
  },  
  categoryTag: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    borderRadius: 20,  
    backgroundColor: '#f0f0f0',  
    marginRight: 8,  
  },  
  categoryTagActive: {  
    backgroundColor: '#1976d2',  
  },  
  categoryDot: {  
    width: 8,  
    height: 8,  
    borderRadius: 4,  
    marginRight: 6,  
  },  
  categoryTagText: {  
    fontSize: 12,  
    color: '#666',  
    fontWeight: '500',  
  },  
  categoryTagTextActive: {  
    color: 'white',  
  },  
  resetBtn: {  
    paddingVertical: 8,  
    paddingHorizontal: 12,  
    borderRadius: 6,  
    borderWidth: 1,  
    borderColor: '#d32f2f',  
  },  
  resetBtnText: {  
    color: '#d32f2f',  
    fontSize: 12,  
    fontWeight: '600',  
    textAlign: 'center',  
  },  
});
