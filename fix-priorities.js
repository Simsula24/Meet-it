// Script to fix priority issues in the database
const PocketBase = require('pocketbase/cjs');

// Replace with your PocketBase URL
const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Create a new PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

// Simple login function
const login = async (email, password) => {
  try {
    console.log(`Trying to login with ${email}...`);
    const authData = await pb.admins.authWithPassword(email, password);
    console.log('Admin login successful');
    return true;
  } catch (error) {
    console.error('Admin login failed:', error);
    console.log('Trying user login instead...');
    
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      console.log('User login successful');
      return true;
    } catch (userError) {
      console.error('User login failed:', userError);
      return false;
    }
  }
};

async function fixPriorities() {
  try {
    console.log("=== PocketBase Collection Fixer ===");
    
    // You'll need to enter valid credentials when running the script
    const email = 'admin@example.com';    // Replace with your email
    const password = 'yourpassword';      // Replace with your password
    
    // Try to authenticate
    const isAuthenticated = await login(email, password);
    if (!isAuthenticated) {
      console.error('Cannot proceed without authentication');
      return;
    }
    
    // Check if the collection exists
    console.log('Checking if meetup_priorities collection exists...');
    let collections;
    try {
      collections = await pb.collections.getFullList();
    } catch (error) {
      console.error('Failed to get collections:', error);
      return;
    }
    
    const meetupPrioritiesCollection = collections.find(
      (collection) => collection.name === 'meetup_priorities'
    );
    
    if (!meetupPrioritiesCollection) {
      console.log('meetup_priorities collection does not exist, creating it...');
      
      try {
        const newCollection = await pb.collections.create({
          name: 'meetup_priorities',
          type: 'base',
          schema: [
            {
              name: 'user',
              type: 'relation',
              required: true,
              options: {
                collectionId: 'users',
                cascadeDelete: true,
              }
            },
            {
              name: 'event',
              type: 'relation',
              required: true,
              options: {
                collectionId: 'events',
                cascadeDelete: true,
              }
            },
            {
              name: 'priority',
              type: 'select',
              required: true,
              options: {
                values: ['high', 'medium', 'low', 'none']
              }
            },
            {
              name: 'order',
              type: 'number',
              required: false,
            }
          ]
        });
        
        console.log('Collection created successfully:', newCollection);
        
        // Creating an index for uniqueness
        console.log('Creating unique index for user-event combination...');
        await pb.collections.createIndex('meetup_priorities', {
          name: 'unique_user_event',
          type: 'unique',
          options: {
            fields: ['user', 'event']
          }
        });
        
        console.log('Index created successfully!');
      } catch (error) {
        console.error('Failed to create collection:', error);
      }
    } else {
      console.log('Collection already exists:', meetupPrioritiesCollection);
      
      // Verify fields and update if needed
      console.log('Checking collection schema...');
      const schema = meetupPrioritiesCollection.schema;
      
      console.log('Current schema:', JSON.stringify(schema, null, 2));
      
      // Check for priority field
      const priorityField = schema.find(field => field.name === 'priority');
      if (!priorityField) {
        console.error('Priority field missing!');
      } else if (priorityField.type !== 'select') {
        console.error(`Priority field has wrong type: ${priorityField.type}, should be 'select'`);
      } else {
        console.log('Priority field looks good');
      }
      
      // Check for user and event fields
      const userField = schema.find(field => field.name === 'user');
      const eventField = schema.find(field => field.name === 'event');
      
      if (!userField || !eventField) {
        console.error('Missing required fields:', !userField ? 'user' : 'event');
      } else {
        console.log('User and event fields exist');
      }
    }
    
    // Test creating a record
    console.log('\nTesting record creation:');
    try {
      // Get a random user and event for testing
      const users = await pb.collection('users').getList(1, 1);
      const events = await pb.collection('events').getList(1, 1);
      
      if (users.items.length === 0 || events.items.length === 0) {
        console.log('No users or events found for testing');
        return;
      }
      
      const userId = users.items[0].id;
      const eventId = events.items[0].id;
      
      console.log(`Testing with user=${userId}, event=${eventId}`);
      
      // Try to create or update a priority
      const existingRecords = await pb.collection('meetup_priorities').getList(1, 1, {
        filter: `user = "${userId}" && event = "${eventId}"`,
      });
      
      let result;
      const testPriority = 'high';
      
      if (existingRecords.items.length > 0) {
        const existingId = existingRecords.items[0].id;
        console.log(`Updating existing priority record ${existingId}`);
        result = await pb.collection('meetup_priorities').update(existingId, {
          priority: testPriority
        });
      } else {
        console.log('Creating new priority record');
        result = await pb.collection('meetup_priorities').create({
          user: userId,
          event: eventId,
          priority: testPriority
        });
      }
      
      console.log('Operation successful:', result);
      
      // Verify we can read it back
      const updatedRecord = await pb.collection('meetup_priorities').getOne(result.id);
      console.log('Priority record retrieved:', updatedRecord);
      
    } catch (error) {
      console.error('Error testing record creation:', error);
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

fixPriorities(); 