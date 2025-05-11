import { useState } from 'react';
import { account } from '../appwrite';

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
        await account.create('unique()', email, password, name);
        // After successful registration, automatically log them in
        await account.createEmailPasswordSession(email, password);
        console.log('Registration successful, logged in.');
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

