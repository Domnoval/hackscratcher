import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

export function TermsOfService() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last Updated: {new Date().toLocaleDateString()}</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By using Scratch Oracle, you agree to these Terms of Service. If you do not
          agree, do not use this app.
        </Text>

        <Text style={styles.sectionTitle}>2. Age Requirement</Text>
        <Text style={styles.paragraph}>
          You must be at least 18 years old to use this app. By using Scratch Oracle,
          you confirm that you are of legal age to participate in lottery activities
          in your jurisdiction.
        </Text>

        <Text style={styles.sectionTitle}>3. Service Description</Text>
        <Text style={styles.paragraph}>
          Scratch Oracle provides:
        </Text>
        <Text style={styles.bullet}>• Statistical analysis of lottery scratch-off games</Text>
        <Text style={styles.bullet}>• Expected value calculations based on public data</Text>
        <Text style={styles.bullet}>• Game recommendations based on mathematical models</Text>
        <Text style={styles.bullet}>• Win/loss tracking tools (optional)</Text>

        <Text style={styles.sectionTitle}>4. No Guarantees</Text>
        <Text style={styles.paragraph}>
          IMPORTANT: Scratch Oracle provides informational analysis only. We do NOT
          guarantee winnings, profits, or any specific outcomes. Lottery games are
          games of chance. You may lose money.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Accuracy</Text>
        <Text style={styles.paragraph}>
          We strive to provide accurate data by scraping official lottery sources.
          However, we are not responsible for:
        </Text>
        <Text style={styles.bullet}>• Errors in official lottery data</Text>
        <Text style={styles.bullet}>• Delays in data updates</Text>
        <Text style={styles.bullet}>• Technical issues affecting data accuracy</Text>
        <Text style={styles.paragraph}>
          Always verify game information with official lottery retailers.
        </Text>

        <Text style={styles.sectionTitle}>6. Responsible Gaming</Text>
        <Text style={styles.paragraph}>
          Gambling can be addictive. Please play responsibly:
        </Text>
        <Text style={styles.bullet}>• Set a budget and stick to it</Text>
        <Text style={styles.bullet}>• Never gamble with money you can't afford to lose</Text>
        <Text style={styles.bullet}>• Seek help if gambling becomes a problem</Text>
        <Text style={styles.paragraph}>
          National Problem Gambling Helpline: 1-800-522-4700
        </Text>

        <Text style={styles.sectionTitle}>7. Not Affiliated with Lotteries</Text>
        <Text style={styles.paragraph}>
          Scratch Oracle is an independent tool. We are NOT affiliated with, endorsed by,
          or sponsored by any state lottery organization, including Minnesota Lottery or
          Florida Lottery.
        </Text>

        <Text style={styles.sectionTitle}>8. User Conduct</Text>
        <Text style={styles.paragraph}>
          You agree NOT to:
        </Text>
        <Text style={styles.bullet}>• Use the app for illegal purposes</Text>
        <Text style={styles.bullet}>• Attempt to hack or reverse engineer the app</Text>
        <Text style={styles.bullet}>• Scrape or redistribute our data commercially</Text>
        <Text style={styles.bullet}>• Use the app if under 18 years old</Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          Scratch Oracle and its developers are not liable for:
        </Text>
        <Text style={styles.bullet}>• Financial losses from lottery purchases</Text>
        <Text style={styles.bullet}>• Decisions made based on app recommendations</Text>
        <Text style={styles.bullet}>• Technical issues or app downtime</Text>
        <Text style={styles.bullet}>• Inaccurate data from third-party sources</Text>

        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may modify these terms at any time. Continued use of the app after changes
          constitutes acceptance of new terms.
        </Text>

        <Text style={styles.sectionTitle}>11. Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to terminate or suspend access to the app at any time,
          for any reason, without notice.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact</Text>
        <Text style={styles.paragraph}>
          Questions about these terms? Contact us at:{'\n'}
          scratchoracleapp@gmail.com
        </Text>

        <Text style={styles.disclaimer}>
          BY USING SCRATCH ORACLE, YOU ACKNOWLEDGE THAT LOTTERY GAMES INVOLVE RISK AND
          THAT YOU MAY LOSE MONEY. THIS APP IS FOR INFORMATIONAL PURPOSES ONLY.
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
    color: '#FF6B6B',
    marginTop: 24,
    padding: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
    fontWeight: '600',
  },
});
