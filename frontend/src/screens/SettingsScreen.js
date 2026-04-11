// src/screens/SettingsScreen.js  
import React, { useState, useEffect } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  ScrollView,  
  TouchableOpacity,  
  ActivityIndicator,  
  Alert,  
  Switch,  
} from 'react-native';  
import CategoryEditModal from '../components/CategoryEditModal';  
import { useAuth } from '../context/AuthContext';  
import { getCategories } from '../api/categoryService'; // FIX: import from categoryService
import supabase from '../api/supabase';  
import * as FileSystem from 'expo-file-system';  
import * as Sharing from 'expo-sharing';  

const APP_VERSION = '1.0.0';  

export default function SettingsScreen() {  
  const { user, signOut } = useAuth();  
  const [categories, setCategories] = useState([]);  
  const [isLoading, setIsLoading] = useState(true);  
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);  
  const [selectedCategory, setSelectedCategory] = useState(null);  
  const [notifications, setNotifications] = useState(true);  
  const [currency, setCurrency] = useState('IDR');  

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

  const handleEditCategory = (category) => {  
    setSelectedCategory(category);  
    setCategoryModalVisible(true);  
  };  

  const handleAddCategory = () => {  
    setSelectedCategory(null);  
    setCategoryModalVisible(true);  
  };  

  const handleCategoryModalClose = () => {  
    setCategoryModalVisible(false);  
    setSelectedCategory(null);  
    loadCategories(); // Reload  
  };  

  const handleExportData = async () => {  
    try {  
      setIsLoading(true);  

      // Get all expenses  
      const { data: expenses, error: expenseError } = await supabase  
        .from('daily_expenses')  
        .select(`  
          *,  
          budget_categories (name, color)  
        `)  
        .order('date', { ascending: false });  

      if (expenseError) throw expenseError;  

      // Get all plans  
      const { data: plans, error: planError } = await supabase  
        .from('monthly_plans')  
        .select('*')  
        .order('month', { ascending: false });  

      if (planError) throw planError;  

      // Create CSV  
      let csvContent = 'Date,Category,Amount,Note,Month\n';  
      expenses.forEach((exp) => {  
        const date = exp.date;  
        const category = exp.budget_categories?.name || 'Unknown';  
        const amount = exp.amount;  
        const note = exp.note?.replace(/,/g, ';') || '';  
        const month = date.substring(0, 7);  
        csvContent += `"${date}","${category}","${amount}","${note}","${month}"\n`;  
      });  

      // Save & share  
      const fileName = `budget_flow_export_${new Date().toISOString().split('T')[0]}.csv`;  
      const filePath = `${FileSystem.documentDirectory}${fileName}`;  

      await FileSystem.writeAsStringAsync(filePath, csvContent);  

      if (await Sharing.isAvailableAsync()) {  
        await Sharing.shareAsync(filePath);  
      } else {  
        Alert.alert('Success', `Data exported to:\n${fileName}`);  
      }  
    } catch (err) {  
      Alert.alert('Error', err.message);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  const handleChangePassword = () => {  
    Alert.prompt(  
      'Change Password',  
      'Enter new password (min 6 characters)',  
      [  
        { text: 'Cancel' },  
        {  
          text: 'Change',  
          onPress: async (password) => {  
            if (!password || password.length < 6) {  
              Alert.alert('Error', 'Password must be at least 6 characters');  
              return;  
            }  

            try {  
              const { error } = await supabase.auth.updateUser({  
                password: password,  
              });  

              if (error) throw error;  
              Alert.alert('Success', 'Password changed');  
            } catch (err) {  
              Alert.alert('Error', err.message);  
            }  
          },  
        },  
      ],  
      'secure-text'  
    );  
  };  

  const handleLogout = () => {  
    Alert.alert('Logout', 'Are you sure?', [  
      { text: 'Cancel' },  
      {  
        text: 'Logout',  
        onPress: async () => {  
          try {  
            await signOut();  
          } catch (err) {  
            Alert.alert('Error', err.message);  
          }  
        },  
        style: 'destructive',  
      },  
    ]);  
  };  

  return (  
    <View style={styles.container}>  
      {/* Header */}  
      <View style={styles.header}>  
        <Text style={styles.title}>Settings</Text>  
      </View>  

      <ScrollView style={styles.content}>  
        {/* Account Section */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>👤 Account</Text>  

          <View style={styles.card}>  
            <View style={styles.settingRow}>  
              <View>  
                <Text style={styles.settingLabel}>Email</Text>  
                <Text style={styles.settingValue}>{user?.email}</Text>  
              </View>  
            </View>  

            <View style={styles.divider} />  

            <TouchableOpacity  
              style={styles.settingRow}  
              onPress={handleChangePassword}  
            >  
              <Text style={styles.settingLabel}>Change Password</Text>  
              <Text style={styles.settingIcon}>→</Text>  
            </TouchableOpacity>  

            <View style={styles.divider} />  

            <TouchableOpacity  
              style={styles.settingRow}  
              onPress={handleLogout}  
            >  
              <Text style={[styles.settingLabel, { color: '#d32f2f' }]}>  
                Logout  
              </Text>  
              <Text style={styles.settingIcon}>→</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  

        {/* Preferences Section */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>⚙️ Preferences</Text>  

          <View style={styles.card}>  
            <View style={styles.settingRow}>  
              <Text style={styles.settingLabel}>Notifications</Text>  
              <Switch  
                value={notifications}  
                onValueChange={setNotifications}  
                trackColor={{ false: '#767577', true: '#81c784' }}  
                thumbColor={notifications ? '#1976d2' : '#f4f3f4'}  
              />  
            </View>  

            <View style={styles.divider} />  

            <View style={styles.settingRow}>  
              <Text style={styles.settingLabel}>Currency</Text>  
              <Text style={styles.settingValue}>{currency}</Text>  
            </View>  
          </View>  
        </View>  

        {/* Categories Section */}  
        <View style={styles.section}>  
          <View style={styles.sectionTitleRow}>  
            <Text style={styles.sectionTitle}>📁 Categories</Text>  
            <TouchableOpacity  
              style={styles.addBtn}  
              onPress={handleAddCategory}  
            >  
              <Text style={styles.addBtnText}>+ Add</Text>  
            </TouchableOpacity>  
          </View>  

          {isLoading ? (  
            <View style={styles.loadingContainer}>  
              <ActivityIndicator size="small" color="#0000ff" />  
            </View>  
          ) : (  
            <View style={styles.categoriesList}>  
              {categories.map((cat) => (  
                <TouchableOpacity  
                  key={cat.id}  
                  style={styles.categoryItem}  
                  onPress={() => handleEditCategory(cat)}  
                >  
                  <View style={styles.categoryInfo}>  
                    <View  
                      style={[  
                        styles.categoryDot,  
                        { backgroundColor: cat.color },  
                      ]}  
                    />  
                    <View>  
                      <Text style={styles.categoryName}>{cat.name}</Text>  
                      <Text style={styles.categoryBudget}>  
                        Rp {cat.budget_amount.toLocaleString('id-ID')}  
                      </Text>  
                    </View>  
                  </View>  
                  <Text style={styles.editIcon}>→</Text>  
                </TouchableOpacity>  
              ))}  
            </View>  
          )}  
        </View>  

        {/* Data Section */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>💾 Data</Text>  

          <View style={styles.card}>  
            <TouchableOpacity  
              style={styles.settingRow}  
              onPress={handleExportData}  
            >  
              <Text style={styles.settingLabel}>Export Data (CSV)</Text>  
              <Text style={styles.settingIcon}>↓</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  

        {/* About Section */}  
        <View style={styles.section}>  
          <Text style={styles.sectionTitle}>ℹ️ About</Text>  

          <View style={styles.card}>  
            <View style={styles.settingRow}>  
              <Text style={styles.settingLabel}>App Version</Text>  
              <Text style={styles.settingValue}>{APP_VERSION}</Text>  
            </View>  

            <View style={styles.divider} />  

            <TouchableOpacity style={styles.settingRow}>  
              <Text style={styles.settingLabel}>Privacy Policy</Text>  
              <Text style={styles.settingIcon}>→</Text>  
            </TouchableOpacity>  

            <View style={styles.divider} />  

            <TouchableOpacity style={styles.settingRow}>  
              <Text style={styles.settingLabel}>Terms & Conditions</Text>  
              <Text style={styles.settingIcon}>→</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  

        {/* Spacer */}  
        <View style={{ height: 30 }} />  
      </ScrollView>  

      {/* Category Edit Modal */}  
      <CategoryEditModal  
        visible={categoryModalVisible}  
        onClose={handleCategoryModalClose}  
        onSave={handleCategoryModalClose}  
        category={selectedCategory}  
      />  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: '#f5f5f5',  
    paddingTop: 40,  
  },  
  header: {  
    paddingHorizontal: 20,  
    paddingBottom: 16,  
    borderBottomWidth: 1,  
    borderBottomColor: '#eee',  
    backgroundColor: 'white',  
  },  
  title: {  
    fontSize: 26,  
    fontWeight: 'bold',  
    color: '#333',  
  },  
  content: {  
    flex: 1,  
    paddingHorizontal: 16,  
    paddingTop: 12,  
  },  
  section: {  
    marginBottom: 20,  
  },  
  sectionTitleRow: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    marginBottom: 10,  
  },  
  sectionTitle: {  
    fontSize: 15,  
    fontWeight: '600',  
    color: '#333',  
  },  
  addBtn: {  
    backgroundColor: '#e3f2fd',  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 6,  
  },  
  addBtnText: {  
    color: '#1976d2',  
    fontSize: 12,  
    fontWeight: '600',  
  },  
  card: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    overflow: 'hidden',  
  },  
  settingRow: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    paddingHorizontal: 14,  
    paddingVertical: 12,  
  },  
  settingLabel: {  
    fontSize: 14,  
    fontWeight: '500',  
    color: '#333',  
  },  
  settingValue: {  
    fontSize: 12,  
    color: '#999',  
    marginTop: 4,  
  },  
  settingIcon: {  
    fontSize: 16,  
    color: '#999',  
  },  
  divider: {  
    height: 1,  
    backgroundColor: '#f0f0f0',  
  },  
  loadingContainer: {  
    paddingVertical: 20,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  categoriesList: {  
    backgroundColor: 'white',  
    borderRadius: 12,  
    overflow: 'hidden',  
  },  
  categoryItem: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    paddingHorizontal: 14,  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: '#f0f0f0',  
  },  
  categoryInfo: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    flex: 1,  
  },  
  categoryDot: {  
    width: 12,  
    height: 12,  
    borderRadius: 6,  
    marginRight: 10,  
  },  
  categoryName: {  
    fontSize: 14,  
    fontWeight: '600',  
    color: '#333',  
  },  
  categoryBudget: {  
    fontSize: 12,  
    color: '#999',  
    marginTop: 2,  
  },  
  editIcon: {  
    fontSize: 14,  
    color: '#999',  
  },  
});
