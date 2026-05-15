// src/components/ui/Input.js
import React from 'react';  
import {  
  TextInput,  
  StyleSheet,  
  View,  
  Text,  
  Platform,  
} from 'react-native';  

export function Input({  
  style,  
  label,  
  error,  
  helper,  
  icon,  
  editable = true,  
  ...props  
}) {  
  return (  
    <View style={styles.container}>  
      {label && (  
        <Text style={[styles.label, error && styles.labelError]}>  
          {label}  
          {props.required && <Text style={styles.required}> *</Text>}  
        </Text>  
      )}  

      <View style={styles.inputWrapper}>  
        {icon && <View style={styles.iconContainer}>{icon}</View>}  

        <TextInput  
          style={[  
            styles.input,  
            icon && styles.inputWithIcon,  
            error && styles.inputError,  
            !editable && styles.inputDisabled,  
            style,  
          ]}  
          placeholderTextColor="#94a3b8"  
          editable={editable}  
          {...props}  
        />  
      </View>  

      {error && <Text style={styles.errorText}>{error}</Text>}  
      {helper && !error && <Text style={styles.helperText}>{helper}</Text>}  
    </View>  
  );  
}  

const styles = StyleSheet.create({  
  container: {  
    marginBottom: 12,  
    width: '100%',  
  },  

  label: {  
    fontSize: 14,  
    fontWeight: '500',  
    color: '#0f172a',  
    marginBottom: 6,  
  },  

  labelError: {  
    color: '#ef4444',  
  },  

  required: {  
    color: '#ef4444',  
  },  

  inputWrapper: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    borderWidth: 1,  
    borderColor: '#e2e8f0',  
    borderRadius: 8,  
    backgroundColor: '#ffffff',  
    overflow: 'hidden',  
    ...Platform.select({  
      ios: {  
        shadowColor: '#000',  
        shadowOffset: { width: 0, height: 1 },  
        shadowOpacity: 0.05,  
        shadowRadius: 2,  
      },  
      android: {  
        elevation: 1,  
      },  
      web: {  
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',  
      },  
    }),  
  },  

  input: {  
    flex: 1,  
    height: 40,  
    paddingHorizontal: 12,  
    paddingVertical: 8,  
    color: '#0f172a',  
    fontSize: 14,  
  },  

  inputWithIcon: {  
    paddingLeft: 0,  
  },  

  inputError: {  
    borderColor: '#ef4444',  
  },  

  inputDisabled: {  
    backgroundColor: '#f1f5f9',  
    color: '#94a3b8',  
  },  

  iconContainer: {  
    paddingHorizontal: 12,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  

  errorText: {  
    fontSize: 12,  
    color: '#ef4444',  
    marginTop: 4,  
  },  

  helperText: {  
    fontSize: 12,  
    color: '#64748b',  
    marginTop: 4,  
  },  
});  
