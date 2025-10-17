import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Vibration
} from 'react-native';
// import { Camera } from 'expo-camera';
// import { BarCodeScanner } from 'expo-barcode-scanner';
import { TicketScannerService } from '../../services/scanner/ticketScanner';
import { ScannedTicket } from '../../types/scanner';

export default function TicketScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<ScannedTicket | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    // const { status } = await Camera.requestCameraPermissionsAsync();
    // setHasPermission(status === 'granted');

    // For MVP demo: auto-grant permission
    setHasPermission(true);
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (processing) return;

    setProcessing(true);
    setScanning(false);
    Vibration.vibrate(100); // Haptic feedback

    try {
      // Validate barcode
      if (!TicketScannerService.isValidBarcode(data)) {
        Alert.alert('Invalid Barcode', 'This doesn\'t appear to be a valid lottery ticket barcode.');
        setProcessing(false);
        setScanning(true);
        return;
      }

      // Validate ticket
      const ticket = await TicketScannerService.validateTicket(data);
      setScannedTicket(ticket);
      setShowResult(true);

      // Extra vibration for winners!
      if (ticket.isWinner) {
        Vibration.vibrate([0, 200, 100, 200]);
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', 'Failed to validate ticket. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualEntry = () => {
    Alert.prompt(
      'Enter Barcode',
      'Manually enter the ticket barcode:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Scan',
          onPress: (barcode) => {
            if (barcode) {
              handleBarCodeScanned({ type: 'manual', data: barcode });
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const renderScannerView = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>⚠️ Camera access required</Text>
          <Text style={styles.helperText}>
            Please enable camera permissions in your device settings to scan tickets.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={requestCameraPermission}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        {/* Camera View - Uncomment when expo-camera is installed */}
        {/* <Camera
          style={styles.camera}
          onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
          barCodeScannerSettings={{
            barCodeTypes: [BarCodeScanner.Constants.BarCodeType.code128],
          }}
        /> */}

        {/* MVP Demo: Placeholder camera view */}
        <View style={styles.cameraPlaceholder}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />

            <Text style={styles.scanInstructions}>
              {processing ? 'Processing...' : 'Align barcode within frame'}
            </Text>
          </View>
        </View>

        {/* Scan button overlay */}
        <View style={styles.controlsContainer}>
          {!scanning ? (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setScanning(true)}
              disabled={processing}
            >
              <Text style={styles.scanButtonText}>
                {processing ? 'Processing...' : 'Start Scanning'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => setScanning(false)}
            >
              <Text style={styles.stopButtonText}>Stop Scanning</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
            <Text style={styles.manualButtonText}>📝 Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderResultModal = () => {
    if (!scannedTicket) return null;

    const isWinner = scannedTicket.isWinner;

    return (
      <Modal
        visible={showResult}
        animationType="slide"
        transparent
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.resultCard, isWinner && styles.winnerCard]}>
            {/* Winner/Loser Header */}
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{isWinner ? '🎉' : '❌'}</Text>
              <Text style={[styles.resultTitle, isWinner && styles.winnerTitle]}>
                {isWinner ? 'WINNER!' : 'Not a Winner'}
              </Text>
            </View>

            {/* Ticket Details */}
            <View style={styles.ticketDetails}>
              <Text style={styles.gameName}>{scannedTicket.gameName}</Text>
              <Text style={styles.ticketPrice}>${scannedTicket.price} Ticket</Text>

              {isWinner && scannedTicket.prizeAmount && (
                <View style={styles.prizeContainer}>
                  <Text style={styles.prizeLabel}>Prize Amount:</Text>
                  <Text style={styles.prizeAmount}>
                    ${scannedTicket.prizeAmount.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.scanAnotherButton}
                onPress={() => {
                  setShowResult(false);
                  setScannedTicket(null);
                  setScanning(true);
                }}
              >
                <Text style={styles.scanAnotherButtonText}>Scan Another</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowResult(false);
                  setScannedTicket(null);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            {isWinner && (
              <Text style={styles.congratsText}>
                🎊 Congratulations! Remember to claim your prize at an authorized retailer.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {renderScannerView()}
      {renderResultModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#FF4500',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  helperText: {
    color: '#708090',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 180,
    borderWidth: 2,
    borderColor: '#00FFFF',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00FFFF',
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanInstructions: {
    color: '#00FFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#00FFFF',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#0A0A0F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 12,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  manualButton: {
    backgroundColor: '#2E2E3F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  manualButtonText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#2E2E3F',
  },
  winnerCard: {
    borderColor: '#FFD700',
    backgroundColor: '#1A2E1A',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  winnerTitle: {
    color: '#FFD700',
  },
  ticketDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gameName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  ticketPrice: {
    fontSize: 16,
    color: '#708090',
    marginBottom: 16,
  },
  prizeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#2E2E3F',
    borderRadius: 12,
    width: '100%',
  },
  prizeLabel: {
    fontSize: 14,
    color: '#708090',
    marginBottom: 8,
  },
  prizeAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00FF7F',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scanAnotherButton: {
    flex: 1,
    backgroundColor: '#00FFFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  scanAnotherButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#2E2E3F',
    paddingVertical: 14,
    borderRadius: 8,
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  congratsText: {
    color: '#FFD700',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});