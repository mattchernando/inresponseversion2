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
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome!</h2>
            <p className="text-gray-600 mb-4">
              This is a minimal version of the app to test basic routing.
            </p>
            <div className="space-y-2">
              <a href="/auth" className="block text-blue-600 hover:text-blue-800 underline">
                Go to Auth Page
              </a>
              <a href="/portfolio" className="block text-blue-600 hover:text-blue-800 underline">
                Go to Portfolio
              </a>
              <a href="/debug" className="block text-blue-600 hover:text-blue-800 underline">
                Go to Debug Page
              </a>
              <a href="/test" className="block text-blue-600 hover:text-blue-800 underline">
                Go to Test Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
