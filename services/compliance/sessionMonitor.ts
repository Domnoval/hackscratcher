import { Alert } from 'react-native';

/**
 * Session monitoring service for Minnesota gambling compliance
 * Tracks session duration and reminds users to take breaks
 */
export class SessionMonitor {
  private static sessionStartTime: number | null = null;
  private static checkInterval: NodeJS.Timeout | null = null;
  private static hasShownWarning = false;
  private static readonly WARNING_THRESHOLD = 90 * 60 * 1000; // 90 minutes in milliseconds
  private static readonly CHECK_INTERVAL = 60 * 1000; // Check every minute

  /**
   * Start monitoring the user's session
   */
  static startSession(): void {
    if (this.sessionStartTime) {
      console.log('[SessionMonitor] Session already active');
      return;
    }

    this.sessionStartTime = Date.now();
    this.hasShownWarning = false;

    console.log('[SessionMonitor] Session started at', new Date(this.sessionStartTime).toISOString());

    // Start periodic check
    this.checkInterval = setInterval(() => {
      this.checkSessionDuration();
    }, this.CHECK_INTERVAL);
  }

  /**
   * End the current session
   */
  static endSession(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.sessionStartTime) {
      const duration = this.getSessionDuration();
      console.log(`[SessionMonitor] Session ended. Duration: ${Math.floor(duration / 60000)} minutes`);
    }

    this.sessionStartTime = null;
    this.hasShownWarning = false;
  }

  /**
   * Get the current session duration in milliseconds
   */
  static getSessionDuration(): number {
    if (!this.sessionStartTime) {
      return 0;
    }
    return Date.now() - this.sessionStartTime;
  }

  /**
   * Check if the session has exceeded the warning threshold
   */
  private static checkSessionDuration(): void {
    const duration = this.getSessionDuration();

    if (duration >= this.WARNING_THRESHOLD && !this.hasShownWarning) {
      this.showBreakReminder();
      this.hasShownWarning = true;
    }
  }

  /**
   * Show a reminder to take a break
   */
  private static showBreakReminder(): void {
    const durationMinutes = Math.floor(this.getSessionDuration() / 60000);

    Alert.alert(
      'Time for a Break?',
      `You've been using Scratch Oracle for ${durationMinutes} minutes. Consider taking a break and playing responsibly.\n\nRemember:\n• Set a budget and stick to it\n• Gambling should be entertainment, not income\n• Take regular breaks\n\nNeed help? Call 1-800-333-HOPE (Minnesota Problem Gambling Helpline)`,
      [
        {
          text: 'Take a Break',
          onPress: () => {
            console.log('[SessionMonitor] User chose to take a break');
            // User acknowledged the reminder
          },
          style: 'default',
        },
        {
          text: 'Continue',
          onPress: () => {
            console.log('[SessionMonitor] User chose to continue');
          },
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  }

  /**
   * Get formatted session duration for display
   */
  static getFormattedDuration(): string {
    const duration = this.getSessionDuration();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Check if the session is active
   */
  static isSessionActive(): boolean {
    return this.sessionStartTime !== null;
  }

  /**
   * Reset the warning flag (useful for testing)
   */
  static resetWarning(): void {
    this.hasShownWarning = false;
  }
}
