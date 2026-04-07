#!/usr/bin/env node

import { ScryfallAPI } from '../src/lib/scryfall/api.js';
import { DatabaseService } from '../src/lib/db/service.js';
import { transformScryfallCard, transformScryfallCardToPrinting } from '../src/lib/scryfall/transform.js';

async function syncCards() {
  console.log('Starting cards synchronization...');
  
  try {
    // Get all sets from database
    const sets = await DatabaseService.getAllSets();
    console.log(`Found ${sets.length} sets in database`);
    
    let totalSynced = 0;
    let totalSkipped = 0;
    
    for (const set of sets) {
      console.log(`Syncing cards from set: ${set.name} (${set.code})`);
      
      try {
        let page = 1;
        let hasMore = true;
        let setSynced = 0;
        let setSkipped = 0;
        
        while (hasMore) {
          const response = await ScryfallAPI.getCardsInSet(set.code, page);
          
          for (const scryfallCard of response.data) {
            try {
              // Check if card already exists
              const existingCard = await DatabaseService.getCardByScryfallId(scryfallCard.id);
              
              if (existingCard) {
                setSkipped++;
                continue;
              }
              
              // Create canonical card
              const cardData = transformScryfallCard(scryfallCard);
              const card = await DatabaseService.createCard(cardData);
              
              // Create card printing
              const printingData = transformScryfallCardToPrinting(scryfallCard, card.id, set.id);
              await DatabaseService.createCardPrinting(printingData);
              
              setSynced++;
              totalSynced++;
              
            } catch (error) {
              console.error(`Error syncing card ${scryfallCard.name}:`, error);
            }
          }
          
          hasMore = response.has_more;
          page++;
          
          if (page % 10 === 0) {
            console.log(`  Progress: ${setSynced} synced, ${setSkipped} skipped...`);
          }
        }
        
        console.log(`Set ${set.code} complete: ${setSynced} synced, ${setSkipped} skipped`);
        
      } catch (error) {
        console.error(`Error syncing set ${set.code}:`, error);
      }
    }
    
    console.log(`Cards sync complete: ${totalSynced} total synced, ${totalSkipped} total skipped`);
    
  } catch (error) {
    console.error('Cards sync failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncCards();
}
