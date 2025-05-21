// A simple test script to verify the meetup_priorities collection works
const PocketBase = require('pocketbase/cjs');

// Replace with your PocketBase URL
const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Create a new PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

// Replace these with your actual credentials
const EMAIL = 'admin@example.com'; // Replace with your admin email
const PASSWORD = 'your-password';  // Replace with your admin password

// Replace these with actual user and event IDs from your database
const USER_ID = 'replace_with_user_id';
const EVENT_ID = 'replace_with_event_id';

async function runTest() {
  try {
    // First try to auth as admin to get full access
    console.log('Authenticating...');
    await pb.admins.authWithPassword(EMAIL, PASSWORD);
    console.log('Authentication successful!');
  } catch (error) {
    console.error('Authentication failed:', error);
    console.log('Continuing without admin auth...');
  }

  try {
    // Check if the collection exists
    console.log('Checking if meetup_priorities collection exists...');
    const collections = await pb.collections.getFullList();
    const meetupPrioritiesCollection = collections.find(
      (collection) => collection.name === 'meetup_priorities'
    );

    if (!meetupPrioritiesCollection) {
      console.error('meetup_priorities collection does not exist!');
      process.exit(1);
    }

    console.log('meetup_priorities collection exists!');
    
    // Try to create a test record
    console.log(`Setting a test priority (high) for user=${USER_ID} and event=${EVENT_ID}`);
    const data = {
      user: USER_ID,
      event: EVENT_ID,
      priority: 'high',
      order: 1
    };
    
    // Check if a record already exists
    const existingRecords = await pb.collection('meetup_priorities').getList(1, 1, {
      filter: `user = "${USER_ID}" && event = "${EVENT_ID}"`,
    });
    
    let result;
    if (existingRecords.items.length > 0) {
      const existingId = existingRecords.items[0].id;
      console.log(`Updating existing record with ID ${existingId}`);
      result = await pb.collection('meetup_priorities').update(existingId, data);
    } else {
      console.log('Creating new record');
      result = await pb.collection('meetup_priorities').create(data);
    }
    
    console.log('Operation successful:', result);
    
    // Now test retrieval
    console.log('Testing retrieval...');
    const records = await pb.collection('meetup_priorities').getList(1, 10, {
      filter: `user = "${USER_ID}"`,
    });
    
    console.log(`Found ${records.totalItems} records:`);
    records.items.forEach(record => {
      console.log(`- ID: ${record.id}, User: ${record.user}, Event: ${record.event}, Priority: ${record.priority}`);
    });
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest(); 