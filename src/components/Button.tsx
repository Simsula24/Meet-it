import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  ...rest
}) => {
  // Determine the container and text styles based on variant and size
  const getContainerStyle = () => {
    let containerStyle: ViewStyle = styles.container;
    
    // Add style based on variant
    switch (variant) {
      case 'primary':
        containerStyle = { ...containerStyle, ...styles.primaryContainer };
        break;
      case 'secondary':
        containerStyle = { ...containerStyle, ...styles.secondaryContainer };
        break;
      case 'outline':
        containerStyle = { ...containerStyle, ...styles.outlineContainer };
        break;
      case 'text':
        containerStyle = { ...containerStyle, ...styles.textContainer };
        break;
    }
    
    // Add style based on size
    switch (size) {
      case 'small':
        containerStyle = { ...containerStyle, ...styles.smallContainer };
        break;
      case 'medium':
        containerStyle = { ...containerStyle, ...styles.mediumContainer };
        break;
      case 'large':
        containerStyle = { ...containerStyle, ...styles.largeContainer };
        break;
    }
    
    // Add full width style if needed
    if (fullWidth) {
      containerStyle = { ...containerStyle, ...styles.fullWidth };
    }
    
    // Add disabled style if needed
    if (disabled || loading) {
      containerStyle = { ...containerStyle, ...styles.disabledContainer };
    }
    
    return containerStyle;
  };
  
  const getTextStyle = () => {
    let finalTextStyle: TextStyle = styles.text;
    
    // Add style based on variant
    switch (variant) {
      case 'primary':
        finalTextStyle = { ...finalTextStyle, ...styles.primaryText };
        break;
      case 'secondary':
        finalTextStyle = { ...finalTextStyle, ...styles.secondaryText };
        break;
      case 'outline':
        finalTextStyle = { ...finalTextStyle, ...styles.outlineText };
        break;
      case 'text':
        finalTextStyle = { ...finalTextStyle, ...styles.textOnlyText };
        break;
    }
    
    // Add style based on size
    switch (size) {
      case 'small':
        finalTextStyle = { ...finalTextStyle, ...styles.smallText };
        break;
      case 'medium':
        finalTextStyle = { ...finalTextStyle, ...styles.mediumText };
        break;
      case 'large':
        finalTextStyle = { ...finalTextStyle, ...styles.largeText };
        break;
    }
    
    // Add disabled style if needed
    if (disabled || loading) {
      finalTextStyle = { ...finalTextStyle, ...styles.disabledText };
    }
    
    return finalTextStyle;
  };
  
  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'text' ? colors.primary : colors.text.inverse} 
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  // Variant styles
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  secondaryContainer: {
    backgroundColor: colors.secondary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  textContainer: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  // Size styles
  smallContainer: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  mediumContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  largeContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  // Text base style
  text: {
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  // Text variant styles
  primaryText: {
    color: colors.text.inverse,
  },
  secondaryText: {
    color: colors.text.inverse,
  },
  outlineText: {
    color: colors.primary,
  },
  textOnlyText: {
    color: colors.primary,
  },
  disabledText: {
    color: colors.text.disabled,
  },
  // Text size styles
  smallText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  mediumText: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
  },
  largeText: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
  },
});

export default Button; 