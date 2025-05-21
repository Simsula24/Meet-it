// A script to directly set a priority for a specific user and event
const PocketBase = require('pocketbase/cjs');

// Replace with your PocketBase URL
const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node set-priority.js <userId> <eventId> <priority>');
  console.error('Where priority is one of: high, medium, low, none');
  process.exit(1);
}

const userId = args[0];
const eventId = args[1];
const priority = args[2];

// Validate priority
const validPriorities = ['high', 'medium', 'low', 'none'];
if (!validPriorities.includes(priority)) {
  console.error(`Invalid priority: ${priority}. Must be one of: high, medium, low, none`);
  process.exit(1);
}

// Create a new PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

async function setPriority() {
  try {
    // First check if the meetup_priorities collection exists
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
    
    console.log(`Setting priority='${priority}' for user=${userId} and event=${eventId}`);
    
    // Check if a record already exists
    const existingRecords = await pb.collection('meetup_priorities').getList(1, 1, {
      filter: `user = "${userId}" && event = "${eventId}"`,
    });
    
    if (existingRecords.items.length > 0) {
      const existingId = existingRecords.items[0].id;
      console.log(`Updating existing record with ID ${existingId}`);
      
      // Update the priority
      const result = await pb.collection('meetup_priorities').update(existingId, {
        priority: priority
      });
      
      console.log('Update successful:');
      console.log(`- ID: ${result.id}`);
      console.log(`- User: ${result.user}`);
      console.log(`- Event: ${result.event}`);
      console.log(`- Priority: ${result.priority}`);
      console.log(`- Order: ${result.order || 'not set'}`);
    } else {
      console.log('Creating new record');
      
      // Create a new record
      const result = await pb.collection('meetup_priorities').create({
        user: userId,
        event: eventId,
        priority: priority
      });
      
      console.log('Create successful:');
      console.log(`- ID: ${result.id}`);
      console.log(`- User: ${result.user}`);
      console.log(`- Event: ${result.event}`);
      console.log(`- Priority: ${result.priority}`);
    }
  } catch (error) {
    console.error('Error setting priority:', error);
  }
}

setPriority(); 