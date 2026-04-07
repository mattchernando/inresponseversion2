#!/usr/bin/env node

import { PortfolioService } from '../src/lib/portfolio/service.js';
import { supabaseAdmin } from '../src/lib/supabase/client.js';

async function snapshotAllPortfolios() {
  console.log('Starting portfolio snapshot process...');
  
  try {
    // Get all users with portfolios
    const { data: portfolios, error: portfoliosError } = await supabaseAdmin
      .from('portfolios')
      .select(`
        id,
        user_id,
        name,
        is_default
      `);

    if (portfoliosError) throw portfoliosError;
    
    console.log(`Found ${portfolios.length} portfolios to snapshot`);

    let successCount = 0;
    let errorCount = 0;

    for (const portfolio of portfolios) {
      try {
        console.log(`Snapshotting portfolio: ${portfolio.name} (user: ${portfolio.user_id})`);
        
        await PortfolioService.createPortfolioSnapshot(portfolio.id, portfolio.user_id);
        
        successCount++;
        console.log(`  Successfully snapshot ${portfolio.name}`);
        
      } catch (error) {
        console.error(`  Failed to snapshot portfolio ${portfolio.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Portfolio snapshot complete: ${successCount} successful, ${errorCount} failed`);
    
  } catch (error) {
    console.error('Portfolio snapshot process failed:', error);
    process.exit(1);
  }
}

async function snapshotUserPortfolios(userId) {
  console.log(`Starting portfolio snapshot for user: ${userId}`);
  
  try {
    const portfolios = await PortfolioService.getUserPortfolios(userId);
    
    if (portfolios.length === 0) {
      console.log('No portfolios found for user');
      return;
    }

    console.log(`Found ${portfolios.length} portfolios to snapshot`);

    for (const portfolio of portfolios) {
      try {
        console.log(`Snapshotting portfolio: ${portfolio.name}`);
        
        await PortfolioService.createPortfolioSnapshot(portfolio.id, userId);
        
        console.log(`  Successfully snapshot ${portfolio.name}`);
        
      } catch (error) {
        console.error(`  Failed to snapshot portfolio ${portfolio.id}:`, error);
      }
    }

    console.log('User portfolio snapshot complete');
    
  } catch (error) {
    console.error('User portfolio snapshot failed:', error);
    process.exit(1);
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const userId = args[1];

if (command === 'all') {
  snapshotAllPortfolios();
} else if (command === 'user' && userId) {
  snapshotUserPortfolios(userId);
} else {
  console.log('Usage:');
  console.log('  node scripts/snapshot-portfolios.mjs all                    # Snapshot all portfolios');
  console.log('  node scripts/snapshot-portfolios.mjs user <user_id>      # Snapshot specific user portfolios');
  process.exit(1);
}
