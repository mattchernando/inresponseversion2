import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth/service';
import { PortfolioService } from '@/lib/portfolio/service';
import { getPortfolioProjection } from '@/lib/projections/engine';

// GET /api/portfolio - Get portfolio summary and projection
export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolio = await PortfolioService.getDefaultPortfolio(user.id);
    const summary = await PortfolioService.getPortfolioSummary(portfolio.id);
    const history = await PortfolioService.getPortfolioHistory(portfolio.id);
    const projection = getPortfolioProjection({
      portfolio: summary,
      history,
      holdings: summary.top_gainers.concat(summary.top_losers, summary.largest_positions, summary.recent_additions)
    });

    return NextResponse.json({
      data: {
        summary,
        history,
        projection
      }
    });
  } catch (error) {
    console.error('Portfolio GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
