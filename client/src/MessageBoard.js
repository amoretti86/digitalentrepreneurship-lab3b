import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient"; // change to your file

export default function MessageBoard() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function loadMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, email, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) setError(error.message);
    else setMessages(data);
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("messages")
      .insert({ content, email: user.email });
    if (error) {
      setError(error.message);
    } else {
      setText("");
      setError("");
      loadMessages();
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Message Board</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          maxLength={500}
          style={{ width: "70%", padding: 8 }}
        />
        <button type="submit" style={{ marginLeft: 8, padding: 8 }}>Post</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((m) => (
          <li key={m.id} style={{ borderBottom: "1px solid #ddd", padding: "8px 0" }}>
            <strong>{m.email}</strong>{" "}
            <small>{new Date(m.created_at).toLocaleString()}</small>
            <div>{m.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
