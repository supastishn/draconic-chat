import { useState, useEffect, useRef } from 'react'; // Add useRef
import { account } from './appwrite';
import './App.css'
import Auth from './components/Auth';
import Chat from './components/Chat';
import OnScreenKeyboard from './components/OnScreenKeyboard'; // Import OnScreenKeyboard

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
  const [newMessage, setNewMessage] = useState(''); // Lifted state
  const chatInputRef = useRef(null); // Lifted ref

  // Function to handle key presses from the on-screen keyboard
  const handleKeyPressFromKeyboard = (key) => {
    setNewMessage((prevMessageValue) => prevMessageValue + key);

    if (chatInputRef.current) {
      chatInputRef.current.focus();
      // Defer setting selection range to allow React to update input value
      setTimeout(() => {
        if (chatInputRef.current) {
          const newLength = chatInputRef.current.value.length;
          chatInputRef.current.setSelectionRange(newLength, newLength);
        }
      }, 0);
    }
  };

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
    <div className="page-layout"> {/* New wrapper for page structure */}
      <div className="app-container">
        {currentUser ? (
          <Chat
            user={currentUser}
            onLogout={async () => {
              try {
                await account.deleteSession('current');
                console.log('Session deleted');
              } catch (error) {
                console.error('Failed to delete session:', error);
              }
              setCurrentUser(null);
              setNewMessage(''); // Clear message input on logout
            }}
            newMessage={newMessage} // Pass state down
            setNewMessage={setNewMessage} // Pass setter down
            chatInputRef={chatInputRef} // Pass ref down
          />
        ) : (
          <Auth onLogin={() => account.get().then(setCurrentUser)} />
        )}
      </div>
      {currentUser && (
        <OnScreenKeyboard onKeyPress={handleKeyPressFromKeyboard} />
      )}
      <footer className="attribution-footer">
        <p>Draconic Language is made by human1011</p>
        <p>Draconic Font is made by _executie on Discord</p>
      </footer>
    </div>
  )
}

export default App
