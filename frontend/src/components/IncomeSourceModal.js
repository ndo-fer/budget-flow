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
import { validateAmount, validateDate, validateRequired } from '../utils/validation';
import { colors } from '../constants/colors';
import { borderRadius, spacing } from '../constants/spacing';

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
    if (!validateRequired(sourceName)) {  
      setError('Source name required');  
      return;  
    }  

    if (!validateAmount(amount)) {  
      setError('Valid amount required');  
      return;  
    }  

    if (!validateDate(incomeDate)) {
      setError('Valid date required');
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
            <View>
              <Text style={styles.headerEyebrow}>Income source</Text>
              <Text style={styles.headerTitle}>  
                {incomeSource ? 'Edit Income Source' : 'New Income Source'}  
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>  
              <Text style={styles.closeBtn}>x</Text>  
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
                placeholderTextColor={colors.textTertiary}
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
                placeholderTextColor={colors.textTertiary}
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
                placeholderTextColor={colors.textTertiary}
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
                placeholderTextColor={colors.textTertiary}
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
    backgroundColor: 'rgba(31, 41, 55, 0.32)',  
    justifyContent: 'flex-end',  
  },  
  modalContent: {  
    backgroundColor: colors.surface,  
    borderTopLeftRadius: borderRadius.xxl,  
    borderTopRightRadius: borderRadius.xxl,  
    paddingTop: spacing.xl,  
    paddingHorizontal: spacing.xl,  
    paddingBottom: spacing['2xl'],  
    maxHeight: '90%',  
  },  
  header: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    marginBottom: spacing.xl,  
    paddingBottom: spacing.lg,  
    borderBottomWidth: 1,  
    borderBottomColor: colors.border,  
  },  
  headerEyebrow: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },  
  headerTitle: {  
    fontSize: 22,  
    fontWeight: '800',
    color: colors.text,  
  },  
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },  
  closeBtn: {  
    fontSize: 20,  
    color: colors.textSecondary,  
  },  
  form: {  
    marginBottom: spacing.xl,  
  },  
  section: {  
    marginBottom: spacing.lg,  
  },  
  label: {  
    fontSize: 13,  
    fontWeight: '700',  
    marginBottom: spacing.sm,  
    color: colors.text,  
  },  
  input: {  
    borderWidth: 1,  
    borderColor: colors.border,  
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    borderRadius: borderRadius.lg,  
    paddingHorizontal: spacing.md,  
    paddingVertical: spacing.md,  
    fontSize: 14,  
  },  
  pickerContainer: {  
    borderWidth: 1,  
    borderColor: colors.border,  
    borderRadius: borderRadius.lg,  
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',  
  },  
  errorBox: {  
    backgroundColor: colors.errorSoft,  
    borderRadius: borderRadius.lg,  
    padding: spacing.md,  
    marginBottom: spacing.lg,  
  },  
  errorText: {  
    color: colors.error,  
    fontSize: 12,  
  },  
  buttons: {  
    flexDirection: 'row',  
    gap: spacing.md,  
  },  
  button: {  
    flex: 1,  
    minHeight: 52,  
    borderRadius: borderRadius.xl,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  cancelButton: {  
    backgroundColor: colors.surfaceMuted,  
  },  
  submitButton: {  
    backgroundColor: colors.primary,  
  },  
  deleteButton: {  
    backgroundColor: colors.error,  
  },  
  buttonText: {  
    fontSize: 13,  
    fontWeight: '700',  
    color: colors.textSecondary,  
  },
  submitButtonText: {  
    fontSize: 13,  
    fontWeight: '800',  
    color: colors.surface,  
  },  
  deleteButtonText: {  
    fontSize: 13,  
    fontWeight: '800',  
    color: colors.surface,  
  },  
});
