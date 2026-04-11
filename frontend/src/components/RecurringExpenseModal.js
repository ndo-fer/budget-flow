// src/components/RecurringExpenseModal.js  
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
  Switch,  
} from 'react-native';  
import { Picker } from '@react-native-picker/picker';
import { getCategories } from '../api/categoryService'; // FIX
import {  
  createRecurringExpense,  
  updateRecurringExpense,  
} from '../api/recurringService';  

export default function RecurringExpenseModal({  
  visible,  
  onClose,  
  onSave,  
  recurring = null,  
}) {  
  const [categories, setCategories] = useState([]);  
  const [categoryId, setCategoryId] = useState(null);  
  const [amount, setAmount] = useState('');  
  const [note, setNote] = useState('');  
  const [frequency, setFrequency] = useState('monthly');  
  const [dayOfMonth, setDayOfMonth] = useState('1');  
  const [startDate, setStartDate] = useState(  
    new Date().toISOString().split('T')[0]  
  );  
  const [hasEndDate, setHasEndDate] = useState(false);  
  const [endDate, setEndDate] = useState('');  
  const [isLoading, setIsLoading] = useState(false);  
  const [error, setError] = useState('');  

  useEffect(() => {  
    loadCategories();  
  }, []);  

  useEffect(() => {  
    if (recurring) {  
      setCategoryId(recurring.category_id);  
      setAmount(recurring.amount.toString());  
      setNote(recurring.note || '');  
      setFrequency(recurring.frequency);  
      setDayOfMonth((recurring.day_of_month || 1).toString());  
      setStartDate(recurring.start_date);  
      setHasEndDate(!!recurring.end_date);  
      setEndDate(recurring.end_date || '');  
    } else {  
      reset();  
    }  
  }, [visible, recurring]);  

  const reset = () => {  
    setCategoryId(null);  
    setAmount('');  
    setNote('');  
    setFrequency('monthly');  
    setDayOfMonth('1');  
    setStartDate(new Date().toISOString().split('T')[0]);  
    setHasEndDate(false);  
    setEndDate('');  
    setError('');  
  };  

  const loadCategories = async () => {  
    try {  
      const data = await getCategories();  
      setCategories(data || []);  
    } catch (err) {  
      console.error('Error loading categories:', err);  
    }  
  };  

  const handleSave = async () => {  
    // Validation  
    if (!categoryId) {  
      setError('Please select a category');  
      return;  
    }  

    if (!amount || isNaN(parseFloat(amount))) {  
      setError('Valid amount required');  
      return;  
    }  

    try {  
      setIsLoading(true);  
      setError('');  

      const data = {  
        category_id: categoryId,  
        amount: parseFloat(amount),  
        note: note.trim() || null,  
        frequency,  
        day_of_month: frequency === 'monthly' ? parseInt(dayOfMonth) : null,  
        start_date: startDate,  
        end_date: hasEndDate ? endDate : null,  
        is_active: true,  
      };  

      if (recurring) {  
        await updateRecurringExpense(recurring.id, data);  
      } else {  
        await createRecurringExpense(data);  
      }  

      Alert.alert(  
        'Success',  
        recurring ? 'Recurring expense updated' : 'Recurring expense created'  
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

  const frequencyOptions = [  
    { label: 'Daily', value: 'daily' },  
    { label: 'Weekly', value: 'weekly' },  
    { label: 'Monthly', value: 'monthly' },  
  ];  

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
              {recurring ? 'Edit Recurring Expense' : 'New Recurring Expense'}  
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
            ): null}  

            {/* Category */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Category</Text>  
              <View style={styles.pickerContainer}>  
                <Picker  
                  selectedValue={categoryId}  
                  onValueChange={setCategoryId}  
                  enabled={!isLoading}  
                >  
                  <Picker.Item label="Select category..." value={null} />  
                  {categories.map((cat) => (  
                    <Picker.Item  
                      key={cat.id}  
                      label={cat.name}  
                      value={cat.id}  
                    />  
                  ))}  
                </Picker>  
              </View>  
            </View>  

            {/* Amount */}  
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

            {/* Note */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Note (Optional)</Text>  
              <TextInput  
                style={styles.input}  
                placeholder="e.g., Apartment rent"  
                value={note}  
                onChangeText={setNote}  
                editable={!isLoading}  
              />  
            </View>  

            {/* Frequency */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Frequency</Text>  
              <View style={styles.pickerContainer}>  
                <Picker  
                  selectedValue={frequency}  
                  onValueChange={setFrequency}  
                  enabled={!isLoading}  
                >  
                  {frequencyOptions.map((opt) => (  
                    <Picker.Item  
                      key={opt.value}  
                      label={opt.label}  
                      value={opt.value}  
                    />  
                  ))}  
                </Picker>  
              </View>  
            </View>  

            {/* Day of Month (Monthly only) */}  
            {frequency === 'monthly' && (  
              <View style={styles.section}>  
                <Text style={styles.label}>Day of Month</Text>  
                <TextInput  
                  style={styles.input}  
                  placeholder="1-31"  
                  value={dayOfMonth}  
                  onChangeText={setDayOfMonth}  
                  keyboardType="number-pad"  
                  editable={!isLoading}  
                  maxLength={2}  
                />  
              </View>  
            )}  

            {/* Start Date */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Start Date</Text>  
              <TextInput  
                style={styles.input}  
                placeholder="YYYY-MM-DD"  
                value={startDate}  
                onChangeText={setStartDate}  
                editable={!isLoading}  
              />  
            </View>  

            {/* End Date */}  
            <View style={styles.section}>  
              <View style={styles.endDateHeader}>  
                <Text style={styles.label}>End Date (Optional)</Text>  
                <Switch  
                  value={hasEndDate}  
                  onValueChange={setHasEndDate}  
                  disabled={isLoading}  
                />  
              </View>  
              {hasEndDate && (  
                <TextInput  
                  style={styles.input}  
                  placeholder="YYYY-MM-DD"  
                  value={endDate}  
                  onChangeText={setEndDate}  
                  editable={!isLoading}  
                />  
              )}  
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
              onPress={handleSave}  
              disabled={isLoading}  
            >  
              {isLoading ? (  
                <ActivityIndicator color="white" />  
              ) : (  
                <Text style={styles.submitButtonText}>  
                  {recurring ? 'Update' : 'Create'}  
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
  pickerContainer: {  
    borderWidth: 1,  
    borderColor: '#ddd',  
    borderRadius: 8,  
    overflow: 'hidden',  
  },  
  endDateHeader: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
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
    fontSize: 13,  
    fontWeight: '600',  
    color: '#333',  
  },
  submitButtonText: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: 'white',  
  },
});
