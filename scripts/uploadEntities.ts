/**
 * One-time script to upload entities.json data to Supabase
 * Run this script locally to populate the database with initial data
 * Usage: npx tsx scripts/uploadEntities.ts
 */

import { supabase } from '../lib/supabase';
import fs from 'fs/promises';
import path from 'path';

interface ArkhamEntity {
  address: string;
  chain: string;
  arkhamEntity: {
    name: string;
    note: string;
    id: string;
    type: 'individual' | 'fund' | 'institution';
    service: string | null;
    addresses: string[] | null;
    twitter: string;
  };
  collected_at: string;
}

async function uploadEntities() {
  try {
    console.log('📤 Starting entities upload to Supabase...\n');
    
    // Read entities.json file
    const filePath = path.join(process.cwd(), '..', 'arkham_entity_collector', 'data', 'entities.json');
    console.log(`📁 Reading file from: ${filePath}`);
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const entitiesObj = JSON.parse(fileContent);
    const entities: ArkhamEntity[] = Object.values(entitiesObj);
    
    console.log(`✅ Found ${entities.length} entities to upload\n`);
    
    // Upload in batches to avoid overwhelming the database
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      console.log(`📊 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entities.length / batchSize)} (${batch.length} entities)`);
      
      // Prepare batch for upsert
      const batchData = batch.map(entity => ({
        address: entity.address,
        name: entity.arkhamEntity.name,
        twitter: entity.arkhamEntity.twitter,
        entity_type: entity.arkhamEntity.type,
        collected_at: entity.collected_at,
        chain: entity.chain,
      }));
      
      // Upsert batch to Supabase
      const { error } = await supabase
        .from('entities')
        .upsert(batchData, {
          onConflict: 'address', // Update if address already exists
        });
      
      if (error) {
        console.error(`❌ Error uploading batch: ${error.message}`);
        errorCount += batch.length;
      } else {
        console.log(`✅ Batch uploaded successfully`);
        successCount += batch.length;
      }
      
      // Small delay between batches
      if (i + batchSize < entities.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successfully uploaded: ${successCount} entities`);
    console.log(`❌ Failed uploads: ${errorCount} entities`);
    console.log(`📈 Total processed: ${entities.length} entities`);
    
    // Verify upload by counting entities in database
    const { count, error: countError } = await supabase
      .from('entities')
      .select('*', { count: 'exact', head: true });
    
    if (!countError && count !== null) {
      console.log(`\n✅ Verification: ${count} entities now in database`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the upload
uploadEntities().then(() => {
  console.log('\n✨ Upload complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Upload failed:', error);
  process.exit(1);
});