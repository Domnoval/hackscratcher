import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from 'react-native';

interface AgeVerificationProps {
  visible: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}

export function AgeVerification({ visible, onConfirm, onDecline }: AgeVerificationProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>18+</Text>
          </View>

          <Text style={styles.title}>Age Verification Required</Text>

          <Text style={styles.message}>
            Scratch Oracle provides information about lottery scratch-off games.
            You must be at least 18 years old to use this app.
          </Text>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Gambling involves risk. Please play responsibly.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('tel:1-800-522-4700')}
              style={styles.helplineButton}
            >
              <Text style={styles.helplineText}>
                Problem Gambling Helpline: 1-800-522-4700
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.question}>Are you 18 years of age or older?</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Yes, I'm 18+</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
            >
              <Text style={styles.declineButtonText}>No, I'm Under 18</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            By clicking "Yes, I'm 18+", you confirm that you are of legal age and
            agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#B0B0C0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: '#2E2E3F',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  warningText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  helplineButton: {
    marginTop: 8,
  },
  helplineText: {
    fontSize: 12,
    color: '#00FFFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#00FF00',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0A0F',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#708090',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#708090',
  },
  disclaimer: {
    fontSize: 11,
    color: '#708090',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
