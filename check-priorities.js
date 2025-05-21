// Script to check the actual format of priority values in database
const PocketBase = require('pocketbase/cjs');

// Replace with your PocketBase URL
const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Create a new PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

async function checkPriorities() {
  try {
    console.log('Checking meetup_priorities collection...');
    
    // First check if the collection exists
    try {
      // Get all records from meetup_priorities collection
      console.log('Fetching all priority records...');
      const records = await pb.collection('meetup_priorities').getFullList();
      console.log(`Found ${records.length} priority records.`);

      console.log('\nDetailed priority analysis:');
      for (const record of records) {
        console.log(`\nRecord ID: ${record.id}`);
        const priority = record.priority;
        
        console.log(`-> Field value: '${priority}'`);
        console.log(`-> Type: ${typeof priority}`);
        console.log(`-> JSON.stringify: '${JSON.stringify(priority)}'`);
        
        // Check if value is a string and in lowercase
        if (typeof priority === 'string') {
          console.log(`-> Is lowercase: ${priority === priority.toLowerCase()}`);
          console.log(`-> Lowercase value: '${priority.toLowerCase()}'`);
        }
        
        // List all record fields to see if there might be other issues
        console.log('-> All fields:');
        Object.entries(record).forEach(([key, value]) => {
          console.log(`   ${key}: ${typeof value} - ${JSON.stringify(value)}`);
        });
      }
    } catch (error) {
      console.error('Error accessing meetup_priorities:', error);
    }
    
    // Check the schema definition of the collection
    try {
      console.log('\nChecking collection schema...');
      const collection = await pb.collections.getOne('meetup_priorities');
      
      console.log('Collection schema:');
      console.log(JSON.stringify(collection, null, 2));
      
      // Find the priority field schema
      const priorityField = collection.schema.find(field => field.name === 'priority');
      if (priorityField) {
        console.log('\nPriority field schema:');
        console.log(JSON.stringify(priorityField, null, 2));
      } else {
        console.log('\nPriority field not found in schema!');
      }
    } catch (error) {
      console.error('Error checking collection schema:', error);
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkPriorities(); 