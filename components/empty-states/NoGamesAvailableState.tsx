import React from 'react';
import { EmptyState } from '../common/EmptyState';

interface NoGamesAvailableStateProps {
  selectedState: string;
  onRefresh?: () => void;
}

/**
 * Empty State for when no games are available for the selected state
 */
export function NoGamesAvailableState({ selectedState, onRefresh }: NoGamesAvailableStateProps) {
  return (
    <EmptyState
      icon="📭"
      title="No Games Available"
      message={`We couldn't find any active scratch-off games for ${selectedState} right now. This could mean the data is still being collected or there's a temporary issue.`}
      actionLabel={onRefresh ? "Refresh Data" : undefined}
      onAction={onRefresh}
      secondaryActionLabel="Check Back Later"
    />
  );
}
