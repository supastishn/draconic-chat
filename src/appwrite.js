import { Client, Databases, Account, ID, Query } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Replace with your Appwrite server endpoint
    .setProject('draconic-chatroom');     // Project ID from your appwrite.json or Appwrite console

const databases = new Databases(client);
const account = new Account(client);

// Export Realtime separately if you need to instantiate it with the client elsewhere,
// or handle subscriptions directly via client.subscribe
export { client, databases, account, ID, Query };
