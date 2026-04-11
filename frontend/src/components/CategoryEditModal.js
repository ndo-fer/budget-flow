// src/components/CategoryEditModal.js  
import React, { useState, useEffect } from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
  Modal,  
  TextInput,  
  TouchableOpacity,  
  ActivityIndicator,  
  Alert,  
  ScrollView,  
} from 'react-native';  
import supabase from '../api/supabase';  

export default function CategoryEditModal({  
  visible,  
  onClose,  
  onSave,  
  category = null,  
}) {  
  const [name, setName] = useState('');  
  const [budgetAmount, setBudgetAmount] = useState('');  
  const [color, setColor] = useState('#FF6B6B');  
  const [isLoading, setIsLoading] = useState(false);  
  const [error, setError] = useState('');  

  const PRESET_COLORS = [  
    '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181',  
    '#AA96DA', '#FCBAD3', '#A8D8EA', '#C7CEEA',  
    '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D',  
  ];  

  useEffect(() => {  
    if (category) {  
      setName(category.name);  
      setBudgetAmount(category.budget_amount.toString());  
      setColor(category.color);  
    } else {  
      setName('');  
      setBudgetAmount('');  
      setColor('#FF6B6B');  
    }  
    setError('');  
  }, [visible, category]);  

  const handleSave = async () => {  
    // Validation  
    if (!name.trim()) {  
      setError('Category name required');  
      return;  
    }  

    if (!budgetAmount || isNaN(parseFloat(budgetAmount))) {  
      setError('Valid budget amount required');  
      return;  
    }  

    try {  
      setIsLoading(true);  
      setError('');  

      const data = {  
        name: name.trim(),  
        budget_amount: parseFloat(budgetAmount),  
        color: color,  
      };  

      if (category) {  
        // Update  
        const { error: updateError } = await supabase  
          .from('budget_categories')  
          .update(data)  
          .eq('id', category.id);  

        if (updateError) throw updateError;  
      } else {  
        // Create  
        const { error: insertError } = await supabase  
          .from('budget_categories')  
          .insert([data]);  

        if (insertError) throw insertError;  
      }  

      Alert.alert(  
        'Success',  
        category ? 'Category updated' : 'Category created'  
      );  

      if (onSave) {  
        onSave();  
      }  

      onClose();  
    } catch (err) {  
      setError(err.message);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  const handleDelete = async () => {  
    if (!category) return;  

    Alert.alert('Delete Category', 'Are you sure?', [  
      { text: 'Cancel' },  
      {  
        text: 'Delete',  
        onPress: async () => {  
          try {  
            setIsLoading(true);  

            const { error } = await supabase  
              .from('budget_categories')  
              .delete()  
              .eq('id', category.id);  

            if (error) throw error;  

            Alert.alert('Success', 'Category deleted');  

            if (onSave) {  
              onSave();  
            }  

            onClose();  
          } catch (err) {  
            Alert.alert('Error', err.message);  
          } finally {  
            setIsLoading(false);  
          }  
        },  
        style: 'destructive',  
      },  
    ]);  
  };  

  return (  
    <Modal  
      visible={visible}  
      transparent  
      animationType="slide"  
      onRequestClose={onClose}  
    >  
      <View style={styles.overlay}>  
        <View style={styles.modalContent}>  
          {/* Header */}  
          <View style={styles.header}>  
            <Text style={styles.headerTitle}>  
              {category ? 'Edit Category' : 'New Category'}  
            </Text>  
            <TouchableOpacity onPress={onClose}>  
              <Text style={styles.closeBtn}>✕</Text>  
            </TouchableOpacity>  
          </View>  

          <ScrollView style={styles.form}>  
            {/* Error */}  
            {error ? (  
              <View style={styles.errorBox}>  
                <Text style={styles.errorText}>{error}</Text>  
              </View>  
            ) : null}  

            {/* Category Name */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Category Name</Text>  
              <TextInput  
                style={styles.input}  
                placeholder="e.g., Makan"  
                value={name}  
                onChangeText={setName}  
                editable={!isLoading}  
              />  
            </View>  

            {/* Budget Amount */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Monthly Budget (Rp)</Text>  
              <TextInput  
                style={styles.input}  
                placeholder="e.g., 300000"  
                value={budgetAmount}  
                onChangeText={setBudgetAmount}  
                keyboardType="decimal-pad"  
                editable={!isLoading}  
              />  
            </View>  

            {/* Color Picker */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Color</Text>  
              <View style={styles.colorGrid}>  
                {PRESET_COLORS.map((c) => (  
                  <TouchableOpacity  
                    key={c}  
                    style={[  
                      styles.colorOption,  
                      { backgroundColor: c },  
                      color === c && styles.colorOptionSelected,  
                    ]}  
                    onPress={() => setColor(c)}  
                  >  
                    {color === c && <Text style={styles.checkmark}>✓</Text>}  
                  </TouchableOpacity>  
                ))}  
              </View>  
              <View  
                style={[  
                  styles.colorPreview,  
                  { backgroundColor: color },  
                ]}  
              />  
            </View>  
          </ScrollView>  

          {/* Buttons */}  
          <View style={styles.buttons}>  
            {category && (  
              <TouchableOpacity  
                style={[styles.button, styles.deleteButton]}  
                onPress={handleDelete}  
                disabled={isLoading}  
              >  
                <Text style={styles.deleteButtonText}>Delete</Text>  
              </TouchableOpacity>  
            )}  

            <TouchableOpacity  
              style={[styles.button, styles.cancelButton, category && { flex: 1 }]}  
              onPress={onClose}  
              disabled={isLoading}  
            >  
              <Text style={styles.buttonText}>Cancel</Text>  
            </TouchableOpacity>  

            <TouchableOpacity  
              style={[styles.button, styles.submitButton, category && { flex: 1 }, isLoading && { opacity: 0.6 }]}  
              onPress={handleSave}  
              disabled={isLoading}  
            >  
              {isLoading ? (  
                <ActivityIndicator color="white" />  
              ) : (  
                <Text style={styles.buttonText}>  
                  {category ? 'Update' : 'Create'}  
                </Text>  
              )}  
            </TouchableOpacity>  
          </View>  
        </View>  
      </View>  
    </Modal>  
  );  
}  

const styles = StyleSheet.create({  
  overlay: {  
    flex: 1,  
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  
    justifyContent: 'flex-end',  
  },  
  modalContent: {  
    backgroundColor: 'white',  
    borderTopLeftRadius: 20,  
    borderTopRightRadius: 20,  
    paddingTop: 20,  
    paddingHorizontal: 20,  
    paddingBottom: 30,  
    maxHeight: '90%',  
  },  
  header: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    marginBottom: 20,  
    paddingBottom: 15,  
    borderBottomWidth: 1,  
    borderBottomColor: '#eee',  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: 'bold',  
  },  
  closeBtn: {  
    fontSize: 24,  
    color: '#999',  
  },  
  form: {  
    marginBottom: 20,  
  },  
  section: {  
    marginBottom: 16,  
  },  
  label: {  
    fontSize: 13,  
    fontWeight: '600',  
    marginBottom: 8,  
    color: '#333',  
  },  
  input: {  
    borderWidth: 1,  
    borderColor: '#ddd',  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 10,  
    fontSize: 14,  
  },  
  errorBox: {  
    backgroundColor: '#ffebee',  
    borderRadius: 8,  
    padding: 10,  
    marginBottom: 16,  
  },  
  errorText: {  
    color: '#c62828',  
    fontSize: 12,  
  },  
  colorGrid: {  
    flexDirection: 'row',  
    flexWrap: 'wrap',  
    gap: 8,  
    marginBottom: 12,  
  },  
  colorOption: {  
    width: 50,  
    height: 50,  
    borderRadius: 8,  
    justifyContent: 'center',  
    alignItems: 'center',  
    borderWidth: 2,  
    borderColor: 'transparent',  
  },  
  colorOptionSelected: {  
    borderColor: '#333',  
  },  
  checkmark: {  
    color: 'white',  
    fontSize: 20,  
    fontWeight: 'bold',  
  },  
  colorPreview: {  
    height: 40,  
    borderRadius: 8,  
  },  
  buttons: {  
    flexDirection: 'row',  
    gap: 10,  
  },  
  button: {  
    flex: 1,  
    paddingVertical: 12,  
    borderRadius: 8,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  cancelButton: {  
    backgroundColor: '#f0f0f0',  
  },  
  submitButton: {  
    backgroundColor: '#1976d2',  
  },  
  deleteButton: {  
    backgroundColor: '#d32f2f',  
  },  
  buttonText: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: 'white',  
  },  
  deleteButtonText: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: 'white',  
  },  
});
