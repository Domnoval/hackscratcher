import React from 'react';
import { EmptyState } from '../common/EmptyState';

interface NoRecommendationsStateProps {
  onGetStarted: () => void;
}

/**
 * Empty State for when user hasn't requested recommendations yet
 */
export function NoRecommendationsState({ onGetStarted }: NoRecommendationsStateProps) {
  return (
    <EmptyState
      icon="🎯"
      title="Ready to Find the Best Tickets?"
      message="Enter your budget above and we'll analyze all available scratch-off games to find the best value for your money."
      actionLabel="Enter Budget Above"
      onAction={onGetStarted}
    />
  );
}
