const PocketBase = require('pocketbase/cjs');
const readline = require('readline');

// Replace with your PocketBase URL
const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Create a new PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt function
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

async function setPriority() {
  try {
    console.log("=== Direct Priority Setting Tool ===");
    
    // Get credentials
    const email = await prompt("Enter your email: ");
    const password = await prompt("Enter your password: ");
    
    // Authenticate
    try {
      console.log(`Attempting to authenticate as ${email}...`);
      const authData = await pb.collection('users').authWithPassword(email, password);
      console.log('Authentication successful!');
      console.log('User ID:', authData.record.id);
    } catch (error) {
      console.error('Login failed:', error);
      rl.close();
      return;
    }
    
    // Get event ID
    const eventId = await prompt("Enter the event ID: ");
    
    // Get priority
    const priority = await prompt("Enter priority (high, medium, low, none): ");
    
    if (!['high', 'medium', 'low', 'none'].includes(priority)) {
      console.error('Invalid priority value. Must be high, medium, low, or none.');
      rl.close();
      return;
    }
    
    // Get user ID from auth
    const userId = pb.authStore.model.id;
    
    console.log(`Setting priority=${priority} for user=${userId}, event=${eventId}`);
    
    // Check if record exists
    const existingRecords = await pb.collection('meetup_priorities').getList(1, 1, {
      filter: `user = "${userId}" && event = "${eventId}"`,
    });
    
    let result;
    if (existingRecords.items.length > 0) {
      const existingId = existingRecords.items[0].id;
      console.log(`Updating existing priority record ${existingId}`);
      result = await pb.collection('meetup_priorities').update(existingId, {
        priority
      });
    } else {
      console.log('Creating new priority record');
      result = await pb.collection('meetup_priorities').create({
        user: userId,
        event: eventId,
        priority
      });
    }
    
    console.log('Operation successful!');
    console.log('Result:', result);
    
    // Verify by retrieving the record
    console.log('\nVerifying by retrieving the record...');
    const verifyRecord = await pb.collection('meetup_priorities').getList(1, 1, {
      filter: `user = "${userId}" && event = "${eventId}"`,
    });
    
    if (verifyRecord.items.length > 0) {
      console.log('Retrieved record:', verifyRecord.items[0]);
      console.log(`Stored priority: ${verifyRecord.items[0].priority}`);
      
      if (verifyRecord.items[0].priority === priority) {
        console.log('✅ Priority set successfully!');
      } else {
        console.log('❌ Priority mismatch!');
        console.log(`Expected: ${priority}, Got: ${verifyRecord.items[0].priority}`);
      }
    } else {
      console.error('❌ Could not retrieve the record after saving!');
    }
    
    rl.close();
  } catch (error) {
    console.error('Error:', error);
    rl.close();
  }
}

setPriority(); 