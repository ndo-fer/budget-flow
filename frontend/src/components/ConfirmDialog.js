import React from 'react';  
import {  
  View,  
  Text,  
  Modal,  
  StyleSheet,  
  TouchableOpacity,  
} from 'react-native';  
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';  
import Button from './Button';  

export default function ConfirmDialog({  
  visible,  
  title = 'Confirm',  
  message = 'Are you sure?',  
  confirmLabel = 'Confirm',  
  cancelLabel = 'Cancel',  
  variant = 'default', // default, danger  
  onConfirm,  
  onCancel,  
  isLoading = false,  
}) {  
  return (  
    <Modal  
      visible={visible}  
      transparent  
      animationType="fade"  
      onRequestClose={onCancel}  
    >  
      <View style={styles.overlay}>  
        <View style={styles.dialog}>  
          <Text style={styles.title}>{title}</Text>  
          <Text style={styles.message}>{message}</Text>  

          <View style={styles.buttons}>  
            <Button  
              title={cancelLabel}  
              variant="secondary"  
              size="md"  
              onPress={onCancel}  
              disabled={isLoading}  
              style={{ flex: 1 }}  
            />  
            <Button  
              title={confirmLabel}  
              variant={variant === 'danger' ? 'danger' : 'primary'}  
              size="md"  
              onPress={onConfirm}  
              loading={isLoading}  
              disabled={isLoading}  
              style={{ flex: 1 }}  
            />  
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
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  dialog: {  
    backgroundColor: COLORS.white,  
    borderRadius: BORDER_RADIUS.lg,  
    padding: SPACING.xl,  
    width: '80%',  
  },  
  title: {  
    fontSize: FONT_SIZES.lg,  
    fontWeight: '700',  
    color: COLORS.textPrimary,  
    marginBottom: SPACING.md,  
  },  
  message: {  
    fontSize: FONT_SIZES.md,  
    color: COLORS.textSecondary,  
    marginBottom: SPACING.xl,  
    lineHeight: 20,  
  },  
  buttons: {  
    flexDirection: 'row',  
    gap: SPACING.md,  
  },  
});
