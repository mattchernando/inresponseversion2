import { ProjectionResult } from '../types';

export function getProjectionBadgeColor(direction: ProjectionResult['direction']): string {
  switch (direction) {
    case 'up':
      return 'bg-green-500';
    case 'down':
      return 'bg-red-500';
    case 'flat':
      return 'bg-blue-500';
    case 'uncertain':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

export function getProjectionBadgeText(direction: ProjectionResult['direction']): string {
  switch (direction) {
    case 'up':
      return 'Upward Trend';
    case 'down':
      return 'Downward Trend';
    case 'flat':
      return 'Stable';
    case 'uncertain':
      return 'Uncertain';
    default:
      return 'Unknown';
  }
}

export function getConfidenceColor(confidence: ProjectionResult['confidence']): string {
  switch (confidence) {
    case 'high':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
