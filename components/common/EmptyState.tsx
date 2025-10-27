import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

/**
 * Generic Empty State Component
 *
 * Displays a friendly message when no data is available
 * with optional call-to-action buttons
 */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Icon */}
      <Text style={styles.icon}>{icon}</Text>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actionsContainer}>
          {actionLabel && onAction && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onAction}
              accessibilityLabel={actionLabel}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSecondaryAction}
              accessibilityLabel={secondaryActionLabel}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  icon: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#B0B0C0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 400,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#00FF00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#708090',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#708090',
    fontSize: 16,
    fontWeight: '600',
  },
});
