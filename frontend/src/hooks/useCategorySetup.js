// src/hooks/useCategorySetup.js  
import { useState } from 'react';  
import supabase from '../api/supabase';  
import { getCurrentUserId } from '../api/queryUtils';

const DEFAULT_CATEGORIES = [  
  { name: 'Makan', budget_amount: 300000, color: '#FF6B6B', priority: 5 },  
  { name: 'Transport', budget_amount: 200000, color: '#4ECDC4', priority: 5 },  
  { name: 'Entertainment', budget_amount: 150000, color: '#95E1D3', priority: 3 },  
  { name: 'Shopping', budget_amount: 200000, color: '#F38181', priority: 3 },  
  { name: 'Utilities', budget_amount: 100000, color: '#AA96DA', priority: 4 },  
  { name: 'Health', budget_amount: 150000, color: '#FCBAD3', priority: 4 },  
  { name: 'Education', budget_amount: 100000, color: '#A8D8EA', priority: 3 },  
  { name: 'Other', budget_amount: 100000, color: '#C7CEEA', priority: 1 },  
];  

export const useCategorySetup = () => {  
  const [isLoading, setIsLoading] = useState(false);  
  const [error, setError] = useState(null);  

  const setupDefaultCategories = async () => {  
    try {  
      const userId = await getCurrentUserId();
      setIsLoading(true);  
      setError(null);  

      // Check if user already has categories  
      const { data: existingCategories, error: fetchError } = await supabase  
        .from('budget_categories')  
        .select('id')  
        .eq('user_id', userId)
        .limit(1);  

      if (fetchError) throw fetchError;  

      // Jika sudah ada categories, skip  
      if (existingCategories && existingCategories.length > 0) {  
        console.log('Categories already exist');  
        return true;  
      }  

      // Insert default categories  
      const { data, error: insertError } = await supabase  
        .from('budget_categories')  
        .insert(
          DEFAULT_CATEGORIES.map((category) => ({
            ...category,
            user_id: userId,
            is_active: true,
          }))
        )  
        .select();  

      if (insertError) throw insertError;  

      console.log('Default categories created:', data);  
      return true;  
    } catch (err) {  
      setError(err.message);  
      console.error('Error setting up categories:', err);  
      return false;  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  return { setupDefaultCategories, isLoading, error };  
};
