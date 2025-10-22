import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface WinTrackerProps {
  gameId: string;
  gameName: string;
  gamePrice: number;
  onTrackingComplete?: () => void;
}

/**
 * Win Tracker Component
 *
 * Allows users to report wins/losses after purchasing tickets
 * Collects data for:
 * - Model validation (were predictions accurate?)
 * - Training data (what actually wins?)
 * - User engagement (gamification)
 */
export function WinTracker({ gameId, gameName, gamePrice, onTrackingComplete }: WinTrackerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [prizeAmount, setPrizeAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenTracker = () => {
    setModalVisible(true);
    setIsWinner(null);
    setPrizeAmount('');
  };

  const handleTrackResult = async (didWin: boolean) => {
    setIsWinner(didWin);

    if (!didWin) {
      // No prize, save immediately
      await saveResult(false, 0);
    }
    // If winner, wait for prize amount input
  };

  const handleSavePrize = async () => {
    const amount = parseFloat(prizeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid prize amount');
      return;
    }

    await saveResult(true, amount);
  };

  const saveResult = async (won: boolean, amount: number) => {
    setIsSaving(true);

    try {
      // Save to user_scans table
      const { error } = await supabase.from('user_scans').insert({
        game_id: gameId,
        was_winner: won,
        prize_amount: amount,
        scan_date: new Date().toISOString(),
        // user_id will be null for now (add auth later)
      });

      if (error) throw error;

      // Show success message
      if (won) {
        Alert.alert(
          'Congrats! 🎉',
          `You won $${amount}! Keep tracking your results to help improve predictions.`
        );
      } else {
        Alert.alert(
          'Thanks for tracking!',
          `Better luck next time. Your data helps improve predictions for everyone.`
        );
      }

      setModalVisible(false);
      onTrackingComplete?.();
    } catch (error) {
      console.error('Error saving win tracking:', error);
      Alert.alert('Error', 'Failed to save result. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trackButton}
        onPress={handleOpenTracker}
        accessibilityLabel="Track ticket result"
        accessibilityHint="Report whether you won or lost on this game"
      >
        <Text style={styles.trackButtonText}>📊 Track Result</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Did you play this game?</Text>
            <Text style={styles.modalGameName}>{gameName}</Text>
            <Text style={styles.modalGamePrice}>${gamePrice}</Text>

            {isWinner === null ? (
              <>
                <Text style={styles.modalQuestion}>Did you win?</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.winButton]}
                    onPress={() => handleTrackResult(true)}
                  >
                    <Text style={styles.resultButtonText}>✅ Yes, I Won!</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resultButton, styles.loseButton]}
                    onPress={() => handleTrackResult(false)}
                  >
                    <Text style={styles.resultButtonText}>❌ No, I Lost</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : isWinner ? (
              <>
                <Text style={styles.modalQuestion}>How much did you win?</Text>
                <View style={styles.prizeInputContainer}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.prizeInput}
                    value={prizeAmount}
                    onChangeText={setPrizeAmount}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSavePrize}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#0A0A0F" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Prize</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trackButton: {
    backgroundColor: '#2E2E3F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00BFFF',
    marginTop: 8,
  },
  trackButtonText: {
    color: '#00BFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2E2E3F',
  },
  modalTitle: {
    color: '#E0E0E0',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalGameName: {
    color: '#00FFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalGamePrice: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalQuestion: {
    color: '#E0E0E0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  resultButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  winButton: {
    backgroundColor: '#00FF7F',
  },
  loseButton: {
    backgroundColor: '#FF4500',
  },
  resultButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  prizeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E3F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00FFFF',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dollarSign: {
    color: '#00FFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  prizeInput: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 20,
    paddingVertical: 12,
  },
  saveButton: {
    backgroundColor: '#00FFFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#708090',
    fontSize: 14,
  },
});
