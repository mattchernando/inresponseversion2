'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchResult, Set } from '@/lib/types';
import { formatPrice, getRarityColor, formatDate } from '@/lib/scryfall/transform';
import Link from 'next/link';

interface SearchComponentProps {
  initialResults?: SearchResult[];
  initialSets?: Set[];
}

export function SearchComponent({ initialResults = [], initialSets = [] }: SearchComponentProps) {
  const [query, setQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [sets, setSets] = useState<Set[]>(initialSets);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Load sets on mount
    if (initialSets.length === 0) {
      fetchSets();
    }
  }, []);

  const fetchSets = async () => {
    try {
      const response = await fetch('/api/sets');
      if (!response.ok) {
        // If API fails, just use empty sets array
        console.warn('Sets API not available, using empty sets');
        setSets([]);
        return;
      }
      const data = await response.json();
      setSets(data.data || []);
    } catch (error) {
      console.error('Failed to fetch sets:', error);
      // Set empty sets to prevent app from breaking
      setSets([]);
    }
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20'
      });
      
      if (selectedSet) {
        params.append('set', selectedSet);
      }
      
      const response = await fetch(`/api/cards/search?${params}`);
      
      if (!response.ok) {
        console.warn('Search API not available, showing empty results');
        setResults([]);
        return;
      }
      
      const data = await response.json();
      setResults(data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search cards by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Select value={selectedSet} onValueChange={(value) => setSelectedSet(value || '')}>
            <SelectTrigger className="w-full sm:w-48 h-12">
              <SelectValue placeholder="All sets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All sets</SelectItem>
              {sets.map((set) => (
                <SelectItem key={set.code} value={set.code}>
                  {set.name} ({set.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isLoading || !query.trim()} className="h-12 px-6">
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>

      {/* Results */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Searching cards...</div>
        </div>
      )}

      {!isLoading && hasSearched && results.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">No cards found matching your search.</div>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Found {results.length} card{results.length !== 1 ? 's' : ''}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <Link key={result.printing.scryfall_id} href={`/card/${result.printing.scryfall_id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="aspect-[2.5/3.5] mb-3 bg-gray-100 rounded-lg overflow-hidden">
                      {result.printing.image_uri ? (
                        <img
                          src={result.printing.image_uri}
                          alt={result.card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg leading-tight">{result.card.name}</h3>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {result.set.name}
                        </Badge>
                        <Badge 
                          className={`text-xs text-white ${getRarityColor(result.printing.rarity)}`}
                        >
                          {result.printing.rarity}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>{result.card.type_line}</div>
                        {result.card.mana_cost && (
                          <div className="font-mono">{result.card.mana_cost}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-lg font-bold">
                          {formatPrice(result.printing.usd)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(result.printing.released_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!hasSearched && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">Search for Magic cards to get started</div>
          <div className="text-sm text-gray-400">
            Try searching for "Lightning Bolt", "Black Lotus", or your favorite card
          </div>
        </div>
      )}
    </div>
  );
}
