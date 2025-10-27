import React from 'react';
import { EmptyState } from '../common/EmptyState';

interface OfflineStateProps {
  onRetry?: () => void;
}

/**
 * Empty State for when the app is offline
 */
export function OfflineState({ onRetry }: OfflineStateProps) {
  return (
    <EmptyState
      icon="📡"
      title="No Internet Connection"
      message="Scratch Oracle needs an internet connection to fetch the latest game data and recommendations. Please check your connection and try again."
      actionLabel={onRetry ? "Try Again" : undefined}
      onAction={onRetry}
    />
  );
}
