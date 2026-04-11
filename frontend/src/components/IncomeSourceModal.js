// src/components/IncomeSourceModal.js  
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
import { Picker } from '@react-native-picker/picker';
import {  
  createIncomeSource,  
  updateIncomeSource,  
  deleteIncomeSource,  
} from '../api/incomeService';  

export default function IncomeSourceModal({  
  visible,  
  onClose,  
  onSave,  
  incomeSource = null,  
}) {  
  const [sourceName, setSourceName] = useState('');  
  const [amount, setAmount] = useState('');  
  const [frequency, setFrequency] = useState('monthly');  
  const [incomeDate, setIncomeDate] = useState(  
    new Date().toISOString().split('T')[0]  
  );  
  const [notes, setNotes] = useState('');  
  const [isLoading, setIsLoading] = useState(false);  
  const [error, setError] = useState('');  

  const frequencyOptions = [  
    { label: 'One-time', value: 'one-time' },  
    { label: 'Daily', value: 'daily' },  
    { label: 'Weekly', value: 'weekly' },  
    { label: 'Monthly', value: 'monthly' },  
  ];  

  useEffect(() => {  
    if (incomeSource) {  
      setSourceName(incomeSource.source_name);  
      setAmount(incomeSource.amount.toString());  
      setFrequency(incomeSource.frequency);  
      setIncomeDate(incomeSource.income_date || new Date().toISOString().split('T')[0]);  
      setNotes(incomeSource.notes || '');  
    } else {  
      reset();  
    }  
    setError('');  
  }, [visible, incomeSource]);  

  const reset = () => {  
    setSourceName('');  
    setAmount('');  
    setFrequency('monthly');  
    setIncomeDate(new Date().toISOString().split('T')[0]);  
    setNotes('');  
  };  

  const handleSave = async () => {  
    if (!sourceName.trim()) {  
      setError('Source name required');  
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
        source_name: sourceName.trim(),  
        amount: parseFloat(amount),  
        frequency,  
        income_date: incomeDate,  
        notes: notes.trim() || null,  
        is_active: true,  
      };  

      if (incomeSource) {  
        await updateIncomeSource(incomeSource.id, data);  
      } else {  
        await createIncomeSource(data);  
      }  

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
    if (!incomeSource) return;  

    Alert.alert('Delete Income Source', 'Are you sure?', [  
      { text: 'Cancel' },  
      {  
        text: 'Delete',  
        onPress: async () => {  
          try {  
            setIsLoading(true);  
            await deleteIncomeSource(incomeSource.id);  
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
              {incomeSource ? 'Edit Income Source' : 'New Income Source'}  
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

            {/* Source Name */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Source Name</Text>  
              <TextInput  
                style={styles.input}  
                placeholder="e.g., Salary, Freelance"  
                value={sourceName}  
                onChangeText={setSourceName}  
                editable={!isLoading}  
              />  
            </View>  

            {/* Amount */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Amount (Rp)</Text>  
              <TextInput  
                style={styles.input}  
                placeholder="e.g., 5000000"  
                value={amount}  
                onChangeText={setAmount}  
                keyboardType="decimal-pad"  
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

            {/* Income Date */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Date</Text>  
              <TextInput  
                style={styles.input}  
                placeholder="YYYY-MM-DD"  
                value={incomeDate}  
                onChangeText={setIncomeDate}  
                editable={!isLoading}  
              />  
            </View>  

            {/* Notes */}  
            <View style={styles.section}>  
              <Text style={styles.label}>Notes (Optional)</Text>  
              <TextInput  
                style={styles.input}  
                placeholder="e.g., Monthly salary"  
                value={notes}  
                onChangeText={setNotes}  
                multiline  
                numberOfLines={3}  
                editable={!isLoading}  
              />  
            </View>  
          </ScrollView>  

          {/* Buttons */}  
          <View style={styles.buttons}>  
            {incomeSource && (  
              <TouchableOpacity  
                style={[styles.button, styles.deleteButton]}  
                onPress={handleDelete}  
                disabled={isLoading}  
              >  
                <Text style={styles.deleteButtonText}>Delete</Text>  
              </TouchableOpacity>  
            )}  

            <TouchableOpacity  
              style={[styles.button, styles.cancelButton, incomeSource && { flex: 1 }]}  
              onPress={onClose}  
              disabled={isLoading}  
            >  
              <Text style={styles.buttonText}>Cancel</Text>  
            </TouchableOpacity>  

            <TouchableOpacity  
              style={[styles.button, styles.submitButton, incomeSource && { flex: 1 }, isLoading && { opacity: 0.6 }]}  
              onPress={handleSave}  
              disabled={isLoading}  
            >  
              {isLoading ? (  
                <ActivityIndicator color="white" />  
              ) : (  
                <Text style={styles.submitButtonText}>  
                  {incomeSource ? 'Update' : 'Create'}  
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
  deleteButton: {  
    backgroundColor: '#d32f2f',  
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
  deleteButtonText: {  
    fontSize: 13,  
    fontWeight: '600',  
    color: 'white',  
  },  
});
