// src/context/AuthContext.js  
import React, { createContext, useContext, useEffect, useState } from 'react';  
import supabase from '../api/supabase';  

const AuthContext = createContext();  

export const AuthProvider = ({ children }) => {  
  const [user, setUser] = useState(null);  
  const [isLoading, setIsLoading] = useState(true);  
  const [error, setError] = useState(null);  

  useEffect(() => {  
    // Check if user is already logged in  
    const checkSession = async () => {  
      try {  
        const { data: { session } } = await supabase.auth.getSession();  
        setUser(session?.user ?? null);  

        // If user exists, setup categories (won't duplicate if already exist)  
        if (session?.user) {  
          await setupDefaultCategories(session.user.id);  
        }  
      } catch (err) {  
        setError(err.message);  
      } finally {  
        setIsLoading(false);  
      }  
    };  

    checkSession();  

    // Listen for auth changes  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {  
      setUser(session?.user ?? null);  
      if (session?.user && event === 'SIGNED_IN') {  
        setupDefaultCategories(session.user.id);  
      }  
    });  

    return () => subscription?.unsubscribe();  
  }, []);  

  const setupDefaultCategories = async (userId) => {  
    const DEFAULT_CATEGORIES = [  
      { user_id: userId, name: 'Makan', budget_amount: 300000, color: '#FF6B6B' },  
      { user_id: userId, name: 'Transport', budget_amount: 200000, color: '#4ECDC4' },  
      { user_id: userId, name: 'Entertainment', budget_amount: 150000, color: '#95E1D3' },  
      { user_id: userId, name: 'Shopping', budget_amount: 200000, color: '#F38181' },  
      { user_id: userId, name: 'Utilities', budget_amount: 100000, color: '#AA96DA' },  
      { user_id: userId, name: 'Health', budget_amount: 150000, color: '#FCBAD3' },  
      { user_id: userId, name: 'Education', budget_amount: 100000, color: '#A8D8EA' },  
      { user_id: userId, name: 'Other', budget_amount: 100000, color: '#C7CEEA' },  
    ];  

    try {  
      // Check if categories already exist  
      const { data: existingCategories } = await supabase  
        .from('budget_categories')  
        .select('id')  
        .limit(1);  

      if (existingCategories && existingCategories.length > 0) {  
        return; // Categories already exist  
      }  

      // Insert default categories  
      await supabase  
        .from('budget_categories')  
        .insert(DEFAULT_CATEGORIES);  

      console.log('✅ Default categories created');  
    } catch (err) {  
      console.error('Error setting up categories:', err);  
      // Don't throw error, kalo gagal juga gpp  
    }  
  };  

  const signUp = async (email, password) => {  
    try {  
      setError(null);  
      const { data, error } = await supabase.auth.signUp({  
        email,  
        password,  
      });  
      if (error) throw error;  
      return data;  
    } catch (err) {  
      setError(err.message);  
      throw err;  
    }  
  };  

  const signIn = async (email, password) => {  
    try {  
      setError(null);  
      const { data, error } = await supabase.auth.signInWithPassword({  
        email,  
        password,  
      });  
      if (error) throw error;  
      return data;  
    } catch (err) {  
      setError(err.message);  
      throw err;  
    }  
  };  

  const signOut = async () => {  
    try {  
      setError(null);  
      await supabase.auth.signOut();  
    } catch (err) {  
      setError(err.message);  
      throw err;  
    }  
  };  

  return (  
    <AuthContext.Provider value={{ user, isLoading, error, signUp, signIn, signOut }}>  
      {children}  
    </AuthContext.Provider>  
  );  
};  

export const useAuth = () => {  
  const context = useContext(AuthContext);  
  if (!context) {  
    throw new Error('useAuth must be used within AuthProvider');  
  }  
  return context;  
};
