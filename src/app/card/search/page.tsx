'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ArrowLeft, ExternalLink, RotateCw, X, Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  price: number;
  price_foil: number;
  image_url: string;
  scryfall_id: string;
  recommendation?: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
  };
  card_faces?: Array<{ image_uris?: { normal: string; small: string; large: string } }>;
}

function CardDetailModal({ card, onClose }: { card: SearchResult; onClose: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [addedToPortfolio, setAddedToPortfolio] = useState(false);
  const hasBack = card.card_faces && card.card_faces.length > 1;
  const currentImageUrl = isFlipped && hasBack
    ? (card.card_faces?.[1]?.image_uris?.normal || card.image_url)
    : card.image_url;

  const signalColor =
    card.recommendation?.signal === 'BUY' ? 'text-green-400' :
    card.recommendation?.signal === 'SELL' ? 'text-red-400' : 'text-yellow-400';
  const signalBg =
    card.recommendation?.signal === 'BUY' ? 'bg-green-500/10 border-green-500/20' :
    card.recommendation?.signal === 'SELL' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20';

  const handleAddToPortfolio = () => {
    setAddedToPortfolio(true);
    setTimeout(() => setAddedToPortfolio(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div>
            <h2 className="font-semibold text-white text-sm">{card.name}</h2>
            <p className="text-xs text-gray-400">{card.set_name} · {card.rarity}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Image */}
        <div className="relative flex justify-center px-4 pt-4">
          <div className="relative w-48 rounded-lg overflow-hidden shadow-lg">
            {currentImageUrl ? (
              <img src={currentImageUrl} alt={card.name} className="w-full h-auto" />
            ) : (
              <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-gray-600">No Image</div>
            )}
          </div>
          {hasBack && (
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="absolute bottom-2 right-6 p-1.5 bg-black/60 rounded-full hover:bg-black/80"
              title={isFlipped ? 'Show front' : 'Show back'}
            >
              <RotateCw className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>

        {/* Prices */}
        <div className="flex justify-center gap-6 px-4 pt-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Market</div>
            <div className="text-lg font-bold text-white">
              {card.price > 0 ? `$${card.price.toFixed(2)}` : '—'}
            </div>
          </div>
          {card.price_foil > 0 && (
            <div className="text-center">
              <div className="text-xs text-gray-500">Foil</div>
              <div className="text-lg font-bold text-yellow-400">✦ ${card.price_foil.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Recommendation */}
        {card.recommendation && (
          <div className={`mx-4 mt-3 px-3 py-2 rounded-lg border ${signalBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${signalColor}`}>
                {card.recommendation.signal}
              </span>
              <span className="text-xs text-gray-400">
                {Math.round(card.recommendation.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{card.recommendation.reasoning}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 px-4 py-4">
          <button
            onClick={handleAddToPortfolio}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              addedToPortfolio
                ? 'bg-green-700 text-white'
                : 'bg-green-500 text-black hover:bg-green-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            {addedToPortfolio ? 'Added!' : 'Add to Portfolio'}
          </button>
          <a
            href={`https://scryfall.com/card/${card.set}/${card.collector_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-xs text-gray-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Scryfall
          </a>
          <a
            href={`https://www.tcgplayer.com/search/magic/product?q=${encodeURIComponent(card.name)}&view=grid`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-xs text-gray-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            TCG
          </a>
        </div>
      </div>
    </div>
  );
}

function CardRow({ card, onDetails, getRarityColor, getRecommendationColor }: {
  card: SearchResult;
  onDetails: (card: SearchResult) => void;
  getRarityColor: (rarity: string) => string;
  getRecommendationColor: (signal: string) => string;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const hasBack = card.card_faces && card.card_faces.length > 1;
  const currentImageUrl = isFlipped && hasBack
    ? (card.card_faces?.[1]?.image_uris?.normal || card.image_url)
    : card.image_url;

  return (
    <div className="bg-gray-900 rounded border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-center gap-3 px-3 py-2">
        {/* Card Image */}
        <div className="w-10 h-14 bg-gray-800 relative flex-shrink-0 rounded overflow-hidden">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="text-gray-600 text-center"><div class="text-sm">?</div></div></div>`;
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-600 text-sm">?</div>
            </div>
          )}
          {hasBack && (
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
              title={isFlipped ? 'Show front' : 'Show back'}
            >
              <RotateCw className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* Card Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <h3 className="font-medium text-white text-xs truncate leading-tight">{card.name}</h3>
              <p className="text-xs text-gray-500 truncate leading-tight">{card.set_name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs font-bold text-white">
                {card.price > 0 ? `$${card.price.toFixed(2)}` : '—'}
              </div>
              {card.price_foil > 0 && (
                <div className="text-xs text-yellow-400">✦ ${card.price_foil.toFixed(2)}</div>
              )}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-2">
            {card.recommendation && (
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  card.recommendation.signal === 'BUY' ? 'bg-green-500' :
                  card.recommendation.signal === 'SELL' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-xs text-gray-400">
                  {card.recommendation.signal} {Math.round(card.recommendation.confidence * 100)}%
                </span>
              </div>
            )}
            <button
              onClick={() => onDetails(card)}
              className="text-xs px-2 py-0.5 bg-green-600 text-black rounded hover:bg-green-500 font-medium"
            >
              Details
            </button>
            <a
              href={`https://www.tcgplayer.com/search/magic/product?q=${encodeURIComponent(card.name)}&view=grid`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-0.5 text-gray-500 hover:text-gray-300"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState<SearchResult | null>(null);

  useEffect(() => {
    if (query) {
      searchCards(query);
    }
  }, [query]);

  const searchCards = async (searchQuery: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/cards/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.data || []);
    } catch (err) {
      setError('Failed to search cards');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'SELL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HOLD': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'mythic': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'rare': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'uncommon': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'common': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {selectedCard && (
        <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
      {/* Robinhood Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-400 hover:text-white flex items-center space-x-1">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </a>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                <span className="font-bold text-white text-sm">InResponse</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Results for "{query}"
          </h1>
          <p className="text-gray-400">
            {results.length} cards found
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400">Searching...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg inline-block">
              {error}
            </div>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">No cards found for "{query}"</div>
          </div>
        )}

        <div className="space-y-2">
          {results.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              onDetails={setSelectedCard}
              getRarityColor={getRarityColor}
              getRecommendationColor={getRecommendationColor}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
