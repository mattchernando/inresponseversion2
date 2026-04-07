#!/usr/bin/env node

import { DatabaseService } from '../src/lib/db/service.js';
import { supabaseAdmin } from '../src/lib/db/supabase.js';

async function snapshotPrices() {
  console.log('Starting price snapshot...');
  
  try {
    // Get all card printings with current prices
    // Note: This is a simplified approach for Phase 1
    // In production, you'd want to fetch fresh prices from Scryfall or other sources
    
    const { data: printings, error } = await supabaseAdmin
      .from('card_printings')
      .select('*')
      .not('usd', 'is', null);
    
    if (error) throw error;
    
    console.log(`Found ${printings.length} printings with prices`);
    
    const today = new Date().toISOString().split('T')[0];
    let snapshotCount = 0;
    
    for (const printing of printings) {
      try {
        await DatabaseService.createPriceSnapshot({
          card_printing_id: printing.id,
          snapshot_date: today,
          usd: printing.usd,
          usd_foil: printing.usd_foil,
          usd_etched: printing.usd_etched,
          source: 'scryfall'
        });
        
        snapshotCount++;
        
      } catch (error) {
        // Ignore duplicate errors (same day snapshot already exists)
        if (!error.message.includes('duplicate')) {
          console.error(`Error creating snapshot for printing ${printing.id}:`, error);
        }
      }
    }
    
    console.log(`Price snapshot complete: ${snapshotCount} snapshots created`);
    
  } catch (error) {
    console.error('Price snapshot failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  snapshotPrices();
}
