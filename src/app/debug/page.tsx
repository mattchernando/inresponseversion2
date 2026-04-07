'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [envStatus, setEnvStatus] = useState<any>({});
  const [supabaseStatus, setSupabaseStatus] = useState<{ text: string; success: boolean }>({
    text: 'Checking...',
    success: false
  });

  useEffect(() => {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      SCRYFALL_API_BASE_URL: process.env.SCRYFALL_API_BASE_URL || 'Missing',
    };
    setEnvStatus(envCheck);

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data, error } = await supabase.from('sets').select('count').limit(1);
        
        if (error) {
          setSupabaseStatus({ text: `Error: ${error.message}`, success: false });
        } else {
          setSupabaseStatus({ text: 'Connected successfully', success: true });
        }
      } catch (err) {
        setSupabaseStatus({ text: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`, success: false });
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">InResponse v2 Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Environment Variables Status</h2>
          <div className="space-y-2">
            {Object.entries(envStatus).map(([key, status]) => (
              <div key={key} className="flex justify-between">
                <span className="font-mono text-sm">{key}:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  (status as string) === 'Set' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {status as string}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Supabase Connection Status</h2>
          <div className={`px-3 py-2 rounded ${
            supabaseStatus.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {supabaseStatus.text}
          </div>
        </div>

        <div className="mt-6">
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
