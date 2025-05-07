import { Client, Databases, ID, Query, Realtime } from 'appwrite';

const client = new Client();

client
    .setEndpoint('YOUR_APPWRITE_ENDPOINT') // Replace with your Appwrite server endpoint
    .setProject('draconic-chatroom');     // Project ID from your appwrite.json or Appwrite console

const databases = new Databases(client);

// Export Realtime separately if you need to instantiate it with the client elsewhere,
// or handle subscriptions directly via client.subscribe
export { client, databases, ID, Query, Realtime };
