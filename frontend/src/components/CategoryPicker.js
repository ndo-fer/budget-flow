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
import { getCategories } from '../api/expenseService';  

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
              backgroundColor: category.color,  
              opacity: selectedId === category.id ? 1 : 0.6,  
              borderWidth: selectedId === category.id ? 3 : 0,  
              borderColor: '#000',  
            },  
          ]}  
          onPress={() => onSelect(category.id)}  
        >  
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
    marginVertical: 12,  
  },  
  categoryBtn: {  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    borderRadius: 8,  
    marginRight: 8,  
    minWidth: 100,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  categoryText: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: 'white',  
  },  
  categoryBudget: {  
    fontSize: 10,  
    color: 'white',  
    marginTop: 4,  
  },  
  loadingContainer: {  
    justifyContent: 'center',  
    alignItems: 'center',  
    paddingVertical: 20,  
  },  
  error: {  
    color: 'red',  
    textAlign: 'center',  
    paddingVertical: 10,  
  },  
});
