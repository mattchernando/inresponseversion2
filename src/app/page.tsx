import { SearchComponent } from '@/components/search/SearchComponent';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            InResponse v2
          </h1>
          <p className="text-lg text-gray-600">
            MTG Card Price Intelligence
          </p>
        </div>
        
        <SearchComponent />
      </div>
    </div>
  );
}
