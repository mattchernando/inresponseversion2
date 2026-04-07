import { ProjectionResult, PortfolioSummary, PortfolioSnapshot, PortfolioHolding } from '../types';
import { getBuySignal } from '../recommendations/engine';

export interface ProjectionInput {
  portfolio: PortfolioSummary;
  history: PortfolioSnapshot[];
  holdings: PortfolioHolding[];
}

export function getPortfolioProjection(input: ProjectionInput): ProjectionResult {
  const { portfolio, history, holdings } = input;
  
  // If no history, provide low confidence projection
  if (!history || history.length < 7) {
    return {
      direction: 'uncertain',
      confidence: 'low',
      summary: 'Insufficient historical data to make a reliable projection.',
      factors: ['Limited portfolio history', 'Need at least 7 days of data']
    };
  }

  // Calculate recent trend
  const recentSnapshots = history.slice(-7);
  const olderSnapshots = history.slice(-14, -7);
  
  if (olderSnapshots.length === 0) {
    return {
      direction: 'uncertain',
      confidence: 'low',
      summary: 'Not enough historical data for trend analysis.',
      factors: ['Limited historical data']
    };
  }

  const recentAvgValue = recentSnapshots.reduce((sum, s) => sum + s.total_value, 0) / recentSnapshots.length;
  const olderAvgValue = olderSnapshots.reduce((sum, s) => sum + s.total_value, 0) / olderSnapshots.length;
  
  const trendChange = (recentAvgValue - olderAvgValue) / olderAvgValue;
  
  // Analyze holdings concentration and volatility
  const topHoldingValue = Math.max(...holdings.map(h => h.current_value || 0));
  const portfolioValue = portfolio.total_value;
  const concentration = portfolioValue > 0 ? topHoldingValue / portfolioValue : 0;
  
  // Calculate average volatility across holdings
  const volatileHoldings = holdings.filter(h => {
    if (!h.gain_loss_percent) return false;
    return Math.abs(h.gain_loss_percent) > 20; // More than 20% change is considered volatile
  });
  
  const volatilityRatio = holdings.length > 0 ? volatileHoldings.length / holdings.length : 0;
  
  // Get individual card recommendations
  const recommendations = holdings.map(holding => {
    if (!holding.card || !holding.printing) return null;
    
    return getBuySignal({
      currentPrice: holding.current_price || null,
      priceHistory: [], // Would need to fetch this for each holding
      card: {
        released_at: holding.card.released_at,
        reprint: holding.card.reprint
      },
      printing: {
        rarity: holding.printing.rarity,
        released_at: holding.printing.released_at
      },
      printingsCount: 1 // Would need to fetch this
    });
  }).filter(r => r !== null);
  
  // Count recommendation types
  const buyNowCount = recommendations.filter(r => r.verdict === 'buy_now').length;
  const waitCount = recommendations.filter(r => r.verdict === 'wait').length;
  const totalRecommendations = recommendations.length;
  
  // Determine factors
  const factors: string[] = [];
  
  if (Math.abs(trendChange) > 0.05) {
    factors.push(trendChange > 0 ? 'Recent upward trend' : 'Recent downward trend');
  }
  
  if (concentration > 0.5) {
    factors.push('High concentration in top holding');
  } else if (concentration < 0.2) {
    factors.push('Well diversified portfolio');
  }
  
  if (volatilityRatio > 0.3) {
    factors.push('High portfolio volatility');
  } else if (volatilityRatio < 0.1) {
    factors.push('Low portfolio volatility');
  }
  
  if (totalRecommendations > 0) {
    const buyRatio = buyNowCount / totalRecommendations;
    if (buyRatio > 0.6) {
      factors.push('Most cards show buy signals');
    } else if (waitCount / totalRecommendations > 0.6) {
      factors.push('Most cards suggest waiting');
    }
  }
  
  // Determine direction and confidence
  let direction: ProjectionResult['direction'];
  let confidence: ProjectionResult['confidence'];
  let summary: string;
  
  // Strong upward trend with positive indicators
  if (trendChange > 0.05 && buyNowCount > waitCount) {
    direction = 'up';
    confidence = volatilityRatio < 0.2 ? 'high' : 'medium';
    summary = 'Portfolio shows upward momentum with favorable individual card signals.';
  }
  // Strong downward trend with negative indicators
  else if (trendChange < -0.05 && waitCount > buyNowCount) {
    direction = 'down';
    confidence = volatilityRatio < 0.2 ? 'high' : 'medium';
    summary = 'Portfolio shows downward pressure with most cards suggesting to wait.';
  }
  // Mixed signals or low volatility
  else if (Math.abs(trendChange) < 0.03 && volatilityRatio < 0.15) {
    direction = 'flat';
    confidence = 'high';
    summary = 'Portfolio appears stable with minimal recent changes.';
  }
  // High uncertainty
  else if (volatilityRatio > 0.4 || concentration > 0.6) {
    direction = 'uncertain';
    confidence = 'low';
    summary = 'High volatility or concentration makes projection uncertain.';
  }
  // Slight trends
  else if (trendChange > 0.02) {
    direction = 'up';
    confidence = 'medium';
    summary = 'Portfolio shows slight upward momentum.';
  }
  else if (trendChange < -0.02) {
    direction = 'down';
    confidence = 'medium';
    summary = 'Portfolio shows slight downward pressure.';
  }
  // Default to flat/uncertain
  else {
    direction = 'flat';
    confidence = 'medium';
    summary = 'Portfolio appears stable with mixed signals.';
  }
  
  // Adjust confidence based on data completeness
  if (history.length < 30) {
    confidence = confidence === 'high' ? 'medium' : 'low';
    factors.push('Limited historical data');
  }
  
  if (totalRecommendations < holdings.length * 0.5) {
    confidence = confidence === 'high' ? 'medium' : 'low';
    factors.push('Limited individual card analysis');
  }
  
  return {
    direction,
    confidence,
    summary,
    factors
  };
}

export function getHoldingProjection(holding: PortfolioHolding): ProjectionResult {
  const factors: string[] = [];
  
  // Basic factors based on gain/loss
  if (holding.gain_loss_percent) {
    if (holding.gain_loss_percent > 20) {
      factors.push('Strong recent performance');
    } else if (holding.gain_loss_percent < -20) {
      factors.push('Recent decline in value');
    }
  }
  
  // Rarity factors
  if (holding.printing?.rarity === 'mythic') {
    factors.push('Mythic rarity - higher volatility potential');
  } else if (holding.printing?.rarity === 'rare') {
    factors.push('Rare card - moderate stability');
  } else {
    factors.push('Common/uncommon - typically stable');
  }
  
  // Set age factors
  if (holding.printing?.released_at) {
    const daysSinceRelease = Math.floor((Date.now() - new Date(holding.printing.released_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceRelease < 90) {
      factors.push('Recent release - price stabilizing');
    } else if (daysSinceRelease > 365 * 5) {
      factors.push('Older release - established pricing');
    }
  }
  
  // Concentration factors
  if (holding.quantity > 4) {
    factors.push('High quantity holding');
  }
  
  // Simple projection logic
  let direction: ProjectionResult['direction'];
  let confidence: ProjectionResult['confidence'];
  let summary: string;
  
  if (!holding.gain_loss_percent) {
    direction = 'uncertain';
    confidence = 'low';
    summary = 'Insufficient data for projection.';
  } else if (holding.gain_loss_percent > 15) {
    direction = 'flat';
    confidence = 'medium';
    summary = 'Strong recent performance - may stabilize or correct.';
  } else if (holding.gain_loss_percent < -15) {
    direction = 'up';
    confidence = 'medium';
    summary = 'Recent decline - potential recovery opportunity.';
  } else {
    direction = 'flat';
    confidence = 'high';
    summary = 'Stable performance expected.';
  }
  
  return {
    direction,
    confidence,
    summary,
    factors
  };
}
