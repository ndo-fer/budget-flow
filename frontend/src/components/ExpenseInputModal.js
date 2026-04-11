// src/components/ExpenseInputModal.js  
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
  KeyboardAvoidingView,  
  Platform,  
  ScrollView,  
} from 'react-native';  
import CategoryPicker from './CategoryPicker';  
import { addExpense } from '../api/expenseService';  

export default function ExpenseInputModal({ visible, onClose, onExpenseAdded, initialDate }) {  
  const [selectedCategory, setSelectedCategory] = useState(null);  
  const [amount, setAmount] = useState('');  
  const [note, setNote] = useState('');  
  const [isLoading, setIsLoading] = useState(false);  
  const [selectedDate, setSelectedDate] = useState(  
    initialDate || new Date().toISOString().split('T')[0]  
  );  

  const handleAddExpense = async () => {  
    // Validation  
    if (!selectedCategory) {  
      Alert.alert('Error', 'Please select a category');  
      return;  
    }  

    if (!amount || isNaN(parseFloat(amount))) {  
      Alert.alert('Error', 'Please enter a valid amount');  
      return;  
    }  

    try {  
      setIsLoading(true);  
      const newExpense = await addExpense(  
        selectedCategory,  
        parseFloat(amount),  
        selectedDate,  
        note  
      );  

      Alert.alert('Success', `Expense added: Rp ${amount}`);  
      
      // Reset form  
      setSelectedCategory(null);  
      setAmount('');  
      setNote('');  

      // Callback  
      if (onExpenseAdded) {  
        onExpenseAdded(newExpense);  
      }  

      onClose();  
    } catch (err) {  
      Alert.alert('Error', err.message);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  return (  
    <Modal  
      visible={visible}  
      transparent  
      animationType="slide"  
      onRequestClose={onClose}  
    >  
      <KeyboardAvoidingView  
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  
        style={styles.container}  
      >  
        <View style={styles.overlay}>  
          <View style={styles.modalContent}>  
            {/* Header */}  
            <View style={styles.header}>  
              <Text style={styles.headerTitle}>Add Expense</Text>  
              <TouchableOpacity onPress={onClose}>  
                <Text style={styles.closeBtn}>✕</Text>  
              </TouchableOpacity>  
            </View>  

            <ScrollView style={styles.form}>  
              {/* Date Display */}  
              <View style={styles.section}>  
                <Text style={styles.label}>Date</Text>  
                <Text style={styles.dateDisplay}>{selectedDate}</Text>  
              </View>  

              {/* Category Picker */}  
              <View style={styles.section}>  
                <Text style={styles.label}>Category</Text>  
                <CategoryPicker  
                  selectedId={selectedCategory}  
                  onSelect={setSelectedCategory}  
                />  
              </View>  

              {/* Amount Input */}  
              <View style={styles.section}>  
                <Text style={styles.label}>Amount (Rp)</Text>  
                <TextInput  
                  style={styles.input}  
                  placeholder="e.g., 50000"  
                  value={amount}  
                  onChangeText={setAmount}  
                  keyboardType="decimal-pad"  
                  editable={!isLoading}  
                />  
              </View>  

              {/* Note Input */}  
              <View style={styles.section}>  
                <Text style={styles.label}>Note (Optional)</Text>  
                <TextInput  
                  style={[styles.input, styles.noteInput]}  
                  placeholder="e.g., Lunch at restaurant"  
                  value={note}  
                  onChangeText={setNote}  
                  multiline  
                  numberOfLines={3}  
                  editable={!isLoading}  
                />  
              </View>  
            </ScrollView>  

            {/* Buttons */}  
            <View style={styles.buttons}>  
              <TouchableOpacity  
                style={[styles.button, styles.cancelButton]}  
                onPress={onClose}  
                disabled={isLoading}  
              >  
                <Text style={styles.buttonText}>Cancel</Text>  
              </TouchableOpacity>  

              <TouchableOpacity  
                style={[styles.button, styles.submitButton, isLoading && { opacity: 0.6 }]}  
                onPress={handleAddExpense}  
                disabled={isLoading}  
              >  
                {isLoading ? (  
                  <ActivityIndicator color="white" />  
                ) : (  
                  <Text style={styles.buttonText}>Save Expense</Text>  
                )}  
              </TouchableOpacity>  
            </View>  
          </View>  
        </View>  
      </KeyboardAvoidingView>  
    </Modal>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
  },  
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
    fontSize: 20,  
    fontWeight: 'bold',  
  },  
  closeBtn: {  
    fontSize: 24,  
    color: '#999',  
    fontWeight: 'bold',  
  },  
  form: {  
    marginBottom: 20,  
  },  
  section: {  
    marginBottom: 18,  
  },  
  label: {  
    fontSize: 14,  
    fontWeight: '600',  
    marginBottom: 8,  
    color: '#333',  
  },  
  dateDisplay: {  
    fontSize: 16,  
    color: '#1976d2',  
    fontWeight: '500',  
  },  
  input: {  
    borderWidth: 1,  
    borderColor: '#ddd',  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 10,  
    fontSize: 16,  
  },  
  noteInput: {  
    textAlignVertical: 'top',  
    paddingVertical: 12,  
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
  buttonText: {  
    fontSize: 14,  
    fontWeight: '600',  
    color: 'white',  
  },  
});
