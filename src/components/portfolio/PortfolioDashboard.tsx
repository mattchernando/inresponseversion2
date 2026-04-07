'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Activity
} from 'lucide-react';
import { PortfolioSummary, ProjectionResult, PortfolioSnapshot } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/scryfall/transform';
import { getProjectionBadgeColor, getProjectionBadgeText, getConfidenceColor } from '@/lib/projections/ui-helpers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioDashboardProps {
  initialData?: {
    summary: PortfolioSummary;
    history: PortfolioSnapshot[];
    projection: ProjectionResult;
  };
}

export function PortfolioDashboard({ initialData }: PortfolioDashboardProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');

  useEffect(() => {
    if (!initialData) {
      fetchPortfolioData();
    }
  }, [timeRange]);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portfolio');
      const portfolioData = await response.json();
      setData(portfolioData.data);
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 text-center">
        <div className="text-gray-500">Unable to load portfolio data</div>
      </div>
    );
  }

  const { summary, history, projection } = data;

  // Prepare chart data
  const getFilteredHistory = () => {
    const now = new Date();
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : timeRange === '90D' ? 90 : 365;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return history
      .filter(snapshot => new Date(snapshot.snapshot_date) >= cutoffDate)
      .map(snapshot => ({
        date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: snapshot.total_value,
        gainLoss: snapshot.percent_gain_loss
      }));
  };

  const chartData = getFilteredHistory();

  const getProjectionIcon = () => {
    switch (projection.direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'flat': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return <Activity className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <p className="text-gray-600 mt-1">{summary.portfolio.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {summary.holdings_count} holdings
          </Badge>
          <Badge variant="outline" className="text-xs">
            {summary.cards_count} cards
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total Value</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(summary.total_value)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total Cost</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(summary.total_cost_basis)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Gain/Loss</div>
            <div className={`text-2xl font-bold ${
              summary.unrealized_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPrice(summary.unrealized_gain_loss)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">Return %</div>
            <div className={`text-2xl font-bold ${
              summary.percent_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercent(summary.percent_gain_loss)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Portfolio Outlook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={`text-white ${getProjectionBadgeColor(projection.direction)}`}>
              {getProjectionBadgeText(projection.direction)}
            </Badge>
            <span className={`text-sm font-medium ${getConfidenceColor(projection.confidence)}`}>
              {projection.confidence} confidence
            </span>
            {getProjectionIcon()}
          </div>
          
          <p className="text-gray-700">{projection.summary}</p>
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-600">Factors:</div>
            <div className="flex flex-wrap gap-2">
              {projection.factors.map((factor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="top-movers">Top Movers</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Portfolio Performance</CardTitle>
              <div className="flex gap-2">
                {(['7D', '30D', '90D', 'ALL'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'value' ? formatPrice(Number(value)) : formatPercent(Number(value)),
                        name === 'value' ? 'Portfolio Value' : 'Return %'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No performance data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top-movers" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <ArrowUpRight className="h-5 w-5" />
                  Top Gainers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.top_gainers.length > 0 ? (
                  <div className="space-y-3">
                    {summary.top_gainers.map((holding) => (
                      <div key={holding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{holding.card?.name}</div>
                          <div className="text-sm text-gray-600">{holding.printing?.set?.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatPercent(holding.gain_loss_percent || 0)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatPrice(holding.current_value || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No gainers yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <ArrowDownRight className="h-5 w-5" />
                  Top Losers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.top_losers.length > 0 ? (
                  <div className="space-y-3">
                    {summary.top_losers.map((holding) => (
                      <div key={holding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{holding.card?.name}</div>
                          <div className="text-sm text-gray-600">{holding.printing?.set?.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">
                            {formatPercent(holding.gain_loss_percent || 0)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatPrice(holding.current_value || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No losers yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Largest Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.largest_positions.length > 0 ? (
                <div className="space-y-3">
                  {summary.largest_positions.map((holding) => (
                    <div key={holding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{holding.card?.name}</div>
                        <div className="text-sm text-gray-600">
                          {holding.quantity}x {holding.printing?.set?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatPrice(holding.current_value || 0)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatPercent(holding.gain_loss_percent || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No positions yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
