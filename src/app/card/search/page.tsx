'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowLeft, TrendingUp, TrendingDown, Minus, Star, ExternalLink } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  set_name: string;
  rarity: string;
  price: number;
  image_url: string;
  scryfall_id: string;
  recommendation?: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
  };
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      case 'BUY': return 'text-green-600 bg-green-100';
      case 'SELL': return 'text-red-600 bg-red-100';
      case 'HOLD': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'mythic': return 'text-orange-600 bg-orange-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'uncommon': return 'text-gray-600 bg-gray-100';
      case 'common': return 'text-gray-500 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-gray-900">InResponse</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Results */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            {results.length} cards found
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Searching...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 bg-red-50 p-4 rounded-lg inline-block">
              {error}
            </div>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No cards found for "{query}"</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((card) => (
            <div key={card.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Card Image */}
              <div className="aspect-[2.5/3.5] bg-gray-100 relative">
                {card.image_url ? (
                  <img 
                    src={card.image_url} 
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-gray-400 text-center">
                      <div className="text-4xl mb-2">?</div>
                      <div className="text-sm">No Image</div>
                    </div>
                  </div>
                )}
                
                {/* Recommendation Badge */}
                {card.recommendation && (
                  <div className="absolute top-2 right-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(card.recommendation.signal)}`}>
                      {card.recommendation.signal}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{card.name}</h3>
                  <p className="text-sm text-gray-600">{card.set_name}</p>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityColor(card.rarity)}`}>
                      {card.rarity}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${card.price?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                {card.recommendation && (
                  <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center space-x-1 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        card.recommendation.signal === 'BUY' ? 'bg-green-500' :
                        card.recommendation.signal === 'SELL' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="font-medium text-gray-700">
                        {card.recommendation.signal} Signal
                      </span>
                      <span className="text-gray-500">
                        ({Math.round(card.recommendation.confidence * 100)}% confidence)
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs">
                      {card.recommendation.reasoning}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link 
                    href={`/card/${card.scryfall_id}`}
                    className="flex-1 text-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium"
                  >
                    View Details
                  </Link>
                  <a 
                    href={`https://scryfall.com/card/${card.set_name.toLowerCase().replace(/\s+/g, '-')}/${card.scryfall_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
