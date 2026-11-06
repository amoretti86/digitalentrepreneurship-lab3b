
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ name, email, accessToken, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // Include the login token in API requests.
  const authHeaders = {
    Authorization: `Bearer ${accessToken}`
  };

  // Load messages from Supabase through Express.
  useEffect(() => {
    let active = true;

    const fetchMessages = async () => {
      try {
        const response = await axios.get('/messages', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (active) {
          setMessages(response.data.messages || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            'Unable to load messages.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (accessToken) {
      fetchMessages();
    } else {
      setError('Please log in again to view messages.');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [accessToken]);

  // Post a new message.
  const handlePostMessage = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();

    if (!content || posting) return;

    setPosting(true);
    setError('');

    try {
      const response = await axios.post(
        '/messages',
        { content },
        { headers: authHeaders }
      );

      setMessages((previousMessages) => [
        response.data.message,
        ...previousMessages
      ]);

      setNewMessage('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to post your message.'
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>Welcome to Your Dashboard</h2>

      <div className="user-greeting">
        <h3>Hello, {name}!</h3>
        <p>You've successfully logged in with: {email}</p>
      </div>

      <div className="dashboard-content">
        <p>You're looking handsome today, love ya!</p>
      </div>

      <div className="message-board">
        <h3>Community Message Board</h3>
        <p>Share a message with other students!</p>

        <form onSubmit={handlePostMessage}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write your message here..."
            maxLength={1000}
            rows={3}
            required
          />

          <button
            type="submit"
            disabled={posting || !accessToken || !newMessage.trim()}
          >
            {posting ? 'Posting...' : 'Post Message'}
          </button>
        </form>

        {error && <p className="message-error">{error}</p>}

        <h4>Recent Messages</h4>

        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No messages yet. Be the first to post!</p>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div className="message-card" key={message.id}>
                <p>{message.content}</p>
                <small>
                  {new Date(message.created_at).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Log Out
      </button>
    </div>
  );
}

export default Dashboard;
