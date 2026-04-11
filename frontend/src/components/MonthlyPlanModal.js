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
      if (plan) {  
        setIncome(plan.income.toString());  
      } else {  
        setIncome('');  
      }  
    } catch (err) {  
      console.error('Error loading plan:', err);  
    } finally {  
      setIsLoading(false);  
    }  
  };  

  const handleSavePlan = async () => {  
    if (!income || isNaN(parseFloat(income))) {  
      Alert.alert('Error', 'Please enter a valid income amount');  
      return;  
    }  

    const incomeAmount = parseFloat(income);  

    try {  
      setIsSaving(true);  

      if (existingPlan) {  
        // Update existing plan  
        await updatePlan(existingPlan.id, { income: incomeAmount });  
      } else {  
        // Create new plan  
        await createPlan(month, incomeAmount);  
      }  

      Alert.alert(  
        'Success',  
        `Monthly plan set: Rp ${incomeAmount.toLocaleString('id-ID')}/month\nDaily budget: Rp ${Math.round(incomeAmount / 30).toLocaleString('id-ID')}`  
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

  const dailyBudget = income ? Math.round(parseFloat(income) / 30) : 0;  

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
            <Text style={styles.headerTitle}>Monthly Plan</Text>  
            <TouchableOpacity onPress={onClose}>  
              <Text style={styles.closeBtn}>✕</Text>  
            </TouchableOpacity>  
          </View>  

          {isLoading ? (  
            <View style={styles.loadingContainer}>  
              <ActivityIndicator size="large" color="#0000ff" />  
            </View>  
          ) : (  
            <ScrollView style={styles.form}>  
              {/* Month Display */}  
              <View style={styles.section}>  
                <Text style={styles.label}>Month</Text>  
                <Text style={styles.monthDisplay}>{month}</Text>  
              </View>  

              {/* Income Input */}  
              <View style={styles.section}>  
                <Text style={styles.label}>Monthly Income (Rp)</Text>  
                <TextInput  
                  style={styles.input}  
                  placeholder="e.g., 5000000"  
                  value={income}  
                  onChangeText={setIncome}  
                  keyboardType="decimal-pad"  
                  editable={!isSaving}  
                />  
              </View>  

              {/* Daily Budget Display */}  
              {income && (  
                <View style={styles.summaryCard}>  
                  <Text style={styles.summaryLabel}>Daily Budget (Avg)</Text>  
                  <Text style={styles.summaryValue}>  
                    Rp {dailyBudget.toLocaleString('id-ID')}  
                  </Text>  
                  <Text style={styles.summaryHint}>  
                    ({month} ÷ 30 days)  
                  </Text>  
                </View>  
              )}  

              {/* Info */}  
              <View style={styles.infoBox}>  
                <Text style={styles.infoTitle}>💡 How it works:</Text>  
                <Text style={styles.infoText}>  
                  • Set your expected income for this month{'\n'}  
                  • Daily budget is calculated automatically{'\n'}  
                  • Track your spending against this budget{'\n'}  
                  • Adjust anytime during the month  
                </Text>  
              </View>  
            </ScrollView>  
          )}  

          {/* Buttons */}  
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
    maxHeight: '80%',  
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
    marginBottom: 20,  
  },  
  label: {  
    fontSize: 14,  
    fontWeight: '600',  
    marginBottom: 8,  
    color: '#333',  
  },  
  monthDisplay: {  
    fontSize: 18,  
    fontWeight: '600',  
    color: '#1976d2',  
  },  
  input: {  
    borderWidth: 1,  
    borderColor: '#ddd',  
    borderRadius: 8,  
    paddingHorizontal: 12,  
    paddingVertical: 12,  
    fontSize: 16,  
  },  
  summaryCard: {  
    backgroundColor: '#e3f2fd',  
    borderRadius: 12,  
    padding: 16,  
    marginBottom: 20,  
    borderLeftWidth: 4,  
    borderLeftColor: '#1976d2',  
  },  
  summaryLabel: {  
    fontSize: 12,  
    color: '#1565c0',  
    marginBottom: 8,  
  },  
  summaryValue: {  
    fontSize: 24,  
    fontWeight: 'bold',  
    color: '#1565c0',  
  },  
  summaryHint: {  
    fontSize: 11,  
    color: '#1565c0',  
    marginTop: 4,  
  },  
  infoBox: {  
    backgroundColor: '#f5f5f5',  
    borderRadius: 8,  
    padding: 12,  
    marginBottom: 16,  
  },  
  infoTitle: {  
    fontSize: 13,  
    fontWeight: '600',  
    marginBottom: 8,  
    color: '#333',  
  },  
  infoText: {  
    fontSize: 12,  
    color: '#666',  
    lineHeight: 18,  
  },  
  loadingContainer: {  
    justifyContent: 'center',  
    alignItems: 'center',  
    paddingVertical: 40,  
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
