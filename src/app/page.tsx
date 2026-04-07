'use client';

import { useState } from 'react';
import { Search, TrendingUp, BarChart3, User, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      // Will integrate with search component
      window.location.href = `/card/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-gray-900">InResponse</span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/portfolio" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>Portfolio</span>
              </Link>
              <Link href="/auth" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Account</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Search First Interface */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MTG Card Search
          </h1>
          <p className="text-gray-600">
            Find cards, check prices, and get recommendations
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for cards (e.g., Lightning Bolt, Black Lotus)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isSearching}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Live Prices</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">50K+</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Cards Tracked</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">All Sets</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">AI Insights</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">95%</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/portfolio" 
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">View Portfolio</div>
                <div className="text-sm text-gray-600">Track your collection value</div>
              </div>
            </Link>
            <Link 
              href="/auth" 
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Sign In</div>
                <div className="text-sm text-gray-600">Save your portfolio</div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
