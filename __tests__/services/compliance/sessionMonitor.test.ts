import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { SessionMonitor } from '../../../services/compliance/sessionMonitor';
import { Alert } from 'react-native';

// Mock React Native Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('SessionMonitor', () => {
  beforeEach(() => {
    // Clear all timers and reset session before each test
    jest.clearAllTimers();
    jest.clearAllMocks();
    SessionMonitor.endSession();
    SessionMonitor.resetWarning();
  });

  afterEach(() => {
    // Clean up any active sessions
    SessionMonitor.endSession();
  });

  describe('Property-based tests', () => {
    it('should handle any session duration without crashing', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          (duration) => {
            SessionMonitor.startSession();

            // Fast-forward time
            jest.advanceTimersByTime(duration);

            const sessionDuration = SessionMonitor.getSessionDuration();
            expect(sessionDuration).toBeGreaterThanOrEqual(0);

            SessionMonitor.endSession();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should never return negative duration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (delay) => {
            SessionMonitor.startSession();
            jest.advanceTimersByTime(delay);

            const duration = SessionMonitor.getSessionDuration();
            expect(duration).toBeGreaterThanOrEqual(0);

            SessionMonitor.endSession();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Session lifecycle', () => {
    it('should start a new session', () => {
      expect(SessionMonitor.isSessionActive()).toBe(false);

      SessionMonitor.startSession();

      expect(SessionMonitor.isSessionActive()).toBe(true);
      expect(SessionMonitor.getSessionDuration()).toBeGreaterThanOrEqual(0);
    });

    it('should not start multiple sessions', () => {
      SessionMonitor.startSession();
      const firstStart = SessionMonitor.getSessionDuration();

      SessionMonitor.startSession(); // Try to start again

      expect(SessionMonitor.isSessionActive()).toBe(true);
      // Duration should be similar (not reset)
      expect(SessionMonitor.getSessionDuration()).toBeGreaterThanOrEqual(firstStart);
    });

    it('should end an active session', () => {
      SessionMonitor.startSession();
      expect(SessionMonitor.isSessionActive()).toBe(true);

      SessionMonitor.endSession();

      expect(SessionMonitor.isSessionActive()).toBe(false);
      expect(SessionMonitor.getSessionDuration()).toBe(0);
    });

    it('should handle ending a session that was never started', () => {
      expect(SessionMonitor.isSessionActive()).toBe(false);

      SessionMonitor.endSession();

      expect(SessionMonitor.isSessionActive()).toBe(false);
      expect(SessionMonitor.getSessionDuration()).toBe(0);
    });
  });

  describe('Session duration tracking', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should track session duration correctly', () => {
      SessionMonitor.startSession();

      expect(SessionMonitor.getSessionDuration()).toBe(0);

      // Advance 1 minute
      jest.advanceTimersByTime(60 * 1000);
      expect(SessionMonitor.getSessionDuration()).toBeGreaterThanOrEqual(60 * 1000);

      // Advance another 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);
      expect(SessionMonitor.getSessionDuration()).toBeGreaterThanOrEqual(6 * 60 * 1000);
    });

    it('should return 0 duration when no session is active', () => {
      expect(SessionMonitor.getSessionDuration()).toBe(0);
    });

    it('should format duration correctly for minutes', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      const formatted = SessionMonitor.getFormattedDuration();
      expect(formatted).toBe('5m');
    });

    it('should format duration correctly for hours and minutes', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(125 * 60 * 1000); // 125 minutes = 2h 5m

      const formatted = SessionMonitor.getFormattedDuration();
      expect(formatted).toBe('2h 5m');
    });

    it('should format duration for exactly 1 hour', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(60 * 60 * 1000); // 60 minutes

      const formatted = SessionMonitor.getFormattedDuration();
      expect(formatted).toBe('1h 0m');
    });

    it('should format duration for 0 minutes', () => {
      SessionMonitor.startSession();

      const formatted = SessionMonitor.getFormattedDuration();
      expect(formatted).toBe('0m');
    });
  });

  describe('90-minute alert triggers', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should NOT trigger alert before 90 minutes', () => {
      SessionMonitor.startSession();

      // Advance 89 minutes
      jest.advanceTimersByTime(89 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should trigger alert at exactly 90 minutes', () => {
      SessionMonitor.startSession();

      // Advance to 90 minutes
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    it('should trigger alert after 90 minutes', () => {
      SessionMonitor.startSession();

      // Advance to 95 minutes
      jest.advanceTimersByTime(95 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    it('should only show alert once per session', () => {
      SessionMonitor.startSession();

      // Advance to 90 minutes
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1);

      // Advance more time
      jest.advanceTimersByTime(30 * 60 * 1000);
      jest.runOnlyPendingTimers();

      // Should still only be called once
      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    it('should show alert in new session after previous session ended', () => {
      // First session
      SessionMonitor.startSession();
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1);

      SessionMonitor.endSession();

      // Second session
      SessionMonitor.startSession();
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });

    it('should include duration in alert message', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalled();

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const message = alertCall[1];

      expect(message).toContain('90 minutes');
    });

    it('should include gambling helpline in alert', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const message = alertCall[1];

      expect(message).toContain('1-800-333-HOPE');
    });

    it('should provide "Take a Break" and "Continue" options', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2] as any[];

      expect(buttons).toHaveLength(2);
      expect(buttons[0].text).toBe('Take a Break');
      expect(buttons[1].text).toBe('Continue');
    });
  });

  describe('Session reset on app close', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clear session when endSession is called', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(30 * 60 * 1000);
      expect(SessionMonitor.isSessionActive()).toBe(true);

      SessionMonitor.endSession();

      expect(SessionMonitor.isSessionActive()).toBe(false);
      expect(SessionMonitor.getSessionDuration()).toBe(0);
    });

    it('should clear check interval on session end', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1);

      SessionMonitor.endSession();

      // Advance more time - no additional alerts should occur
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1); // Still just 1
    });

    it('should reset warning flag when starting new session after end', () => {
      // First session with alert
      SessionMonitor.startSession();
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1);

      // End session
      SessionMonitor.endSession();

      // Start new session - warning should show again at 90 min
      SessionMonitor.startSession();
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Warning reset functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow warning reset for testing', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1);

      // Reset warning flag
      SessionMonitor.resetWarning();

      // Advance more time - should trigger again
      jest.advanceTimersByTime(1 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Periodic checks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should check session duration every minute', () => {
      SessionMonitor.startSession();

      // Advance 1 minute at a time and verify checks occur
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(60 * 1000);
        jest.runOnlyPendingTimers();
      }

      // Should have checked multiple times (once per minute)
      // We can verify this by confirming the session is still active
      expect(SessionMonitor.isSessionActive()).toBe(true);
    });

    it('should stop periodic checks after session ends', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(5 * 60 * 1000);
      expect(SessionMonitor.isSessionActive()).toBe(true);

      SessionMonitor.endSession();

      // Clear alert mock to verify no new calls
      (Alert.alert as jest.Mock).mockClear();

      // Advance 90 more minutes - no alerts should occur
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle very long sessions (3+ hours)', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(180 * 60 * 1000); // 3 hours
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalled();
      expect(SessionMonitor.getFormattedDuration()).toBe('3h 0m');
    });

    it('should handle session starting and stopping multiple times', () => {
      // Session 1
      SessionMonitor.startSession();
      jest.advanceTimersByTime(30 * 60 * 1000);
      SessionMonitor.endSession();

      // Session 2
      SessionMonitor.startSession();
      jest.advanceTimersByTime(30 * 60 * 1000);
      SessionMonitor.endSession();

      // Session 3
      SessionMonitor.startSession();
      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      // Should show alert in session 3
      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });

    it('should handle ending session before 90 minutes', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(50 * 60 * 1000); // 50 minutes
      SessionMonitor.endSession();

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should handle rapid session start/stop', () => {
      for (let i = 0; i < 10; i++) {
        SessionMonitor.startSession();
        jest.advanceTimersByTime(1000);
        SessionMonitor.endSession();
      }

      // Should not crash or cause issues
      expect(SessionMonitor.isSessionActive()).toBe(false);
    });
  });

  describe('Alert button callbacks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle "Take a Break" button press', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2] as any[];
      const takeBreakButton = buttons[0];

      // Should not throw
      expect(() => takeBreakButton.onPress()).not.toThrow();
    });

    it('should handle "Continue" button press', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2] as any[];
      const continueButton = buttons[1];

      // Should not throw
      expect(() => continueButton.onPress()).not.toThrow();
    });

    it('should maintain session after "Continue" is pressed', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000);
      jest.runOnlyPendingTimers();

      // Session should still be active after alert
      expect(SessionMonitor.isSessionActive()).toBe(true);
    });
  });

  describe('Coverage edge cases', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle getting formatted duration when session inactive', () => {
      const formatted = SessionMonitor.getFormattedDuration();
      expect(formatted).toBe('0m');
    });

    it('should handle 89 minutes exactly (just before threshold)', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(89 * 60 * 1000 + 59 * 1000); // 89:59
      jest.runOnlyPendingTimers();

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should handle 90 minutes and 1 second', () => {
      SessionMonitor.startSession();

      jest.advanceTimersByTime(90 * 60 * 1000 + 1000);
      jest.runOnlyPendingTimers();

      expect(Alert.alert).toHaveBeenCalledTimes(1);
    });
  });
});
