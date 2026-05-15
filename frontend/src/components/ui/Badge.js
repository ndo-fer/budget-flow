// src/components/ui/Badge.js
import React from 'react';  
import {  
  View,  
  Text,  
  StyleSheet,  
} from 'react-native';  

export function Badge({  
  variant = 'default',  
  size = 'default',  
  children,  
  style,  
  textStyle,  
}) {  
  const containerStyle = [  
    styles.base,  
    getVariantStyle(variant),  
    getSizeStyle(size),  
    style,  
  ];  

  const textStyle_ = [  
    styles.text,  
    getSizeTextStyle(size),  
    getVariantTextStyle(variant),  
    textStyle,  
  ];  

  return (  
    <View style={containerStyle}>  
      <Text style={textStyle_}>{children}</Text>  
    </View>  
  );  
}  

const getVariantStyle = (variant) => {  
  switch (variant) {  
    case 'secondary':  
      return styles.secondaryVariant;  
    case 'destructive':  
      return styles.destructiveVariant;  
    case 'outline':  
      return styles.outlineVariant;  
    case 'success':  
      return styles.successVariant;  
    case 'warning':  
      return styles.warningVariant;  
    default:  
      return styles.defaultVariant;  
  }  
};  

const getVariantTextStyle = (variant) => {  
  switch (variant) {  
    case 'secondary':  
      return styles.secondaryText;  
    case 'destructive':  
      return styles.destructiveText;  
    case 'outline':  
      return styles.outlineText;  
    case 'success':  
      return styles.successText;  
    case 'warning':  
      return styles.warningText;  
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
  base: {  
    alignSelf: 'flex-start',  
    justifyContent: 'center',  
    alignItems: 'center',  
    borderRadius: 9999,  
    paddingHorizontal: 12,  
    paddingVertical: 4,  
  },  

  text: {  
    fontWeight: '600',  
    textAlign: 'center',  
  },  

  // Variants  
  defaultVariant: {  
    backgroundColor: '#0f172a',  
  },  
  defaultText: {  
    color: '#f8fafc',  
  },  

  secondaryVariant: {  
    backgroundColor: '#f1f5f9',  
  },  
  secondaryText: {  
    color: '#0f172a',  
  },  

  destructiveVariant: {  
    backgroundColor: '#fee2e2',  
  },  
  destructiveText: {  
    color: '#dc2626',  
  },  

  outlineVariant: {  
    backgroundColor: 'transparent',  
    borderWidth: 1,  
    borderColor: '#e5e7eb',  
  },  
  outlineText: {  
    color: '#374151',  
  },  

  successVariant: {  
    backgroundColor: '#dcfce7',  
  },  
  successText: {  
    color: '#16a34a',  
  },  

  warningVariant: {  
    backgroundColor: '#fef3c7',  
  },  
  warningText: {  
    color: '#b45309',  
  },  

  // Sizes  
  defaultSize: {  
    paddingHorizontal: 12,  
    paddingVertical: 4,  
  },  
  defaultTextSize: {  
    fontSize: 12,  
  },  

  smSize: {  
    paddingHorizontal: 8,  
    paddingVertical: 2,  
  },  
  smText: {  
    fontSize: 10,  
  },  

  lgSize: {  
    paddingHorizontal: 16,  
    paddingVertical: 6,  
  },  
  lgText: {  
    fontSize: 14,  
  },  
});  
