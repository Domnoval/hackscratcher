import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type State = 'MN' | 'FL';

interface StateSelectorProps {
  selectedState: State;
  onStateChange: (state: State) => void;
}

export function StateSelector({ selectedState, onStateChange }: StateSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select State:</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonLeft,
            selectedState === 'MN' && styles.buttonActive,
          ]}
          onPress={() => onStateChange('MN')}
        >
          <Text
            style={[
              styles.buttonText,
              selectedState === 'MN' && styles.buttonTextActive,
            ]}
          >
            Minnesota
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonRight,
            selectedState === 'FL' && styles.buttonActive,
            styles.buttonDisabled,
          ]}
          disabled={true}
          onPress={() => onStateChange('FL')}
        >
          <View style={styles.buttonContent}>
            <Text
              style={[
                styles.buttonText,
                selectedState === 'FL' && styles.buttonTextActive,
                styles.buttonTextDisabled,
              ]}
            >
              Florida
            </Text>
            <Text style={styles.comingSoonBadge}>Coming Soon</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E3F',
  },
  label: {
    color: '#708090',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2E2E3F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3E3E4F',
  },
  buttonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 0.5,
  },
  buttonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 0.5,
  },
  buttonActive: {
    backgroundColor: '#00FFFF',
    borderColor: '#00FFFF',
  },
  buttonText: {
    color: '#708090',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#0A0A0F',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: '#4A4A5A',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 2,
    fontWeight: '600',
  },
});
