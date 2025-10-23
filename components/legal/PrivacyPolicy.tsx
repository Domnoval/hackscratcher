import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

export function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last Updated: {new Date().toLocaleDateString()}</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          Scratch Oracle is designed with privacy in mind. We collect minimal information:
        </Text>
        <Text style={styles.bullet}>• User preferences (budget, risk profile)</Text>
        <Text style={styles.bullet}>• Win/loss tracking (stored locally on your device)</Text>
        <Text style={styles.bullet}>• Game recommendations history</Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use collected information solely to:
        </Text>
        <Text style={styles.bullet}>• Provide personalized lottery game recommendations</Text>
        <Text style={styles.bullet}>• Calculate expected value and odds</Text>
        <Text style={styles.bullet}>• Track your win/loss history (optional)</Text>
        <Text style={styles.bullet}>• Improve our recommendation algorithms</Text>

        <Text style={styles.sectionTitle}>3. Data Storage</Text>
        <Text style={styles.paragraph}>
          Your personal data is stored securely using Supabase (PostgreSQL database) with
          row-level security policies. Win tracking data can be stored locally on your
          device if you prefer.
        </Text>

        <Text style={styles.sectionTitle}>4. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          We use the following third-party services:
        </Text>
        <Text style={styles.bullet}>• Supabase: Database and authentication</Text>
        <Text style={styles.bullet}>• Minnesota Lottery API: Public game data</Text>
        <Text style={styles.bullet}>• Florida Lottery API: Public game data</Text>

        <Text style={styles.sectionTitle}>5. Data Sharing</Text>
        <Text style={styles.paragraph}>
          We do NOT sell, trade, or share your personal information with third parties.
          All lottery game data we display is publicly available information from
          official state lottery sources.
        </Text>

        <Text style={styles.sectionTitle}>6. Age Requirement</Text>
        <Text style={styles.paragraph}>
          You must be 18 years or older to use this app. We do not knowingly collect
          information from individuals under 18.
        </Text>

        <Text style={styles.sectionTitle}>7. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:
        </Text>
        <Text style={styles.bullet}>• Access your personal data</Text>
        <Text style={styles.bullet}>• Request deletion of your data</Text>
        <Text style={styles.bullet}>• Opt-out of win tracking</Text>
        <Text style={styles.bullet}>• Export your data</Text>

        <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this privacy policy from time to time. Changes will be posted
          in the app with an updated "Last Updated" date.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          For privacy concerns or data requests, contact us at:{'\n'}
          support@scratchoracle.app
        </Text>

        <Text style={styles.disclaimer}>
          DISCLAIMER: Scratch Oracle is an informational tool only. We are not affiliated
          with any state lottery. Gambling involves risk. Please play responsibly.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  updated: {
    fontSize: 12,
    color: '#708090',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00FFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#B0B0C0',
    lineHeight: 22,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 14,
    color: '#B0B0C0',
    lineHeight: 22,
    marginLeft: 16,
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 24,
    padding: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
});
