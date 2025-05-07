import { useState, useEffect } from 'react';
import { account } from './appwrite';
import './App.css'
import Auth from './components/Auth';
import Chat from './components/Chat';

// --- Appwrite Configuration ---
// IMPORTANT: Ensure these match your Appwrite setup (appwrite.json)
const DATABASE_ID = 'database'; // Matches appwrite.json database $id
const COLLECTION_ID_MESSAGES = 'messages'; // Matches appwrite.json collection $id
// Ensure your Appwrite collection has an attribute 'text' (String) for message content.
// And appropriate permissions (e.g., 'Any' or 'Users' can Create and Read documents).
// Also, ensure YOUR_APPWRITE_ENDPOINT is set in src/appwrite.js

// Pass these IDs down to components that need them
export { DATABASE_ID, COLLECTION_ID_MESSAGES };

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for active session on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await account.get();
        setCurrentUser(user);
      } catch (error) {
        // No active session
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  if (loading) {
    return <div className="app-container">Loading...</div>; // Or a spinner
  }

  return (
    <div className="app-container">
      {currentUser ? (
        <Chat user={currentUser} onLogout={() => setCurrentUser(null)} />
      ) : (
        <Auth onLogin={() => account.get().then(setCurrentUser)} />
      )}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          aria-label="Type a message"
        />
        <button type="submit">Send</button>
      </form>
  )
}

export default App
