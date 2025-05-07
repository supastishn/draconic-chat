import { useState, useEffect } from 'react';
import { client, databases, ID, Query } from '../appwrite';
import { DATABASE_ID, COLLECTION_ID_MESSAGES } from '../App'; // Import IDs from App.jsx

function Chat({ user, onLogout }) {
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
    getMessages();
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    // Realtime subscription path uses the actual IDs
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID_MESSAGES}.documents`,
      (response) => {
        // Only add if it's a create event and the document doesn't already exist (to avoid duplicates from initial fetch)
        if (response.events.includes('databases.*.collections.*.documents.*.create') &&
            !messages.some(msg => msg.$id === response.payload.$id)) {
          setMessages((prevMessages) => [...prevMessages, response.payload]);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [messages]); // Add messages as dependency to check for duplicates

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Create document with user ID, user name, and permissions
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_MESSAGES,
        ID.unique(),
        { text: newMessage },
        // Set document permissions: read for any, update for the owner
        // The `update("user:${user.$id}")` permission implicitly links the message to the user.
        [`read("any")`, `update("user:${user.$id}")`]
      );
      setNewMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <>
      <h1>Draconic Chatroom</h1>
      <button onClick={onLogout} style={{ position: 'absolute', top: '1em', right: '1em' }}>Logout</button> {/* Basic logout button */}
      <div className="messages-container">
        {messages.map((message) => {
          let ownerDisplay = "Unknown Owner";
          // Find the update permission to identify the owner
          const updatePermission = message.$permissions.find(p => p.startsWith('update("user:'));
          if (updatePermission) {
            const ownerId = updatePermission.substring('update("user:'.length, updatePermission.length - 2);
            if (ownerId === user.$id) {
              ownerDisplay = user.name || user.email || "You"; // Current user's display name
            } else {
              ownerDisplay = `User ID: ${ownerId}`; // Display other users' IDs
            }
          }
          return (
            <div key={message.$id} className="message">
              <p className="message-owner">{ownerDisplay}:</p>
              <p>{message.text}</p>
              <small className="message-timestamp">{new Date(message.$createdAt).toLocaleTimeString()}</small>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        {/* Input and button are already in App.jsx, move them here */}
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." aria-label="Type a message" />
        <button type="submit">Send</button>
      </form>
    </>
  );
}

export default Chat;
