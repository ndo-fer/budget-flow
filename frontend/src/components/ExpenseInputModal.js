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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import CategoryPicker from './CategoryPicker';
import { addExpense, updateExpense } from '../api/expenseService';
import { validateAmount, validateDate } from '../utils/validation';
import { colors } from '../constants/colors';
import { borderRadius, spacing } from '../constants/spacing';

export default function ExpenseInputModal({
  visible,
  onClose,
  onExpenseAdded,
  onExpenseSaved,
  initialDate,
  expense,
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    initialDate || new Date().toISOString().split('T')[0]
  );

  const isEditing = Boolean(expense);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (expense) {
      setSelectedCategory(expense.category_id ?? null);
      setAmount(String(expense.amount ?? ''));
      setNote(expense.note ?? '');
      setSelectedDate(expense.date || initialDate || new Date().toISOString().split('T')[0]);
      return;
    }

    setSelectedCategory(null);
    setAmount('');
    setNote('');
    setSelectedDate(initialDate || new Date().toISOString().split('T')[0]);
  }, [expense, initialDate, visible]);

  const handleSaveExpense = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!validateAmount(amount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!validateDate(selectedDate)) {
      Alert.alert('Error', 'Expense date is invalid');
      return;
    }

    try {
      setIsLoading(true);
      const normalizedAmount = parseFloat(amount);
      const normalizedNote = note.trim();
      let savedExpense;

      if (isEditing) {
        savedExpense = await updateExpense(expense.id, {
          categoryId: selectedCategory,
          amount: normalizedAmount,
          date: selectedDate,
          note: normalizedNote,
        });
        Alert.alert(
          'Success',
          `Expense updated: Rp ${normalizedAmount.toLocaleString('id-ID')}`
        );
      } else {
        savedExpense = await addExpense(selectedCategory, normalizedAmount, selectedDate, normalizedNote);
        Alert.alert(
          'Success',
          `Expense added: Rp ${normalizedAmount.toLocaleString('id-ID')}`
        );
      }

      if (onExpenseSaved) {
        onExpenseSaved(savedExpense);
      }

      if (onExpenseAdded) {
        onExpenseAdded(savedExpense);
      }

      onClose();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.headerEyebrow}>Expense</Text>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
                <Text style={styles.headerSubtitle}>
                  {isEditing
                    ? 'Update the amount, category, or note.'
                    : 'Log a new spending entry.'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeBtn}>x</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.section}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.dateDisplay}>{selectedDate}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Category</Text>
                <CategoryPicker selectedId={selectedCategory} onSelect={setSelectedCategory} />
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
                  style={[styles.input, styles.noteInput]}
                  placeholder="e.g., Lunch at restaurant"
                  placeholderTextColor={colors.textTertiary}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                />
              </View>
            </ScrollView>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, isLoading && styles.buttonDisabled]}
                onPress={handleSaveExpense}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isEditing ? 'Save Changes' : 'Save Expense'}
                  </Text>
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
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerEyebrow: {
    color: colors.primary,
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
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
    fontWeight: 'bold',
    lineHeight: 24,
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
  dateDisplay: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  noteInput: {
    textAlignVertical: 'top',
    paddingVertical: spacing.md,
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
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.surface,
  },
});
