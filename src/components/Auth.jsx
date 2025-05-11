import { useState } from 'react';
import { account, databases, ID } from '../appwrite'; // Import databases and ID
import { DATABASE_ID, COLLECTION_ID_ACCOUNTS } from '../App'; // Import Appwrite constants

function Auth({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        // Register user
        const userAuth = await account.create(ID.unique(), email, password, name);
        // After successful registration, automatically log them in
        await account.createEmailPasswordSession(email, password);
        console.log('Registration successful, user created, logged in.');

        // Create user profile in 'accounts' collection
        try {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID_ACCOUNTS,
            userAuth.$id, // Use the new user's ID as the document ID
            { username: name },
            [
              `read("any")`, // Anyone can read the profile
              `update("user:${userAuth.$id}")`, // Only the user can update
              `delete("user:${userAuth.$id}")`  // Only the user can delete
            ]
          );
          console.log('User profile created in accounts collection.');
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError);
          // Optionally, handle profile creation failure (e.g., inform user, attempt cleanup)
        }
      } else {
        // Login user
        await account.createEmailPasswordSession(email, password);
        console.log('Login successful.');
      }
      // Call the onLogin prop to update the parent state
      onLogin();
    } catch (err) {
      console.error('Authentication failed:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleAuth} className="auth-form">
        {isRegistering && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
            aria-label="Your Name"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          aria-label="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          aria-label="Password"
        />
        <button type="submit">
          {isRegistering ? 'Register' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button
        className="link-button"
        onClick={() => setIsRegistering(!isRegistering)}
      >
        {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
      </button>
    </div>
  );
}

export default Auth;

// Optional: Add styles for .link-button in App.css or index.css
// .link-button {
//   background: none;
//   border: none;
//   color: #646cff; /* Or your preferred link color */
//   cursor: pointer;
//   text-decoration: underline;
// }

