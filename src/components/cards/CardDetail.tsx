'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Plus, Briefcase } from 'lucide-react';
import { CardPrinting, Card as CardType, Set, RecommendationResult, PriceSnapshot, PortfolioHolding } from '@/lib/types';
import { formatPrice, formatDate, getRarityColor, getFinishColor } from '@/lib/scryfall/transform';
import { getRecommendationBadgeColor, getRecommendationBadgeText, getConfidenceColor } from '@/lib/recommendations/engine';
import { getHoldingProjection } from '@/lib/projections/engine';
import { AddToPortfolioModal } from '@/components/portfolio/AddToPortfolioModal';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CardDetailProps {
  initialData?: {
    printing: (CardPrinting & { card?: CardType; set?: Set });
    printings: (CardPrinting & { set?: Set })[];
    priceHistory: PriceSnapshot[];
    recommendation: RecommendationResult;
    userHolding?: PortfolioHolding;
  };
}

export function CardDetail({ initialData }: CardDetailProps) {
  const params = useParams();
  const cardId = params.id as string;
  
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!initialData) {
      fetchCardData();
    }
  }, [cardId]);

  const fetchCardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cards/${cardId}`);
      const cardData = await response.json();
      setData(cardData);
    } catch (error) {
      console.error('Failed to fetch card data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuccess = () => {
    // Refresh data to show updated holding status
    fetchCardData();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="aspect-[2.5/3.5] bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 text-center">
        <div className="text-gray-500">Card not found</div>
      </div>
    );
  }

  const { printing, printings, priceHistory, recommendation, userHolding } = data;

  // Prepare chart data
  const chartData = priceHistory
    .filter(snapshot => snapshot.usd !== null)
    .map(snapshot => ({
      date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: snapshot.usd as number
    }))
    .slice(-30); // Last 30 data points

  const getTrendIcon = () => {
    if (chartData.length < 2) return <Minus className="h-4 w-4" />;
    
    const recent = chartData.slice(-7);
    const older = chartData.slice(-14, -7);
    
    if (recent.length === 0 || older.length === 0) return <Minus className="h-4 w-4" />;
    
    const recentAvg = recent.reduce((sum, d) => sum + d.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.price, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.05) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (recentAvg < olderAvg * 0.95) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  // Get holding projection if user owns this card
  const holdingProjection = userHolding ? getHoldingProjection(userHolding) : null;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </Link>
        <div className="flex-1" />
        {userHolding ? (
          <Badge variant="outline" className="text-green-600">
            <Briefcase className="h-3 w-3 mr-1" />
            In Portfolio ({userHolding.quantity}x)
          </Badge>
        ) : (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Portfolio
          </Button>
        )}
      </div>

      {/* Main Card Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Image */}
        <div className="space-y-4">
          <div className="aspect-[2.5/3.5] bg-gray-100 rounded-lg overflow-hidden">
            {printing.image_uri ? (
              <img
                src={printing.image_uri}
                alt={printing.card?.name || 'Card'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          
          {/* Quick Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Set</div>
                  <div className="font-medium">{printing.set?.name}</div>
                </div>
                <div>
                  <div className="text-gray-500">Collector #</div>
                  <div className="font-medium">{printing.collector_number}</div>
                </div>
                <div>
                  <div className="text-gray-500">Rarity</div>
                  <Badge className={`text-white ${getRarityColor(printing.rarity)}`}>
                    {printing.rarity}
                  </Badge>
                </div>
                <div>
                  <div className="text-gray-500">Released</div>
                  <div className="font-medium">{formatDate(printing.released_at)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{printing.card?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                {printing.card?.mana_cost && (
                  <div className="font-mono text-lg">{printing.card.mana_cost}</div>
                )}
                <Badge variant="outline">{printing.card?.type_line}</Badge>
              </div>
              
              {printing.card?.oracle_text && (
                <div className="text-gray-700 whitespace-pre-line">
                  {printing.card.oracle_text}
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">
                  {formatPrice(printing.usd)}
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon()}
                  <span className="text-sm text-gray-500">7-day trend</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Holding Info */}
          {userHolding && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Holding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Quantity</div>
                    <div className="font-medium">{userHolding.quantity}x</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Purchase Price</div>
                    <div className="font-medium">{formatPrice(userHolding.purchase_price)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Cost Basis</div>
                    <div className="font-medium">{formatPrice(userHolding.cost_basis || 0)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Current Value</div>
                    <div className="font-medium">{formatPrice(userHolding.current_value || 0)}</div>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  (userHolding.gain_loss || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Gain/Loss</span>
                    <div className="text-right">
                      <div className={`font-bold ${
                        (userHolding.gain_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPrice(userHolding.gain_loss || 0)}
                      </div>
                      <div className={`text-sm ${
                        (userHolding.gain_loss_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {userHolding.gain_loss_percent ? 
                          `${userHolding.gain_loss_percent >= 0 ? '+' : ''}${userHolding.gain_loss_percent.toFixed(1)}%` 
                          : '0%'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {holdingProjection && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600">Holding Outlook</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {holdingProjection.direction}
                      </Badge>
                      <span className={`text-xs ${getConfidenceColor(holdingProjection.confidence)}`}>
                        {holdingProjection.confidence} confidence
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{holdingProjection.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Market Recommendation
                {userHolding && ' vs Your Position'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={`text-white ${getRecommendationBadgeColor(recommendation.verdict)}`}>
                  {getRecommendationBadgeText(recommendation.verdict)}
                </Badge>
                <span className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                  {recommendation.confidence} confidence
                </span>
              </div>
              
              <p className="text-gray-700">{recommendation.summary}</p>
              
              {userHolding && userHolding.purchase_price && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Your cost:</strong> {formatPrice(userHolding.purchase_price)} 
                    {' vs '}
                    <strong>Current:</strong> {formatPrice(printing.usd)}
                  </div>
                </div>
              )}
              
              {recommendation.targetPrice && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm text-orange-800">
                    <strong>Target buy price:</strong> {formatPrice(recommendation.targetPrice)}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">Factors considered:</div>
                <div className="flex flex-wrap gap-2">
                  {recommendation.factors.map((factor, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="printings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="printings">Other Printings</TabsTrigger>
          <TabsTrigger value="price-history">Price History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="printings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Printings ({printings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {printings.map((otherPrinting) => (
                  <div
                    key={otherPrinting.id}
                    className={`p-4 border rounded-lg ${
                      otherPrinting.id === printing.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="font-medium">{otherPrinting.set?.name}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {otherPrinting.set?.code}
                        </Badge>
                        <Badge className={`text-xs text-white ${getRarityColor(otherPrinting.rarity)}`}>
                          {otherPrinting.rarity}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        #{otherPrinting.collector_number} · {formatDate(otherPrinting.released_at)}
                      </div>
                      <div className="text-lg font-bold">
                        {formatPrice(otherPrinting.usd)}
                      </div>
                      {otherPrinting.finish && (
                        <div className={`w-full h-2 rounded ${getFinishColor(otherPrinting.finish)}`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="price-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price History (Last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPrice(Number(value))} />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No price history available for this card
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add to Portfolio Modal */}
      <AddToPortfolioModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        printing={printing}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
