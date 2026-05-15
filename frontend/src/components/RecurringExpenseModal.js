// src/components/RecurringExpenseModal.js
import React, { useEffect, useState } from 'react';
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
import { getCategories } from '../api/categoryService';
import {
  createRecurringExpense,
  updateRecurringExpense,
} from '../api/recurringService';
import { validateAmount, validateDate } from '../utils/validation';
import { colors } from '../constants/colors';
import { borderRadius, spacing } from '../constants/spacing';

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
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
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
      setHasEndDate(Boolean(recurring.end_date));
      setEndDate(recurring.end_date || '');
    } else {
      reset();
    }
    setError('');
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
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    if (!validateAmount(amount)) {
      setError('Valid amount required');
      return;
    }

    if (!validateDate(startDate)) {
      setError('Valid start date required');
      return;
    }

    if (hasEndDate && !validateDate(endDate)) {
      setError('Valid end date required');
      return;
    }

    if (hasEndDate && endDate < startDate) {
      setError('End date must be after start date');
      return;
    }

    if (frequency === 'monthly') {
      const day = parseInt(dayOfMonth, 10);
      if (Number.isNaN(day) || day < 1 || day > 31) {
        setError('Day of month must be between 1 and 31');
        return;
      }
    }

    try {
      setIsLoading(true);
      setError('');

      const data = {
        category_id: categoryId,
        amount: parseFloat(amount),
        note: note.trim() || null,
        frequency,
        day_of_month: frequency === 'monthly' ? parseInt(dayOfMonth, 10) : null,
        start_date: startDate,
        end_date: hasEndDate ? endDate : null,
        is_active: true,
      };

      if (recurring) {
        await updateRecurringExpense(recurring.id, data);
      } else {
        await createRecurringExpense(data);
      }

      Alert.alert('Success', recurring ? 'Recurring expense updated' : 'Recurring expense created');

      if (onSave) {
        await onSave();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>Recurring</Text>
              <Text style={styles.headerTitle}>
                {recurring ? 'Edit Recurring Expense' : 'New Recurring Expense'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeBtn}>x</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={categoryId} onValueChange={setCategoryId} enabled={!isLoading}>
                  <Picker.Item label="Select category..." value={null} />
                  {categories.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Amount (Rp)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 50000"
                placeholderTextColor={colors.textTertiary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Apartment rent"
                placeholderTextColor={colors.textTertiary}
                value={note}
                onChangeText={setNote}
                editable={!isLoading}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={frequency} onValueChange={setFrequency} enabled={!isLoading}>
                  {frequencyOptions.map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {frequency === 'monthly' ? (
              <View style={styles.section}>
                <Text style={styles.label}>Day of Month</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1-31"
                  placeholderTextColor={colors.textTertiary}
                  value={dayOfMonth}
                  onChangeText={setDayOfMonth}
                  keyboardType="number-pad"
                  editable={!isLoading}
                  maxLength={2}
                />
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                value={startDate}
                onChangeText={setStartDate}
                editable={!isLoading}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.endDateHeader}>
                <Text style={styles.label}>End Date (Optional)</Text>
                <Switch value={hasEndDate} onValueChange={setHasEndDate} disabled={isLoading} />
              </View>
              {hasEndDate ? (
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={endDate}
                  onChangeText={setEndDate}
                  editable={!isLoading}
                />
              ) : null}
            </View>
          </ScrollView>

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
                <Text style={styles.submitButtonText}>{recurring ? 'Update' : 'Create'}</Text>
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
  endDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
