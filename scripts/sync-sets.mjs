#!/usr/bin/env node

import { ScryfallAPI } from '../src/lib/scryfall/api.js';
import { DatabaseService } from '../src/lib/db/service.js';
import { transformScryfallSet } from '../src/lib/scryfall/transform.js';

async function syncSets() {
  console.log('Starting sets synchronization...');
  
  try {
    const scryfallSets = await ScryfallAPI.getAllSets();
    console.log(`Found ${scryfallSets.length} sets from Scryfall`);
    
    let synced = 0;
    let skipped = 0;
    
    for (const scryfallSet of scryfallSets) {
      try {
        // Check if set already exists
        const existingSet = await DatabaseService.getSetByCode(scryfallSet.code);
        
        if (existingSet) {
          console.log(`Set ${scryfallSet.code} already exists, skipping...`);
          skipped++;
          continue;
        }
        
        // Transform and create set
        const setData = transformScryfallSet(scryfallSet);
        await DatabaseService.createSet(setData);
        
        console.log(`Synced set: ${scryfallSet.name} (${scryfallSet.code})`);
        synced++;
        
      } catch (error) {
        console.error(`Error syncing set ${scryfallSet.code}:`, error);
      }
    }
    
    console.log(`Sets sync complete: ${synced} synced, ${skipped} skipped`);
    
  } catch (error) {
    console.error('Sets sync failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncSets();
}
