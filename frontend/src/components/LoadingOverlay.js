import React from 'react';  
import {  
  View,  
  ActivityIndicator,  
  StyleSheet,  
  Modal,  
  Text,  
} from 'react-native';  
import { COLORS, SPACING, FONT_SIZES } from '../constants/theme';  

export default function LoadingOverlay({ visible, message = 'Loading...' }) {  
  return (  
    <Modal visible={visible} transparent animationType="fade">  
      <View style={styles.overlay}>  
        <View style={styles.container}>  
          <ActivityIndicator size="large" color={COLORS.primary} />  
          <Text style={styles.message}>{message}</Text>  
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
  container: {  
    backgroundColor: COLORS.white,  
    borderRadius: 12,  
    padding: SPACING.xl,  
    alignItems: 'center',  
  },  
  message: {  
    marginTop: SPACING.lg,  
    fontSize: FONT_SIZES.md,  
    color: COLORS.textPrimary,  
    fontWeight: '500',  
  },  
});
