export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Page</h1>
        <p className="text-gray-600">If you can see this page, the basic routing is working.</p>
        <div className="mt-4">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
