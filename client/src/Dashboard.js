import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ name, email, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  async function loadMessages() {
    const response = await axios.get('/messages');
    setMessages(response.data);
  }

  useEffect(() => {
    loadMessages().catch(() => {
      setError('Could not load messages.');
    });
  }, []);

  async function handlePost(event) {
    event.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Message cannot be empty.');
      return;
    }

    setPosting(true);

    try {
      await axios.post('/messages', { name, text });
      setText('');
      await loadMessages();
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Could not post or refresh messages.'
      );
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="dashboard">
      <h2>Welcome to Your Dashboard</h2>

      <div className="user-greeting">
        <h3>Hello, {name}!</h3>
        <p>You've successfully logged in with: {email}</p>
      </div>

      <div className="dashboard-content">
        <h3>Message Board</h3>

        <form onSubmit={handlePost}>
          <label htmlFor="message">Write a message</label>
          <textarea
            id="message"
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
          />
          <button type="submit" disabled={posting}>
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>

        {error && <p role="alert">{error}</p>}

        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          <ul>
            {messages.map((message) => (
              <li key={message.id}>
                <strong>{message.name}</strong>
                <p>{message.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Log Out
      </button>
    </div>
  );
}

export default Dashboard;