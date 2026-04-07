'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, BarChart3, User, Bell, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      setIsSearching(true);
      router.push(`/card/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Robinhood Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                <span className="font-bold text-white text-sm">InResponse</span>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="/portfolio" className="text-gray-400 hover:text-white text-sm font-medium">Portfolio</Link>
                <Link href="#" className="text-gray-400 hover:text-white text-sm font-medium">Watchlist</Link>
                <Link href="#" className="text-gray-400 hover:text-white text-sm font-medium">Orders</Link>
                <Link href="#" className="text-gray-400 hover:text-white text-sm font-medium">Crypto</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-white">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
              </button>
              <Link href="/auth" className="p-2 text-gray-400 hover:text-white">
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Portfolio Summary Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Portfolio Value</div>
              <div className="text-2xl font-bold">$12,458.32</div>
              <div className="flex items-center space-x-1 text-green-500 text-sm">
                <ArrowUpRight className="w-3 h-3" />
                <span>+5.2%</span>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Today's P&L</div>
              <div className="text-2xl font-bold text-green-500">+$247.18</div>
              <div className="flex items-center space-x-1 text-green-500 text-sm">
                <ArrowUpRight className="w-3 h-3" />
                <span>+2.0%</span>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Gain</div>
              <div className="text-2xl font-bold text-green-500">+$3,247.89</div>
              <div className="flex items-center space-x-1 text-green-500 text-sm">
                <ArrowUpRight className="w-3 h-3" />
                <span>+35.2%</span>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Cards Owned</div>
              <div className="text-2xl font-bold">47</div>
              <div className="text-gray-500 text-sm">12 sets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Search Cards</h2>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)}
                  placeholder="Search for cards..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-green-600 text-black rounded-lg hover:bg-green-500 active:bg-green-400 disabled:opacity-50 font-semibold flex items-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Movers */}
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold">Top Movers</h3>
              <Activity className="w-4 h-4 text-gray-400" />
            </div>
            <div className="divide-y divide-gray-800">
              {[
                { name: "Black Lotus", set: "Alpha", price: "$8,450.00", change: "+12.3%", gain: true },
                { name: "Time Walk", set: "Beta", price: "$3,200.00", change: "+8.7%", gain: true },
                { name: "Ancestral Recall", set: "Limited", price: "$2,850.00", change: "-3.2%", gain: false },
                { name: "Mox Sapphire", set: "Unlimited", price: "$2,450.00", change: "+5.1%", gain: true },
                { name: "Underground Sea", set: "Revised", price: "$1,850.00", change: "+4.8%", gain: true },
              ].map((card, index) => (
                <div key={index} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{card.name}</div>
                      <div className="text-gray-400 text-sm">{card.set}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{card.price}</div>
                      <div className={`text-sm flex items-center ${
                        card.gain ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {card.gain ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {card.change}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Stats */}
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold">Market Stats</h3>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">MTG Index</span>
                <div className="text-right">
                  <div className="font-semibold">1,847.32</div>
                  <div className="text-green-500 text-sm flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +1.8%
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Premium Cards</span>
                <div className="text-right">
                  <div className="font-semibold">3,245.67</div>
                  <div className="text-red-500 text-sm flex items-center">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    -0.6%
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Reserved List</span>
                <div className="text-right">
                  <div className="font-semibold">892.14</div>
                  <div className="text-green-500 text-sm flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +3.2%
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Volume 24h</span>
                <div className="text-right">
                  <div className="font-semibold">$2.4M</div>
                  <div className="text-green-500 text-sm flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +12.5%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center space-x-4">
          <Link 
            href="/portfolio"
            className="px-6 py-3 bg-green-600 text-black rounded-lg hover:bg-green-500 font-semibold"
          >
            View Portfolio
          </Link>
          <button className="px-6 py-3 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 font-semibold">
            Deposit Funds
          </button>
        </div>
      </main>
    </div>
  );
}
