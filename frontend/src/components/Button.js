import React from 'react';  
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';  
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';  

export default function Button({  
  onPress,  
  title,  
  variant = 'primary', // primary, secondary, tertiary, danger  
  size = 'md', // sm, md, lg  
  disabled = false,  
  loading = false,  
  icon = null,  
  style = {},  
}) {  
  const getVariantStyle = () => {  
    switch (variant) {  
      case 'primary':  
        return {  
          backgroundColor: COLORS.primary,  
          color: COLORS.white,  
        };  
      case 'secondary':  
        return {  
          backgroundColor: COLORS.gray100,  
          color: COLORS.primary,  
        };  
      case 'tertiary':  
        return {  
          backgroundColor: 'transparent',  
          color: COLORS.primary,  
          borderWidth: 1,  
          borderColor: COLORS.primary,  
        };  
      case 'danger':  
        return {  
          backgroundColor: COLORS.error,  
          color: COLORS.white,  
        };  
      default:  
        return {};  
    }  
  };  

  const getSizeStyle = () => {  
    switch (size) {  
      case 'sm':  
        return {  
          paddingVertical: SPACING.sm,  
          paddingHorizontal: SPACING.md,  
          minHeight: 32,  
        };  
      case 'md':  
        return {  
          paddingVertical: SPACING.md,  
          paddingHorizontal: SPACING.lg,  
          minHeight: 40,  
        };  
      case 'lg':  
        return {  
          paddingVertical: SPACING.lg,  
          paddingHorizontal: SPACING.xl,  
          minHeight: 48,  
        };  
      default:  
        return {};  
    }  
  };  

  const variantStyle = getVariantStyle();  

  return (  
    <TouchableOpacity  
      onPress={onPress}  
      disabled={disabled || loading}  
      activeOpacity={0.7}  
      style={[  
        styles.button,  
        getSizeStyle(),  
        {  
          backgroundColor: variantStyle.backgroundColor,  
          borderWidth: variantStyle.borderWidth || 0,  
          borderColor: variantStyle.borderColor || 'transparent',  
          opacity: disabled ? 0.5 : 1,  
        },  
        style,  
      ]}  
    >  
      {loading ? (  
        <ActivityIndicator color={variantStyle.color} size="small" />  
      ) : (  
        <View style={styles.content}>  
          {icon && <Text style={styles.icon}>{icon}</Text>}  
          <Text  
            style={[  
              styles.text,  
              {  
                color: variantStyle.color,  
              },  
            ]}  
          >  
            {title}  
          </Text>  
        </View>  
      )}  
    </TouchableOpacity>  
  );  
}  

const styles = StyleSheet.create({  
  button: {  
    borderRadius: BORDER_RADIUS.md,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
  content: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    justifyContent: 'center',  
  },  
  text: {  
    fontSize: FONT_SIZES.md,  
    fontWeight: '600',  
  },  
  icon: {  
    marginRight: SPACING.sm,  
    fontSize: FONT_SIZES.lg,  
  },  
});
