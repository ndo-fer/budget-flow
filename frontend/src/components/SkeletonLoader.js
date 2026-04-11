import React from 'react';  
import { View, StyleSheet } from 'react-native';  
import { COLORS, SPACING } from '../constants/theme';  

export default function SkeletonLoader({ height = 40, width = '100%' }) {  
  return (  
    <View  
      style={[  
        styles.skeleton,  
        {  
          height,  
          width,  
        },  
      ]}  
    />  
  );  
}  

const styles = StyleSheet.create({  
  skeleton: {  
    backgroundColor: COLORS.gray200,  
    borderRadius: SPACING.sm,  
    marginBottom: SPACING.md,  
  },  
});
