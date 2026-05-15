import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  recordIncomeTransaction,
  updateIncomeTransaction,
  deleteIncomeTransaction,
} from '../api/incomeService';
import { validateAmount, validateDate } from '../utils/validation';
import { colors } from '../constants/colors';
import { borderRadius, spacing } from '../constants/spacing';

export default function IncomeTransactionModal({
  visible,
  onClose,
  onSave,
  incomeSources = [],
  selectedSourceId = null,
  initialMonth,
  incomeTransaction = null,
}) {
  const [incomeSourceId, setIncomeSourceId] = useState(selectedSourceId);
  const [amount, setAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(incomeTransaction);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (incomeTransaction) {
      setIncomeSourceId(incomeTransaction.income_source_id ?? selectedSourceId ?? incomeSources[0]?.id ?? null);
      setAmount(String(incomeTransaction.amount ?? ''));
      setIncomeDate(incomeTransaction.date || new Date().toISOString().split('T')[0]);
      setNotes(incomeTransaction.notes ?? '');
      setError('');
      return;
    }

    const fallbackDate =
      initialMonth && /^\d{4}-\d{2}$/.test(initialMonth)
        ? `${initialMonth}-01`
        : new Date().toISOString().split('T')[0];

    setIncomeSourceId(selectedSourceId || incomeSources[0]?.id || null);
    setAmount('');
    setIncomeDate(fallbackDate);
    setNotes('');
    setError('');
  }, [visible, selectedSourceId, incomeSources, initialMonth, incomeTransaction]);

  const handleSave = async () => {
    if (!incomeSourceId) {
      setError('Please choose an income source');
      return;
    }

    if (!validateAmount(amount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (!validateDate(incomeDate)) {
      setError('Please enter a valid date');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const payload = {
        income_source_id: incomeSourceId,
        amount: parseFloat(amount),
        date: incomeDate,
        notes: notes.trim() || null,
      };

      if (isEditing) {
        await updateIncomeTransaction(incomeTransaction.id, payload);
        Alert.alert('Success', `Income updated: Rp ${parseFloat(amount).toLocaleString('id-ID')}`);
      } else {
        await recordIncomeTransaction(payload);
        Alert.alert('Success', `Income recorded: Rp ${parseFloat(amount).toLocaleString('id-ID')}`);
      }

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

  const handleDelete = async () => {
    if (!incomeTransaction) {
      return;
    }

    Alert.alert('Delete Income Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            setError('');
            await deleteIncomeTransaction(incomeTransaction.id);
            Alert.alert('Success', 'Income transaction deleted');

            if (onSave) {
              await onSave();
            }

            onClose();
          } catch (err) {
            setError(err.message);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.headerEyebrow}>Income</Text>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Income Transaction' : 'Quick Income'}</Text>
                <Text style={styles.headerSubtitle}>
                  {isEditing
                    ? 'Update the recorded income without changing the source setup.'
                    : 'Record actual income without editing the source.'}
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
              <Text style={styles.label}>Income Source</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={incomeSourceId}
                  onValueChange={setIncomeSourceId}
                  enabled={!isLoading}
                >
                  {incomeSources.map((source) => (
                    <Picker.Item
                      key={source.id}
                      label={`${source.source_name} (${source.frequency})`}
                      value={source.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Amount (Rp)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2500000"
                placeholderTextColor={colors.textTertiary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
            </View>

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

            <View style={styles.section}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="e.g., April freelance payment"
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                editable={!isLoading}
              />
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            {isEditing ? (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
                disabled={isLoading}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Save Changes' : 'Save Income'}
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
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
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
  notesInput: {
    textAlignVertical: 'top',
    paddingVertical: 12,
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
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
