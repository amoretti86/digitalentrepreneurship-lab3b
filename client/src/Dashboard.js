import React, { useEffect, useState } from 'react';
import './Dashboard.css';

function Dashboard({ name, email, token, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  async function loadMessages() {
    const res = await fetch('/messages', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else setMessages(data);
  }

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch('/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: text }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setText('');
      setError('');
      loadMessages();
    }
  }

  return (
    <div className="dashboard">
      <h2>Welcome to Your Dashboard</h2>
      <div className="user-greeting">
        <h3>Hello, {name}! </h3>
        <p>You've successfully logged in with: {email}</p>
      </div>
      <div className="dashboard-content">
        <p>You're looking handsome today, love ya!</p>
      </div>

      <div className="message-board">
        <h3>Message Board</h3>
        <form onSubmit={handleSubmit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message..."
            maxLength={500}
          />
          <button type="submit">Post</button>
        </form>
        {error && <p className="error">{error}</p>}
        <ul>
          {messages.map((m) => (
            <li key={m.id}>
              <strong>{m.email}</strong>{' '}
              <small>{new Date(m.created_at).toLocaleString()}</small>
              <div>{m.content}</div>
            </li>
          ))}
        </ul>
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Log Out
      </button>
    </div>
  );
}

export default Dashboard;
