import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface AccessibleButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Accessible Button Component
 *
 * Provides enhanced accessibility features:
 * - Screen reader labels
 * - Proper accessibility roles
 * - Disabled state announcements
 * - Larger touch targets (minimum 44x44pt)
 */
export function AccessibleButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  accessibilityHint,
  style,
  textStyle,
}: AccessibleButtonProps) {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'danger' && styles.dangerButton,
    disabled && styles.disabledButton,
    style,
  ];

  const labelStyles = [
    styles.buttonText,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'danger' && styles.dangerText,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      // Minimum touch target size for accessibility
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={labelStyles}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // WCAG minimum touch target
    minWidth: 44,
  },
  primaryButton: {
    backgroundColor: '#00FF00',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#708090',
  },
  dangerButton: {
    backgroundColor: '#FF4500',
  },
  disabledButton: {
    backgroundColor: '#708090',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#0A0A0F',
  },
  secondaryText: {
    color: '#708090',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#FFFFFF',
  },
});
