const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');

// Replace with your PocketBase URL
const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Create a new PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

// Authentication file
const TOKEN_FILE = path.join(__dirname, '.auth_token');

// Priorities to test
const PRIORITIES = ['high', 'medium', 'low', 'none'];

// Direct test of setting and getting priorities
async function testPriorities() {
  try {
    console.log("=== PocketBase Priority Test ===");
    
    // Load token if exists
    let isAuthenticated = false;
    if (fs.existsSync(TOKEN_FILE)) {
      try {
        const savedAuth = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
        if (savedAuth.token && savedAuth.userId) {
          console.log('Found saved token, trying to restore session');
          pb.authStore.save(savedAuth.token, { id: savedAuth.userId });
          isAuthenticated = pb.authStore.isValid;
        }
      } catch(err) {
        console.error('Error reading saved token:', err);
      }
    }
    
    // If not authenticated, prompt for login
    if (!isAuthenticated) {
      console.log('\nPlease enter your PocketBase credentials:');
      
      // Replace with your actual credentials
      const email = 'youruser@example.com';
      const password = 'yourpassword';
      
      try {
        console.log(`Attempting to authenticate as ${email}...`);
        const authData = await pb.collection('users').authWithPassword(email, password);
        console.log('Authentication successful!');
        
        // Save token for future use
        const saveData = {
          token: pb.authStore.token,
          userId: authData.record.id
        };
        fs.writeFileSync(TOKEN_FILE, JSON.stringify(saveData));
        
        isAuthenticated = true;
      } catch (error) {
        console.error('Login failed:', error);
        return;
      }
    }
    
    // Verify we have authentication
    if (!isAuthenticated) {
      console.error('Not authenticated. Cannot proceed with testing.');
      return;
    }
    
    // Get user ID
    const userId = pb.authStore.model.id;
    console.log(`Testing with user ID: ${userId}`);
    
    // Get a test event ID
    console.log('\nFetching a test event...');
    
    let testEventId;
    try {
      const events = await pb.collection('events').getList(1, 1);
      
      if (events.items.length === 0) {
        console.error('No events found to test with.');
        return;
      }
      
      testEventId = events.items[0].id;
      console.log(`Using event ID: ${testEventId}`);
    } catch (error) {
      console.error('Error fetching test event:', error);
      return;
    }
    
    // Now test each priority level
    console.log('\nTesting all priority levels:');
    
    for (const priority of PRIORITIES) {
      console.log(`\n----- Testing priority: ${priority} -----`);
      
      try {
        // STEP 1: Save the priority
        console.log(`Setting priority to ${priority}...`);
        
        // Check if a priority record already exists
        const existingRecords = await pb.collection('meetup_priorities').getList(1, 1, {
          filter: `user = "${userId}" && event = "${testEventId}"`,
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
            event: testEventId,
            priority
          });
        }
        
        console.log('Save successful. Record:', result);
        
        // STEP 2: Get the priority back
        console.log(`\nRetrieving priority for event ${testEventId}...`);
        const fetchedRecords = await pb.collection('meetup_priorities').getList(1, 1, {
          filter: `user = "${userId}" && event = "${testEventId}"`,
        });
        
        if (fetchedRecords.items.length > 0) {
          const fetchedRecord = fetchedRecords.items[0];
          console.log('Fetched priority record:', fetchedRecord);
          console.log(`Fetched priority value: ${fetchedRecord.priority}`);
          
          // Verify it matches what we set
          if (fetchedRecord.priority === priority) {
            console.log('✅ TEST PASSED: Priority value matches what was set');
          } else {
            console.log('❌ TEST FAILED: Priority value does not match what was set');
            console.log(`Expected: ${priority}, Got: ${fetchedRecord.priority}`);
          }
        } else {
          console.error('❌ TEST FAILED: Could not retrieve priority record after saving');
        }
      } catch (error) {
        console.error(`Error testing priority ${priority}:`, error);
      }
    }
    
    console.log('\nAll priority tests completed.');
  } catch (error) {
    console.error('Script error:', error);
  }
}

testPriorities(); 