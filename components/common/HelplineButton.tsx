import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Linking, Platform } from 'react-native';

/**
 * Floating helpline button for Minnesota Problem Gambling Helpline
 * Required for Minnesota gambling compliance
 */
export function HelplineButton() {
  const handlePress = () => {
    const phoneNumber = '18003334673'; // 1-800-333-HOPE
    const url = `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.warn('Phone dialer not available');
        }
      })
      .catch((err) => console.error('Error opening phone dialer:', err));
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      accessibilityLabel="Need Help? Call Minnesota Problem Gambling Helpline"
      accessibilityHint="Opens phone dialer to call 1-800-333-HOPE"
      accessibilityRole="button"
    >
      <Text style={styles.icon}>❓</Text>
      <Text style={styles.text}>Need Help?</Text>
      <Text style={styles.subtext}>1-800-333-HOPE</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    alignItems: 'center',
    minWidth: 140,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1000,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtext: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
});
