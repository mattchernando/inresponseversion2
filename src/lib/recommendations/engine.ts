import { RecommendationResult, CardPrinting, PriceSnapshot } from '../types';

export interface RecommendationInput {
  currentPrice: number | null;
  priceHistory: PriceSnapshot[];
  card: {
    released_at: string;
    reprint: boolean;
  };
  printing: {
    rarity: string;
    released_at: string;
  };
  printingsCount: number;
}

export function getBuySignal(input: RecommendationInput): RecommendationResult {
  const { currentPrice, priceHistory, card, printing, printingsCount } = input;
  
  // If no current price, we can't make a recommendation
  if (!currentPrice) {
    return {
      verdict: 'fair_price',
      confidence: 'low',
      targetPrice: null,
      summary: 'No current price data available for this card.',
      factors: ['Missing price data']
    };
  }

  // If no price history, provide conservative recommendation
  if (!priceHistory || priceHistory.length === 0) {
    return {
      verdict: 'fair_price',
      confidence: 'low',
      targetPrice: null,
      summary: 'Limited price history available. Monitor for more data before making a decision.',
      factors: ['Insufficient historical data']
    };
  }

  // Calculate price statistics
  const prices = priceHistory
    .map(snapshot => snapshot.usd)
    .filter(price => price !== null) as number[];
    
  if (prices.length === 0) {
    return {
      verdict: 'fair_price',
      confidence: 'low',
      targetPrice: null,
      summary: 'No reliable price history available.',
      factors: ['No valid price data in history']
    };
  }

  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const volatility = (maxPrice - minPrice) / averagePrice;
  
  // Get recent trend (last 7 days vs previous period)
  const recentPrices = priceHistory
    .slice(-7)
    .map(snapshot => snapshot.usd)
    .filter(price => price !== null) as number[];
    
  const olderPrices = priceHistory
    .slice(-14, -7)
    .map(snapshot => snapshot.usd)
    .filter(price => price !== null) as number[];
    
  let recentTrend = 'stable';
  if (recentPrices.length > 0 && olderPrices.length > 0) {
    const recentAvg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((sum, price) => sum + price, 0) / olderPrices.length;
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) recentTrend = 'up';
    else if (change < -0.05) recentTrend = 'down';
  }

  // Calculate how current price compares to recent average
  const priceVsAverage = (currentPrice - averagePrice) / averagePrice;
  
  // Determine factors that influence the decision
  const factors: string[] = [];
  
  // Age factors
  const daysSinceRelease = Math.floor((Date.now() - new Date(printing.released_at).getTime()) / (1000 * 60 * 60 * 24));
  const isNewRelease = daysSinceRelease < 30;
  const isRecentRelease = daysSinceRelease < 90;
  
  if (isNewRelease) {
    factors.push('Recently released card');
  } else if (isRecentRelease) {
    factors.push('Recent release');
  }
  
  // Rarity factors
  if (printing.rarity === 'mythic') {
    factors.push('Mythic rarity');
  } else if (printing.rarity === 'rare') {
    factors.push('Rare rarity');
  }
  
  // Volatility factors
  if (volatility > 0.5) {
    factors.push('High price volatility');
  } else if (volatility < 0.1) {
    factors.push('Stable pricing');
  }
  
  // Trend factors
  if (recentTrend === 'up') {
    factors.push('Price trending up');
  } else if (recentTrend === 'down') {
    factors.push('Price trending down');
  }
  
  // Multiple printings factor
  if (printingsCount > 5) {
    factors.push('Many printings available');
  } else if (printingsCount <= 2) {
    factors.push('Limited printings');
  }
  
  // Reprint factor
  if (card.reprint) {
    factors.push('Reprint card');
  }
  
  // Make recommendation based on heuristics
  let verdict: RecommendationResult['verdict'];
  let confidence: RecommendationResult['confidence'];
  let targetPrice: number | null = null;
  let summary: string;
  
  // High volatility + trending down = wait
  if (volatility > 0.3 && recentTrend === 'down') {
    verdict = 'wait';
    confidence = 'medium';
    summary = 'This card is experiencing high volatility with a downward trend. Waiting may provide better pricing opportunities.';
  }
  // Price significantly above average + trending up = wait
  else if (priceVsAverage > 0.15 && recentTrend === 'up') {
    verdict = 'wait';
    confidence = 'medium';
    summary = 'This card appears overpriced compared to recent averages and is trending up. Consider waiting for a price correction.';
    targetPrice = averagePrice * 0.95; // Suggest buying at 5% below average
  }
  // Price significantly below average = buy now
  else if (priceVsAverage < -0.15) {
    verdict = 'buy_now';
    confidence = volatility < 0.2 ? 'high' : 'medium';
    summary = 'This card is priced below recent averages, potentially representing good value.';
  }
  // Price near average with low volatility = fair price/buy now
  else if (Math.abs(priceVsAverage) < 0.1 && volatility < 0.15) {
    verdict = 'fair_price';
    confidence = 'high';
    summary = 'This price is fair and stable. Buying now is reasonable if you need the card.';
  }
  // New release with high price = wait
  else if (isNewRelease && priceVsAverage > 0.1) {
    verdict = 'wait';
    confidence = 'medium';
    summary = 'New releases often see price corrections after initial hype. Consider waiting if not urgent.';
    targetPrice = averagePrice * 0.9; // Suggest buying at 10% below average
  }
  // Low confidence scenarios
  else {
    verdict = 'fair_price';
    confidence = priceHistory.length < 7 ? 'low' : 'medium';
    
    if (priceVsAverage > 0.1) {
      summary = 'Price appears slightly elevated. Monitor for better entry points unless you need this card now.';
      targetPrice = averagePrice * 0.95;
    } else if (priceVsAverage < -0.05) {
      summary = 'Price appears reasonable. This could be a good opportunity if you need this card.';
    } else {
      summary = 'Price appears fair based on recent data.';
    }
  }
  
  // Adjust confidence based on data completeness
  if (priceHistory.length < 14) {
    confidence = confidence === 'high' ? 'medium' : 'low';
  }
  
  if (isNewRelease && priceHistory.length < 7) {
    confidence = 'low';
    factors.push('Limited data for new release');
  }
  
  return {
    verdict,
    confidence,
    targetPrice,
    summary,
    factors
  };
}

export function getRecommendationBadgeColor(verdict: RecommendationResult['verdict']): string {
  switch (verdict) {
    case 'buy_now':
      return 'bg-green-500';
    case 'wait':
      return 'bg-red-500';
    case 'fair_price':
      return 'bg-blue-500';
    case 'buy_below_target':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
}

export function getRecommendationBadgeText(verdict: RecommendationResult['verdict']): string {
  switch (verdict) {
    case 'buy_now':
      return 'Buy Now';
    case 'wait':
      return 'Wait';
    case 'fair_price':
      return 'Fair Price';
    case 'buy_below_target':
      return 'Buy Below Target';
    default:
      return 'Unknown';
  }
}

export function getConfidenceColor(confidence: RecommendationResult['confidence']): string {
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
