import { useState, useEffect, useRef } from 'react';
import { client, databases, ID, Query } from '../appwrite';
import { DATABASE_ID, COLLECTION_ID_MESSAGES } from '../App'; // Import IDs from App.jsx
import OnScreenKeyboard from './OnScreenKeyboard'; // Import the new component

function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null); // Ref for the messages container
  const [newMessage, setNewMessage] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false); // State to toggle keyboard
  const inputRef = useRef(null); // Ref for the message input field

  // Fetch initial messages and set up polling
  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_MESSAGES,
          [Query.orderDesc('$createdAt'), Query.limit(50)] // Fetch latest 50
        );
        setMessages(response.documents.reverse()); // Reverse to show oldest first in UI

      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        // Scroll to bottom after initial fetch
        scrollToBottom();
      }
    };

    // Initial fetch
    getMessages();

    // Set up polling interval
    const pollingInterval = setInterval(async () => {
        console.log("Polling for new messages...");
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID_MESSAGES,
                [Query.orderDesc('$createdAt'), Query.limit(50)] // Fetch latest 50
            );
            const polledMessages = response.documents.reverse(); // Reverse to show oldest first

            setMessages(currentMessages => {
                // Create a map of existing messages by ID (including temporary ones)
                const existingMessageIds = new Set(currentMessages.map(msg => msg.$id));

                // Filter polled messages to find new ones
                const newMessages = polledMessages.filter(polledMsg => !existingMessageIds.has(polledMsg.$id));

                // Merge new messages with existing ones
                const mergedMessages = [...currentMessages, ...newMessages];

                // Sort by creation time to maintain order
                mergedMessages.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));

                return mergedMessages;
            });

            // Scrolling will be handled by the separate useEffect watching 'messages'
        } catch (error) {
            console.error("Failed to poll for messages:", error);
        }
    }, 5000); // Poll every 5 seconds

    // Cleanup function to clear the interval
    return () => clearInterval(pollingInterval);

  }, []);

  // Effect to scroll to the bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to scroll the messages container to the bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };
  // Note: The subscription useEffect has been removed and replaced by polling.
  // The optimistic update logic in handleSendMessage remains, ensuring immediate feedback.
  // The polling mechanism will fetch messages from other users and eventually confirm
  // the current user's messages if the optimistic update succeeds.

  const handleKeyPressFromKeyboard = (key) => {
    setNewMessage((prev) => prev + key);
    if (inputRef.current) {
      inputRef.current.focus();
      // Set cursor to the end of the input
      const end = inputRef.current.value.length;
      inputRef.current.setSelectionRange(end, end);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`; // Create a unique temporary ID
    const messageText = newMessage;

    // Optimistically add the message to the state
    const tempMessage = {
      $id: tempId, // Use temporary ID for key
      text: messageText,
      $createdAt: new Date().toISOString(), // Use current time as placeholder
      $permissions: [`update("user:${user.$id}")`], // Assume current user is owner for display
      isPending: true, // Flag to indicate it's a pending message
    };

    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    setNewMessage(''); // Clear input immediately

    try {
      // Create document with user ID, user name, and permissions
      const realMessage = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_MESSAGES,
        ID.unique(),
        { text: messageText },
        // Set document permissions: read for any, update for the owner
        // The `update("user:${user.$id}")` permission implicitly links the message to the user.
        [`read("any")`, `update("user:${user.$id}")`]
      );
      // Replace the temporary message with the real one from Appwrite
      setMessages((prevMessages) => prevMessages.map(msg => msg.$id === tempId ? realMessage : msg));
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove the temporary message on failure
      setMessages((prevMessages) => prevMessages.filter(msg => msg.$id !== tempId));
    }
  };

  return (
    <>
      <h1>Draconic Chatroom</h1>
      <button onClick={onLogout} style={{ position: 'absolute', top: '1em', right: '1em' }}>Logout</button> {/* Basic logout button */}
      <div className="messages-container" ref={messagesEndRef}> {/* Attach ref here */}
        {messages.map((message) => {
          let ownerDisplay = message.isPending ? (user.name || user.email || "You") : "Unknown Owner"; // Display current user for pending messages
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
              <p className="message-owner">{ownerDisplay}{message.isPending ? ' (sending...)' : ''}:</p> {/* Add pending indicator */}
              <p>{message.text}</p>
              <small className="message-timestamp">{new Date(message.$createdAt).toLocaleTimeString()}</small>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          ref={inputRef} // Assign ref to the input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          aria-label="Type a message"
        />
        <button type="submit">Send</button>
      </form>
      <button onClick={() => setShowKeyboard(!showKeyboard)} className="toggle-keyboard-button">
        {showKeyboard ? 'Hide' : 'Show'} Keyboard
      </button>
      {showKeyboard && <OnScreenKeyboard onKeyPress={handleKeyPressFromKeyboard} />}
    </>
  );
}

export default Chat;
