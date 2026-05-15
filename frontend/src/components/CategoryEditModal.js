// src/components/CategoryEditModal.js
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
} from 'react-native';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../api/categoryService';
import { validateAmount, validateRequired } from '../utils/validation';
import { colors } from '../constants/colors';
import { borderRadius, spacing } from '../constants/spacing';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181',
  '#AA96DA', '#FCBAD3', '#A8D8EA', '#C7CEEA',
  '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D',
];

const PRIORITY_OPTIONS = [
  { value: 5, label: 'Highest' },
  { value: 4, label: 'High' },
  { value: 3, label: 'Medium' },
  { value: 2, label: 'Low' },
  { value: 1, label: 'Lowest' },
];

export default function CategoryEditModal({
  visible,
  onClose,
  onSave,
  category = null,
}) {
  const [name, setName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [color, setColor] = useState('#FF6B6B');
  const [priority, setPriority] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setBudgetAmount(category.budget_amount.toString());
      setColor(category.color);
      setPriority(category.priority || 3);
    } else {
      resetForm();
    }
    setError('');
  }, [visible, category]);

  const resetForm = () => {
    setName('');
    setBudgetAmount('');
    setColor('#FF6B6B');
    setPriority(3);
  };

  const handleSave = async () => {
    if (!validateRequired(name)) {
      setError('Category name required');
      return;
    }

    if (!validateAmount(budgetAmount)) {
      setError('Valid budget amount required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const data = {
        name: name.trim(),
        budget_amount: parseFloat(budgetAmount),
        color,
        priority,
      };

      if (category) {
        await updateCategory(category.id, data);
      } else {
        await createCategory(data.name, data.budget_amount, data.color, data.priority);
      }

      Alert.alert('Success', category ? 'Category updated' : 'Category created');

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
    if (!category) return;

    Alert.alert('Archive category', 'This will hide the category from active use. Continue?', [
      { text: 'Cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await deleteCategory(category.id);
            Alert.alert('Success', 'Category archived');

            if (onSave) {
              await onSave();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>Category</Text>
              <Text style={styles.headerTitle}>{category ? 'Edit Category' : 'New Category'}</Text>
              <Text style={styles.headerSubtitle}>
                {category ? 'Adjust how this category behaves in your budget.' : 'Create a category for faster daily tracking.'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeBtn}>x</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.previewCard}>
              <View style={[styles.previewDot, { backgroundColor: color }]} />
              <View style={styles.previewText}>
                <Text style={styles.previewName}>{name.trim() || 'Category Preview'}</Text>
                <Text style={styles.previewMeta}>
                  Rp {(parseFloat(budgetAmount) || 0).toLocaleString('id-ID')} • {PRIORITY_OPTIONS.find((item) => item.value === priority)?.label}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Groceries"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Monthly Budget (Rp)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 300000"
                placeholderTextColor={colors.textTertiary}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITY_OPTIONS.map((option) => {
                  const isSelected = priority === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.priorityChip, isSelected && styles.priorityChipActive]}
                      onPress={() => setPriority(option.value)}
                      disabled={isLoading}
                    >
                      <Text style={[styles.priorityChipText, isSelected && styles.priorityChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((presetColor) => {
                  const isSelected = color === presetColor;
                  return (
                    <TouchableOpacity
                      key={presetColor}
                      style={[
                        styles.colorOption,
                        { backgroundColor: presetColor },
                        isSelected && styles.colorOptionSelected,
                      ]}
                      onPress={() => setColor(presetColor)}
                      disabled={isLoading}
                    >
                      {isSelected ? <Text style={styles.checkmark}>OK</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            {category ? (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
                disabled={isLoading}
              >
                <Text style={styles.deleteButtonText}>Archive</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.button, styles.cancelButton, category && { flex: 1 }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, category && { flex: 1 }, isLoading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>{category ? 'Save Changes' : 'Create Category'}</Text>
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
    maxHeight: '92%',
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
  headerEyebrow: {
    color: colors.mango,
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
    marginTop: spacing.xs,
    maxWidth: 240,
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
    fontWeight: '700',
  },
  form: {
    marginBottom: spacing.xl,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.md,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  previewMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  errorBox: {
    backgroundColor: colors.errorSoft,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#F5C7C0',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  priorityChipActive: {
    backgroundColor: colors.skySoft,
  },
  priorityChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  priorityChipTextActive: {
    color: colors.text,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.text,
  },
  checkmark: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
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
  cancelButtonText: {
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
