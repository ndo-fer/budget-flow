// src/components/MonthlyPlanModal.js
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
import { getCurrentPlan, createPlan, updatePlan } from '../api/planService';
import { getDaysInMonth } from '../utils/dateUtils';
import { validateAmount } from '../utils/validation';
import { colors } from '../constants/colors';
import { borderRadius, spacing } from '../constants/spacing';

export default function MonthlyPlanModal({ visible, onClose, onPlanUpdated, month }) {
  const [income, setIncome] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingPlan, setExistingPlan] = useState(null);

  useEffect(() => {
    if (visible && month) {
      loadPlan();
    }
  }, [visible, month]);

  const loadPlan = async () => {
    try {
      setIsLoading(true);
      const plan = await getCurrentPlan(month);
      setExistingPlan(plan);
      setIncome(plan ? plan.income.toString() : '');
    } catch (err) {
      console.error('Error loading plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!validateAmount(income)) {
      Alert.alert('Error', 'Please enter a valid income amount');
      return;
    }

    const incomeAmount = parseFloat(income);
    const daysInMonth = getDaysInMonth(month) || 30;

    try {
      setIsSaving(true);

      if (existingPlan) {
        await updatePlan(existingPlan.id, { income: incomeAmount });
      } else {
        await createPlan(month, incomeAmount);
      }

      Alert.alert(
        'Success',
        `Monthly plan set: Rp ${incomeAmount.toLocaleString('id-ID')}/month\nDaily budget: Rp ${Math.round(
          incomeAmount / daysInMonth
        ).toLocaleString('id-ID')}`
      );

      if (onPlanUpdated) {
        onPlanUpdated();
      }

      onClose();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const daysInMonth = getDaysInMonth(month) || 30;
  const dailyBudget = income ? Math.round(parseFloat(income) / daysInMonth) : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>Monthly plan</Text>
              <Text style={styles.headerTitle}>Monthly Plan</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeBtn}>x</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : (
            <ScrollView style={styles.form}>
              <View style={styles.section}>
                <Text style={styles.label}>Month</Text>
                <Text style={styles.monthDisplay}>{month}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Monthly Income (Rp)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5000000"
                  placeholderTextColor={colors.textTertiary}
                  value={income}
                  onChangeText={setIncome}
                  keyboardType="decimal-pad"
                  editable={!isSaving}
                />
              </View>

              {income ? (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Daily Budget (Avg)</Text>
                  <Text style={styles.summaryValue}>
                    Rp {dailyBudget.toLocaleString('id-ID')}
                  </Text>
                  <Text style={styles.summaryHint}>
                    ({month} / {daysInMonth} days)
                  </Text>
                </View>
              ) : null}

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>How it works:</Text>
                <Text style={styles.infoText}>
                  {'-'} Set your expected income for this month{'\n'}
                  {'-'} Daily budget is calculated automatically{'\n'}
                  {'-'} Track your spending against this budget{'\n'}
                  {'-'} Adjust anytime during the month
                </Text>
              </View>
            </ScrollView>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, isSaving && { opacity: 0.6 }]}
              onPress={handleSavePlan}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Save Plan</Text>
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
    maxHeight: '80%',
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
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  monthDisplay: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
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
  summaryCard: {
    backgroundColor: colors.skySoft,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  summaryHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
    fontSize: 14,
    fontWeight: '800',
    color: colors.surface,
  },
});
