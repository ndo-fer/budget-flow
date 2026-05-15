// src/components/ui/Button.js
import React from 'react';  
import {  
  TouchableOpacity,  
  Text,  
  StyleSheet,  
  ActivityIndicator,  
} from 'react-native';  

export function Button({  
  variant = 'default',  
  size = 'default',  
  isLoading = false,  
  children,  
  style,  
  textStyle,  
  disabled,  
  ...props  
}) {  
  const isDisabled = disabled || isLoading;  

  const containerStyle = [  
    styles.base,  
    getVariantStyle(variant),  
    getSizeStyle(size),  
    isDisabled && styles.disabled,  
    style,  
  ];  

  const textStyleFinal = [  
    styles.baseText,  
    getVariantTextStyle(variant),  
    getSizeTextStyle(size),  
    textStyle,  
  ];  

  return (  
    <TouchableOpacity  
      style={containerStyle}  
      disabled={isDisabled}  
      activeOpacity={0.7}  
      {...props}  
    >  
      {isLoading ? (  
        <ActivityIndicator color={variant === 'default' ? '#fff' : '#1f2937'} size="small" />  
      ) : (  
        <Text style={textStyleFinal}>{children}</Text>  
      )}  
    </TouchableOpacity>  
  );  
}  

const getVariantStyle = (variant) => {  
  switch (variant) {  
    case 'outline':  
      return styles.outlineVariant;  
    case 'secondary':  
      return styles.secondaryVariant;  
    case 'ghost':  
      return styles.ghostVariant;  
    case 'destructive':  
      return styles.destructiveVariant;  
    case 'link':  
      return styles.linkVariant;  
    default:  
      return styles.defaultVariant;  
  }  
};  

const getVariantTextStyle = (variant) => {  
  switch (variant) {  
    case 'outline':  
    case 'ghost':  
      return styles.outlineText;  
    case 'secondary':  
      return styles.secondaryText;  
    case 'destructive':  
      return styles.destructiveText;  
    case 'link':  
      return styles.linkText;  
    default:  
      return styles.defaultText;  
  }  
};  

const getSizeStyle = (size) => {  
  switch (size) {  
    case 'sm':  
      return styles.smSize;  
    case 'lg':  
      return styles.lgSize;  
    case 'icon':  
      return styles.iconSize;  
    default:  
      return styles.defaultSize;  
  }  
};  

const getSizeTextStyle = (size) => {  
  switch (size) {  
    case 'sm':  
      return styles.smText;  
    case 'lg':  
      return styles.lgText;  
    default:  
      return styles.defaultTextSize;  
  }  
};  

const styles = StyleSheet.create({  
  // Base  
  base: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    justifyContent: 'center',  
    borderRadius: 8,  
    borderWidth: 1,  
    borderColor: 'transparent',  
    paddingHorizontal: 16,  
    paddingVertical: 10,  
  },  
  baseText: {  
    fontWeight: '600',  
    textAlign: 'center',  
  },  

  // Variants  
  defaultVariant: {  
    backgroundColor: '#2563eb',  
    borderColor: '#2563eb',  
  },  
  defaultText: {  
    color: '#ffffff',  
  },  

  outlineVariant: {  
    backgroundColor: 'transparent',  
    borderColor: '#d1d5db',  
  },  
  outlineText: {  
    color: '#1f2937',  
  },  

  secondaryVariant: {  
    backgroundColor: '#f3f4f6',  
    borderColor: '#e5e7eb',  
  },  
  secondaryText: {  
    color: '#1f2937',  
  },  

  ghostVariant: {  
    backgroundColor: 'transparent',  
    borderColor: 'transparent',  
  },  

  destructiveVariant: {  
    backgroundColor: '#ef4444',  
    borderColor: '#ef4444',  
  },  
  destructiveText: {  
    color: '#ffffff',  
  },  

  linkVariant: {  
    backgroundColor: 'transparent',  
    borderColor: 'transparent',  
  },  
  linkText: {  
    color: '#2563eb',  
    textDecorationLine: 'underline',  
  },  

  // Sizes  
  defaultSize: {  
    height: 40,  
  },  
  defaultTextSize: {  
    fontSize: 14,  
  },  

  smSize: {  
    height: 32,  
    paddingHorizontal: 12,  
    borderRadius: 6,  
  },  
  smText: {  
    fontSize: 12,  
  },  

  lgSize: {  
    height: 48,  
    paddingHorizontal: 24,  
  },  
  lgText: {  
    fontSize: 16,  
  },  

  iconSize: {  
    width: 40,  
    height: 40,  
    padding: 0,  
  },  

  // States  
  disabled: {  
    opacity: 0.5,  
  },  
});  
