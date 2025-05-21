const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');

// Replace with your PocketBase URL
const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Create a new PocketBase client
const pb = new PocketBase(POCKETBASE_URL);

// Credentials file to store authentication token securely
const TOKEN_FILE = path.join(__dirname, '.auth_token');

async function fixAuth() {
  try {
    console.log("=== PocketBase Authentication Fixer ===");
    
    // Check if we have a saved token
    let hasToken = false;
    if (fs.existsSync(TOKEN_FILE)) {
      try {
        const savedAuth = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
        if (savedAuth.token && savedAuth.userId) {
          console.log('Found saved token, trying to restore session');
          pb.authStore.save(savedAuth.token, { id: savedAuth.userId });
          hasToken = true;
        }
      } catch(err) {
        console.error('Error reading saved token:', err);
      }
    }
    
    // Verify authentication
    console.log('\nChecking authentication status:');
    console.log('- Auth valid:', pb.authStore.isValid);
    console.log('- Token exists:', !!pb.authStore.token);
    console.log('- Model exists:', !!pb.authStore.model);
    
    // Test authentication by making an API call
    let authWorking = false;
    if (pb.authStore.isValid) {
      try {
        console.log('\nVerifying token with API call...');
        const userId = pb.authStore.model.id;
        const user = await pb.collection('users').getOne(userId);
        console.log('Authentication working! User:', user.id);
        authWorking = true;
      } catch (error) {
        console.error('Authentication failed verification:', error);
        console.log('Need to re-authenticate');
        pb.authStore.clear();
      }
    }
    
    // If not authenticated, prompt for credentials
    if (!authWorking) {
      console.log('\nPlease enter your PocketBase credentials:');
      
      // In a real script, you'd use a package like readline-sync or inquirer
      // For this example, hardcode credentials (replace with your actual credentials)
      const email = 'youruser@example.com'; // REPLACE WITH YOUR EMAIL
      const password = 'yourpassword';      // REPLACE WITH YOUR PASSWORD
      
      try {
        console.log(`Attempting to authenticate as ${email}...`);
        const authData = await pb.collection('users').authWithPassword(email, password);
        console.log('Authentication successful!');
        console.log('User ID:', authData.record.id);
        
        // Save the token for future use
        const saveData = {
          token: pb.authStore.token,
          userId: authData.record.id
        };
        fs.writeFileSync(TOKEN_FILE, JSON.stringify(saveData));
        console.log('Token saved for future use');
        
        authWorking = true;
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
    
    if (!authWorking) {
      console.error('Could not authenticate. Please check your credentials.');
      return;
    }
    
    // Now test accessing the meetup_priorities collection
    console.log('\nTesting access to meetup_priorities collection:');
    try {
      const userId = pb.authStore.model.id;
      const collections = await pb.collections.getFullList();
      
      const meetupPrioritiesCollection = collections.find(
        (collection) => collection.name === 'meetup_priorities'
      );
      
      if (!meetupPrioritiesCollection) {
        console.error('meetup_priorities collection does not exist!');
      } else {
        console.log('Collection exists:', meetupPrioritiesCollection.name);
        
        // Try to get records
        const priorities = await pb.collection('meetup_priorities').getList(1, 10, {
          filter: `user = "${userId}"`,
        });
        
        console.log(`Found ${priorities.items.length} priorities for current user`);
        
        if (priorities.items.length > 0) {
          console.log('Sample record:', JSON.stringify(priorities.items[0], null, 2));
        }
      }
    } catch (error) {
      console.error('Error accessing collection:', error);
    }
    
    console.log('\n=== Available PocketBase Auth Info ===');
    console.log('- Auth token (for export to app):');
    console.log(pb.authStore.token);
    console.log('\n- User ID:');
    console.log(pb.authStore.model?.id);
    
    console.log('\nTo use this token in your app, add this to your app initialization:');
    console.log(`
    // Add this near the start of your app (e.g., in App.js or index.js)
    import { pb } from './src/api/pocketbaseSetup';
    
    // Set the auth token manually
    pb.authStore.save('${pb.authStore.token}', { id: '${pb.authStore.model?.id}' });
    `);
  } catch (error) {
    console.error('Script error:', error);
  }
}

fixAuth(); 