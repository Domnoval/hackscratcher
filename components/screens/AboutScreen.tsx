import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from 'react-native';
import { PrivacyPolicy } from '../legal/PrivacyPolicy';
import { TermsOfService } from '../legal/TermsOfService';

export function AboutScreen() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Scratch Oracle</Text>
        <Text style={styles.version}>Version 1.0.0 (Beta)</Text>
        <Text style={styles.tagline}>Smart Lottery Analysis & Recommendations</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>
          Scratch Oracle uses advanced statistical analysis and machine learning to help
          you make informed decisions about lottery scratch-off games. We analyze remaining
          prizes, odds, and expected value to provide data-driven recommendations.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal & Support</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowPrivacy(true)}
        >
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowTerms(true)}
        >
          <Text style={styles.menuText}>Terms of Service</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('mailto:support@scratchoracle.app')}
        >
          <Text style={styles.menuText}>Contact Support</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Responsible Gaming</Text>
        <Text style={styles.description}>
          Gambling should be fun, not a problem. If you or someone you know has a gambling
          problem, help is available 24/7.
        </Text>
        <TouchableOpacity
          style={styles.helplineButton}
          onPress={() => Linking.openURL('tel:1-800-522-4700')}
        >
          <Text style={styles.helplineText}>
            National Problem Gambling Helpline{'\n'}
            1-800-522-4700
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <Text style={styles.dataSource}>• Minnesota Lottery (Official Data)</Text>
        <Text style={styles.dataSource}>• Florida Lottery (Coming Soon)</Text>
        <Text style={styles.disclaimer}>
          Updated daily. We are not affiliated with any state lottery.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with data and algorithms{'\n'}
          Not affiliated with any state lottery
        </Text>
        <Text style={styles.copyright}>© 2025 Scratch Oracle</Text>
      </View>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPrivacy(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <PrivacyPolicy />
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowTerms(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
        <TermsOfService />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    backgroundColor: '#1A1A2E',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E3F',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#708090',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#B0B0C0',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E3F',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00FFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#B0B0C0',
    lineHeight: 22,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E3F',
  },
  menuText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  arrow: {
    fontSize: 24,
    color: '#708090',
  },
  helplineButton: {
    backgroundColor: '#2E2E3F',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00FFFF',
  },
  helplineText: {
    fontSize: 14,
    color: '#00FFFF',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  dataSource: {
    fontSize: 14,
    color: '#B0B0C0',
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 12,
    color: '#708090',
    marginTop: 12,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#708090',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  copyright: {
    fontSize: 11,
    color: '#4A4A5A',
  },
  modalHeader: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E3F',
    alignItems: 'flex-end',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#00FFFF',
    fontWeight: '600',
  },
});
