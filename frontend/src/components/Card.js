import React from 'react';  
import { View, StyleSheet } from 'react-native';  
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';  

export default function Card({  
  children,  
  style = {},  
  shadow = true,  
  variant = 'surface', // surface, error, success, warning, info  
}) {  
  const getVariantColor = () => {  
    switch (variant) {  
      case 'error':  
        return COLORS.errorLight;  
      case 'success':  
        return COLORS.successLight;  
      case 'warning':  
        return COLORS.warningLight;  
      case 'info':  
        return COLORS.info;  
      default:  
        return COLORS.surface;  
    }  
  };  

  const getBorderColor = () => {  
    switch (variant) {  
      case 'error':  
        return COLORS.error;  
      case 'success':  
        return COLORS.success;  
      case 'warning':  
        return COLORS.warning;  
      case 'info':  
        return COLORS.info;  
      default:  
        return 'transparent';  
    }  
  };  

  return (  
    <View  
      style={[  
        styles.card,  
        shadow && SHADOWS.sm,  
        {  
          backgroundColor: getVariantColor(),  
          borderLeftColor: getBorderColor(),  
        },  
        style,  
      ]}  
    >  
      {children}  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  card: {  
    borderRadius: BORDER_RADIUS.md,  
    padding: SPACING.md,  
    borderLeftWidth: 4,  
  },  
});
