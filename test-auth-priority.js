const PocketBase = require('pocketbase/cjs');
const { exit } = require('process');

// Replace with your PocketBase URL
const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Create a new PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

async function checkAuthAndPriority() {
  try {
    // 1. Check authentication state
    console.log('Current auth state:', 
      pb.authStore.isValid ? 'Valid' : 'Invalid',
      'Token:', pb.authStore.token ? 'Present' : 'Missing',
      'Model:', pb.authStore.model ? 'Present' : 'Missing'
    );

    // 2. Try to authenticate if needed - replace with valid credentials
    if (!pb.authStore.isValid) {
      console.log('Not authenticated, trying to log in...');
      try {
        // Replace these with valid credentials
        const authData = await pb.collection('users').authWithPassword('user@example.com', 'password');
        console.log('Successfully authenticated as:', authData.record.name);
      } catch (authError) {
        console.error('Authentication failed:', authError);
        console.log('Cannot proceed without authentication.');
        return;
      }
    }

    // 3. Check if meetup_priorities collection exists
    try {
      const collections = await pb.collections.getFullList();
      const meetupPrioritiesCollection = collections.find(
        (collection) => collection.name === 'meetup_priorities'
      );
      
      if (!meetupPrioritiesCollection) {
        console.error('meetup_priorities collection does not exist!');
        console.log('Please create the collection in the PocketBase admin UI.');
        return;
      }
      
      console.log('meetup_priorities collection exists!');
      console.log('Collection schema:', JSON.stringify(meetupPrioritiesCollection.schema, null, 2));
    } catch (error) {
      console.error('Error checking collection:', error);
      return;
    }

    // 4. Try to set a priority for a test event
    const userId = pb.authStore.model.id;
    const testEventId = 'YOUR_TEST_EVENT_ID'; // Replace with actual event ID
    const testPriority = 'high';

    console.log(`Setting priority=${testPriority} for user=${userId}, event=${testEventId}`);
    
    try {
      // Check if a priority record already exists
      const existingRecords = await pb.collection('meetup_priorities').getList(1, 1, {
        filter: `user = "${userId}" && event = "${testEventId}"`,
      });

      const data = {
        user: userId,    
        event: testEventId,  
        priority: testPriority
      };
      
      console.log('Saving priority data:', data);

      let result;
      // Update existing or create new
      if (existingRecords.items.length > 0) {
        const existingId = existingRecords.items[0].id;
        console.log(`Updating existing priority record ${existingId}`);
        result = await pb.collection('meetup_priorities').update(existingId, data);
      } else {
        console.log('Creating new priority record');
        result = await pb.collection('meetup_priorities').create(data);
      }
      
      console.log('Operation successful:', result);
    } catch (error) {
      console.error('Error setting priority:', error);
    }

    // 5. Try to fetch priorities
    try {
      const priorities = await pb.collection('meetup_priorities').getList(1, 10, {
        filter: `user = "${userId}"`,
      });
      
      console.log(`Found ${priorities.items.length} priority records.`);
      
      if (priorities.items.length > 0) {
        console.log('Sample priority record:', JSON.stringify(priorities.items[0], null, 2));
      }
    } catch (error) {
      console.error('Error fetching priorities:', error);
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkAuthAndPriority(); 