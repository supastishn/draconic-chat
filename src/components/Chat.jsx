import { useState, useEffect, useRef } from 'react';
import { client, databases, ID, Query } from '../appwrite';
import { DATABASE_ID, COLLECTION_ID_MESSAGES, COLLECTION_ID_ACCOUNTS } from '../App'; // Import IDs from App.jsx
// OnScreenKeyboard is now imported and used in App.jsx

function Chat({ user, onLogout, newMessage, setNewMessage, chatInputRef }) { // Receive new props
  const [messages, setMessages] = useState([]);
  const [userProfiles, setUserProfiles] = useState({}); // To store userID: username map
  const messagesEndRef = useRef(null); // Ref for the messages container
  // newMessage and setNewMessage are now props
  // inputRef is now chatInputRef (prop)

  // Helper to extract owner ID from permissions
  const getOwnerIdFromPermissions = (permissionsArray) => {
    if (!permissionsArray) return null;
    const updatePermission = permissionsArray.find(p => p.startsWith('update("user:'));
    if (updatePermission) {
      return updatePermission.substring('update("user:'.length, updatePermission.length - 2);
    }
    return null;
  };

  // Function to fetch user profiles if not already fetched
  const fetchUserProfiles = async (userIds) => {
    const idsToFetch = userIds.filter(id => id && id !== user.$id && !userProfiles[id]);
    if (idsToFetch.length === 0) return;

    // Mark as fetching to avoid multiple requests for the same ID
    setUserProfiles(prevProfiles => {
      const newProfiles = { ...prevProfiles };
      idsToFetch.forEach(id => {
        if (!newProfiles[id]) newProfiles[id] = 'loading...'; // Initial loading state
      });
      return newProfiles;
    });

    try {
      const uniqueIdsToFetch = [...new Set(idsToFetch)]; // Ensure unique IDs
      const promises = uniqueIdsToFetch.map(id =>
        databases.getDocument(DATABASE_ID, COLLECTION_ID_ACCOUNTS, id)
      );
      const results = await Promise.allSettled(promises);
      
      setUserProfiles(prevProfiles => {
        const newProfiles = { ...prevProfiles };
        results.forEach((result, index) => {
          const id = uniqueIdsToFetch[index];
          if (result.status === 'fulfilled' && result.value && result.value.username) {
            newProfiles[id] = result.value.username;
          } else {
            console.error(`Failed to fetch profile for user ${id}:`, result.reason || 'No username found');
            newProfiles[id] = `User ID: ${id.substring(0, 8)}...`; // Fallback
          }
        });
        return newProfiles;
      });
    } catch (error) {
      console.error("Error fetching user profiles batch:", error);
      // Reset loading state for errored fetches if desired, or keep fallback
      setUserProfiles(prevProfiles => {
        const newProfiles = { ...prevProfiles };
        idsToFetch.forEach(id => {
          if (newProfiles[id] === 'loading...') { // if still in loading state from this batch
            newProfiles[id] = `User ID: ${id.substring(0, 8)}...`; // Fallback
          }
        });
        return newProfiles;
      });
    }
  };


  // Fetch initial messages and set up polling
  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID_MESSAGES,
          [Query.orderDesc('$createdAt'), Query.limit(50)] // Fetch latest 50
        );
        const initialMessages = response.documents.reverse();
        setMessages(initialMessages); // Reverse to show oldest first in UI

        const ownerIdsToFetch = new Set();
        initialMessages.forEach(msg => {
          const ownerId = getOwnerIdFromPermissions(msg.$permissions);
          if (ownerId) ownerIdsToFetch.add(ownerId);
        });
        if (ownerIdsToFetch.size > 0) {
          fetchUserProfiles(Array.from(ownerIdsToFetch));
        }

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
        // console.log("Polling for new messages..."); // Optional: reduce console noise
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID_MESSAGES,
                [Query.orderDesc('$createdAt'), Query.limit(50)] // Fetch latest 50
            );
            const polledMessages = response.documents.reverse(); // Reverse to show oldest first

            let newMessagesFound = false;
            const ownerIdsFromPoll = new Set();

            setMessages(currentMessages => {
                const existingMessageIds = new Set(currentMessages.map(msg => msg.$id));
                const newIncomingMessages = polledMessages.filter(polledMsg => !existingMessageIds.has(polledMsg.$id));

                if (newIncomingMessages.length > 0) {
                    newMessagesFound = true;
                    newIncomingMessages.forEach(msg => {
                      const ownerId = getOwnerIdFromPermissions(msg.$permissions);
                      if (ownerId) ownerIdsFromPoll.add(ownerId);
                    });

                    const mergedMessages = [...currentMessages, ...newIncomingMessages];
                    mergedMessages.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
                    return mergedMessages;
                }
                return currentMessages; // No change
            });

            if (newMessagesFound && ownerIdsFromPoll.size > 0) {
                fetchUserProfiles(Array.from(ownerIdsFromPoll));
            }

        } catch (error) {
            console.error("Failed to poll for messages:", error);
        }
    }, 5000); // Poll every 5 seconds

    // Cleanup function to clear the interval
    return () => clearInterval(pollingInterval);

  }, [user.$id]); // Add user.$id as a dependency if fetchUserProfiles or other logic inside uses `user` directly

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

  // handleKeyPressFromKeyboard is now in App.jsx

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
      <button onClick={onLogout} className="logout-button">Logout</button>
      <div className="messages-container" ref={messagesEndRef}> {/* Attach ref here */}
        {messages.map((message) => {
          let ownerDisplay = "Unknown User";
          const ownerId = getOwnerIdFromPermissions(message.$permissions);

          if (message.isPending) { // Optimistically added message by current user
            ownerDisplay = user.name || user.email || "You";
          } else if (ownerId) {
            if (ownerId === user.$id) {
              ownerDisplay = user.name || user.email || "You";
            } else {
              ownerDisplay = userProfiles[ownerId] || `User ID: ${ownerId.substring(0, 8)}...`;
              if (userProfiles[ownerId] === 'loading...') {
                ownerDisplay = 'Loading user...';
              }
            }
          }
          
          return (
            <div key={message.$id} className="message">
              <p className="message-owner">{ownerDisplay}{message.isPending ? ' (sending...)' : ''}:</p>
              <p>{message.text}</p>
              <small className="message-timestamp">{new Date(message.$createdAt).toLocaleTimeString()}</small>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          ref={chatInputRef} // Use the passed ref
          type="text"
          value={newMessage} // Use passed state
          onChange={(e) => setNewMessage(e.target.value)} // Use passed setter
          placeholder="Type a message..."
          aria-label="Type a message"
        />
        <button type="submit">Send</button>
      </form>
      {/* OnScreenKeyboard is now rendered in App.jsx */}
    </>
  );
}

export default Chat;
