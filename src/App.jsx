import { useState, useEffect } from 'react';
import { client, databases, ID, Query } from './appwrite';
import './App.css'

// --- Appwrite Configuration ---
// IMPORTANT: Replace these with your actual Database ID and Collection ID from Appwrite!
const DATABASE_ID = 'YOUR_DATABASE_ID';
const COLLECTION_ID_MESSAGES = 'YOUR_COLLECTION_ID_MESSAGES';
// Ensure your Appwrite collection has an attribute 'text' (String) for message content.
// And appropriate permissions (e.g., 'Any' or 'Users' can Create and Read documents).
// Also, ensure YOUR_APPWRITE_ENDPOINT is set in src/appwrite.js

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch initial messages
  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_MESSAGES,
          [Query.orderDesc('$createdAt'), Query.limit(50)] // Fetch latest 50, newest first
        );
        setMessages(response.documents.reverse()); // Reverse to show oldest first in UI
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
    if (DATABASE_ID !== 'YOUR_DATABASE_ID' && COLLECTION_ID_MESSAGES !== 'YOUR_COLLECTION_ID_MESSAGES') {
      getMessages();
    }
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    if (DATABASE_ID === 'YOUR_DATABASE_ID' || COLLECTION_ID_MESSAGES === 'YOUR_COLLECTION_ID_MESSAGES') {
      console.warn("Appwrite Database/Collection IDs not set. Realtime subscription disabled.");
      return;
    }

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID_MESSAGES}.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setMessages((prevMessages) => [...prevMessages, response.payload]);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_MESSAGES,
        ID.unique(),
        { text: newMessage } // Ensure 'text' attribute exists in your collection
      );
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="app-container">
      <h1>Draconic Chatroom</h1>
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.$id} className="message">
            <p>{message.text}</p>
            <small className="message-timestamp">{new Date(message.$createdAt).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          aria-label="Type a message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

export default App
