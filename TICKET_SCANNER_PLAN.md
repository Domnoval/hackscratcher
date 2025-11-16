# Lottery Ticket Scanner Feature Plan

## Overview
Allow users to scan physical scratch-off lottery tickets using their phone camera to instantly check if they've won. This feature will:
- Increase user engagement (users return to app after every purchase)
- Provide convenience (no need to manually check tickets)
- Track user wins for gamification features
- Build trust through official lottery integration

---

## What to Request from Minnesota State Lottery

### 1. **Official Partnership/License Agreement**

You'll need to contact Minnesota State Lottery's Business Development team:

**Minnesota State Lottery**
- **Website:** https://www.mnlottery.com/about/contact-us
- **Phone:** 651-635-8100 or 1-888-646-6888
- **Email:** lottery@mnlottery.state.mn.us
- **Business Development:** Contact via phone and ask to speak to Business Development or Digital Partnerships

**What to Request in Your Letter/Email:**

```
Subject: API Access Request for Third-Party Lottery App Integration

Dear Minnesota State Lottery Business Development Team,

We are developing a mobile application called "Scratch Oracle" that helps Minnesota
residents make informed decisions about which scratch-off lottery games to play
based on remaining prizes and odds.

We would like to integrate a ticket validation feature that allows users to scan
their lottery tickets to check for wins. To implement this feature responsibly
and in compliance with state regulations, we are requesting:

1. API Access for Ticket Validation
   - Barcode/QR code validation endpoint
   - Ticket validation API (check if ticket is a winner)
   - Game validation API (verify game number and status)

2. Technical Documentation
   - Barcode format specifications
   - API documentation and integration guides
   - Rate limiting and usage policies
   - Security requirements and best practices

3. Legal Requirements
   - Terms of service for third-party integrations
   - Licensing requirements for ticket validation
   - Compliance requirements (age verification, responsible gaming, etc.)
   - Liability and indemnification terms

4. Branding Guidelines
   - Approved logos and assets
   - Usage restrictions
   - Required disclaimers

We are committed to:
- Promoting responsible gaming
- Maintaining data security and user privacy
- Complying with all Minnesota gaming regulations
- Displaying required disclaimers and age restrictions

Please let us know the process for obtaining API access and any associated
fees or requirements.

Thank you for your consideration.

Best regards,
[Your Name]
[Your Company]
[Contact Information]
```

### 2. **Specific Technical Information Needed**

| Item | Purpose | Priority |
|------|---------|----------|
| **Barcode Format** | Understand what data is encoded in ticket barcodes | ⭐⭐⭐ Critical |
| **Validation API Endpoint** | Check if ticket is a winner | ⭐⭐⭐ Critical |
| **Game Lookup API** | Verify game number and details | ⭐⭐ High |
| **Prize Claim API** | Allow users to start claim process | ⭐ Medium |
| **API Keys/Authentication** | Secure access to lottery systems | ⭐⭐⭐ Critical |
| **Rate Limits** | Understand request quotas | ⭐⭐ High |
| **Webhook Support** | Real-time updates on claimed tickets | ⭐ Low |

---

## Technical Architecture

### Scanner Implementation Options

#### Option 1: Official API Integration (Ideal)
If MN Lottery provides API access:

```typescript
// services/scanner/lotteryApiService.ts

export class LotteryApiService {
  private static readonly API_BASE_URL = 'https://api.mnlottery.com/v1';
  private static readonly API_KEY = process.env.MN_LOTTERY_API_KEY;

  /**
   * Validate ticket by barcode
   */
  static async validateTicket(barcode: string): Promise<TicketValidationResult> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/tickets/validate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ barcode }),
        }
      );

      const data = await response.json();

      return {
        isWinner: data.is_winner,
        prizeAmount: data.prize_amount,
        gameNumber: data.game_number,
        gameName: data.game_name,
        ticketStatus: data.status, // active, claimed, expired
        validationId: data.validation_id,
        claimInstructions: data.claim_instructions,
      };
    } catch (error) {
      console.error('[LotteryAPI] Validation failed:', error);
      throw new Error('Unable to validate ticket. Please try again.');
    }
  }

  /**
   * Get ticket details by barcode
   */
  static async getTicketDetails(barcode: string): Promise<TicketDetails> {
    const response = await fetch(
      `${this.API_BASE_URL}/tickets/${barcode}`,
      {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
        },
      }
    );

    return await response.json();
  }
}
```

#### Option 2: Barcode Parsing + Database Lookup (Fallback)
If API not available, parse barcode and match against our database:

```typescript
// services/scanner/barcodeParser.ts

export interface BarcodeData {
  gameNumber: number;
  ticketNumber: string;
  validationCode?: string;
  batchNumber?: string;
}

export class BarcodeParser {
  /**
   * Parse MN Lottery barcode format
   * Format may be something like: [GAME#][TICKET#][VALIDATION]
   * Example: 2066-123456789-ABC123
   */
  static parse(barcode: string): BarcodeData {
    // This is speculative - actual format from MN Lottery needed
    const parts = barcode.split('-');

    if (parts.length < 2) {
      throw new Error('Invalid barcode format');
    }

    return {
      gameNumber: parseInt(parts[0]),
      ticketNumber: parts[1],
      validationCode: parts[2],
      batchNumber: parts[3],
    };
  }

  /**
   * Validate barcode checksum (if applicable)
   */
  static validateChecksum(barcode: string): boolean {
    // Implement checksum validation if lottery provides algorithm
    return true;
  }
}
```

#### Option 3: OCR Text Recognition (Last Resort)
If no barcode available, use OCR to read ticket numbers:

```typescript
// services/scanner/ocrService.ts

import Vision from '@react-native-ml-kit/text-recognition';

export class OCRService {
  static async extractTicketNumber(imageUri: string): Promise<string> {
    const result = await Vision.recognize(imageUri);

    // Look for patterns like "Game #2066" and ticket numbers
    const gameMatch = result.text.match(/Game\s*#?(\d+)/i);
    const ticketMatch = result.text.match(/Ticket\s*#?(\d+)/i);

    if (!gameMatch || !ticketMatch) {
      throw new Error('Could not read ticket information');
    }

    return `${gameMatch[1]}-${ticketMatch[1]}`;
  }
}
```

---

## Camera & Barcode Scanning

### Install Required Dependencies

```bash
# For camera access
npm install expo-camera

# For barcode scanning
npm install expo-barcode-scanner

# For image picker (manual photo upload)
npm install expo-image-picker

# Optional: ML Kit for OCR
npm install @react-native-ml-kit/text-recognition
```

### Scanner Component

```typescript
// components/scanner/TicketScanner.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraView, BarcodeScanningResult } from 'expo-camera';
import { TicketValidationService } from '../../services/scanner/ticketValidationService';

export function TicketScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [lastScan, setLastScan] = useState<string | null>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    // Prevent duplicate scans
    if (data === lastScan || !scanning) return;

    setLastScan(data);
    setScanning(false);

    try {
      console.log(`[Scanner] Scanned barcode: ${data}`);

      // Validate ticket
      const result = await TicketValidationService.validateTicket(data);

      if (result.isWinner) {
        Alert.alert(
          '🎉 WINNER! 🎉',
          `Congratulations! You won $${result.prizeAmount}!\n\n` +
          `Game: ${result.gameName}\n\n` +
          result.claimInstructions,
          [
            {
              text: 'Claim Prize',
              onPress: () => handleClaimPrize(result),
            },
            {
              text: 'Scan Another',
              onPress: () => setScanning(true),
            },
          ]
        );
      } else {
        Alert.alert(
          'Not a Winner',
          `This ticket did not win.\n\nGame: ${result.gameName}`,
          [
            {
              text: 'Scan Another',
              onPress: () => setScanning(true),
            },
          ]
        );
      }

      // Track scan for user history
      await TicketValidationService.recordScan(result);

    } catch (error) {
      Alert.alert(
        'Scan Error',
        'Unable to validate this ticket. Please try again or contact support.',
        [
          {
            text: 'Try Again',
            onPress: () => setScanning(true),
          },
        ]
      );
    }
  };

  const handleClaimPrize = (result: TicketValidationResult) => {
    // Navigate to prize claim screen
    // Show instructions for claiming prizes
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Camera permission denied</Text>
        <TouchableOpacity onPress={requestCameraPermission}>
          <Text style={styles.button}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'code128', 'code39'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <Text style={styles.instructions}>
              {scanning ? 'Align barcode within frame' : 'Processing...'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {/* Navigate back */}}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 18,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  error: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
});
```

---

## Database Schema for Ticket Scans

```sql
-- Track user scans for history and gamification
CREATE TABLE ticket_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User info
  user_id UUID REFERENCES users(id),

  -- Ticket info
  barcode TEXT NOT NULL,
  game_id UUID REFERENCES games(id),
  game_number INTEGER,
  ticket_number TEXT,

  -- Validation result
  is_winner BOOLEAN,
  prize_amount DECIMAL(12, 2),
  validation_id TEXT, -- From lottery API

  -- Status
  claim_status TEXT DEFAULT 'unclaimed', -- unclaimed, claimed, expired
  claimed_at TIMESTAMP,

  -- Metadata
  scanned_at TIMESTAMP DEFAULT NOW(),
  scanned_from_latitude DECIMAL(10, 8),
  scanned_from_longitude DECIMAL(11, 8),
  retailer_id UUID REFERENCES retailers(id), -- If known

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ticket_scans_user ON ticket_scans (user_id);
CREATE INDEX idx_ticket_scans_winner ON ticket_scans (is_winner) WHERE is_winner = true;
CREATE INDEX idx_ticket_scans_date ON ticket_scans (scanned_at DESC);
```

---

## Ticket Validation Service

```typescript
// services/scanner/ticketValidationService.ts

import { LotteryApiService } from './lotteryApiService';
import { BarcodeParser } from './barcodeParser';
import { supabase } from '../../lib/supabase';

export interface TicketValidationResult {
  isWinner: boolean;
  prizeAmount: number;
  gameNumber: number;
  gameName: string;
  ticketStatus: 'active' | 'claimed' | 'expired';
  validationId?: string;
  claimInstructions?: string;
}

export class TicketValidationService {
  /**
   * Main validation function
   * Tries official API first, falls back to local validation
   */
  static async validateTicket(barcode: string): Promise<TicketValidationResult> {
    try {
      // Option 1: Try official MN Lottery API (if available)
      if (process.env.MN_LOTTERY_API_ENABLED === 'true') {
        return await LotteryApiService.validateTicket(barcode);
      }

      // Option 2: Fallback to local validation
      return await this.localValidation(barcode);

    } catch (error) {
      console.error('[TicketValidation] Error:', error);
      throw error;
    }
  }

  /**
   * Local validation (when API not available)
   * Can only tell user about game, not if specific ticket won
   */
  private static async localValidation(barcode: string): Promise<TicketValidationResult> {
    // Parse barcode
    const barcodeData = BarcodeParser.parse(barcode);

    // Look up game in our database
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('game_number', barcodeData.gameNumber)
      .single();

    if (!game) {
      throw new Error('Game not found');
    }

    // We can't validate specific tickets without API,
    // but we can provide game information
    return {
      isWinner: false, // Unknown without API
      prizeAmount: 0,
      gameNumber: barcodeData.gameNumber,
      gameName: game.game_name,
      ticketStatus: game.is_active ? 'active' : 'expired',
      claimInstructions:
        'Unable to validate ticket. Please check at any Minnesota Lottery retailer.',
    };
  }

  /**
   * Record scan in database for user history
   */
  static async recordScan(result: TicketValidationResult): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from('ticket_scans').insert({
      user_id: user.id,
      game_number: result.gameNumber,
      is_winner: result.isWinner,
      prize_amount: result.prizeAmount,
      validation_id: result.validationId,
    });
  }

  /**
   * Get user's scan history
   */
  static async getScanHistory(userId: string, limit = 50): Promise<any[]> {
    const { data } = await supabase
      .from('ticket_scans')
      .select(`
        *,
        games (game_name, ticket_price)
      `)
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Get user's total wins
   */
  static async getUserWinnings(userId: string): Promise<{
    totalWins: number;
    totalAmount: number;
    biggestWin: number;
  }> {
    const { data } = await supabase
      .from('ticket_scans')
      .select('prize_amount')
      .eq('user_id', userId)
      .eq('is_winner', true);

    if (!data || data.length === 0) {
      return { totalWins: 0, totalAmount: 0, biggestWin: 0 };
    }

    return {
      totalWins: data.length,
      totalAmount: data.reduce((sum, scan) => sum + Number(scan.prize_amount), 0),
      biggestWin: Math.max(...data.map(scan => Number(scan.prize_amount))),
    };
  }
}
```

---

## UI Integration

### Add Scanner Button to Main App

```typescript
// In App.tsx or main navigation

<TouchableOpacity
  style={styles.scanButton}
  onPress={() => navigation.navigate('TicketScanner')}
>
  <Text style={styles.scanIcon}>📷</Text>
  <Text style={styles.scanText}>Scan Ticket</Text>
</TouchableOpacity>
```

### Scan History Screen

```typescript
// screens/ScanHistoryScreen.tsx

export function ScanHistoryScreen() {
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadScanHistory();
    loadStats();
  }, []);

  const loadScanHistory = async () => {
    const history = await TicketValidationService.getScanHistory(userId);
    setScans(history);
  };

  const loadStats = async () => {
    const winnings = await TicketValidationService.getUserWinnings(userId);
    setStats(winnings);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Winnings</Text>
        <Text style={styles.bigNumber}>${stats?.totalAmount || 0}</Text>
        <Text style={styles.subText}>
          {stats?.totalWins || 0} winning tickets
        </Text>
        <Text style={styles.subText}>
          Biggest win: ${stats?.biggestWin || 0}
        </Text>
      </View>

      {/* Scan History */}
      <Text style={styles.sectionTitle}>Recent Scans</Text>
      {scans.map(scan => (
        <ScanHistoryItem key={scan.id} scan={scan} />
      ))}
    </ScrollView>
  );
}
```

---

## Legal & Compliance Requirements

### Required Disclaimers

```typescript
// Before allowing scanning, show disclaimer

const SCANNER_DISCLAIMER = `
By using the ticket scanner feature, you acknowledge:

1. This scanner is for informational purposes only
2. Always verify winning tickets at an authorized Minnesota Lottery retailer
3. Scratch Oracle is not affiliated with or endorsed by the Minnesota State Lottery
4. We are not responsible for scanning errors or technical issues
5. You must be 18+ to purchase or claim lottery tickets

Continue only if you agree to these terms.
`;
```

### Age Verification
- Reconfirm age before allowing scanner access
- Store verification timestamp
- Require re-verification every 90 days

### Responsible Gaming
- Limit scan frequency (prevent obsessive checking)
- Show responsible gaming resources
- Link to problem gambling helpline

---

## Fallback Plan (If API Access Denied)

### Option A: Manual Entry
```typescript
// Allow users to manually enter ticket numbers
<TextInput
  placeholder="Enter ticket number"
  onChangeText={handleManualEntry}
/>
```

### Option B: Game Info Only
```typescript
// Parse barcode to show game info, but not validation
"This ticket is for game #2066: $50 Bonus Crossword"
"Prize ranges: $10 - $150,000"
"Overall odds: 1 in 3.56"
"Please check at retailer for validation"
```

### Option C: Retailer Locator
```typescript
// Direct users to nearest retailer for validation
"Find nearest lottery retailer to check this ticket"
[Show Map with Retailers]
```

---

## Timeline & Milestones

### Phase 1: Preparation (Before API Access)
- [ ] Build scanner UI and camera integration
- [ ] Implement barcode parsing (generic)
- [ ] Create database schema
- [ ] Contact MN Lottery for partnership

### Phase 2: Testing (With API Access)
- [ ] Integrate official lottery API
- [ ] Test validation with real tickets
- [ ] Beta test with select users
- [ ] Gather feedback

### Phase 3: Launch
- [ ] Public release of scanner feature
- [ ] Monitor usage and errors
- [ ] Add gamification (badges for wins)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Daily Active Scanners** | 30% of users | Analytics |
| **Scan Success Rate** | 95% | Error logs |
| **Win Discovery Rate** | Track actual wins | Database |
| **User Retention** | +25% | Before/after comparison |
| **App Store Rating** | 4.5+ stars | Reviews mentioning scanner |

---

## Next Steps

1. **Immediate:** Draft letter to MN State Lottery
2. **This Week:** Contact lottery via phone and email
3. **While Waiting:** Build scanner UI (without validation)
4. **After Approval:** Integrate API and test
5. **Launch:** Release to Play Store with scanner feature

---

## Notes

- **Florida Expansion:** Once MN is working, replicate for FL
- **Multi-State:** Each state has different APIs/requirements
- **Revenue Model:** Scanner could justify premium subscription tier
- **Social Features:** "John just won $500!" notifications
