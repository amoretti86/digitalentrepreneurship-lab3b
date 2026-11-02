// Import required modules
const express = require('express');
const path = require('path');

// Initialize Supabase client
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(express.json());

// Serve static files from React build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// ========================================================
// Authentication Routes using Supabase Auth
// ========================================================

// Registration endpoint using Supabase Auth
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    console.log(`Received registration request for email: ${email}`);

    // Email validation
    const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, message: 'Email must end with @spelman.edu or @morehouse.edu.' });
    }

    try {
        // Register user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } } // Store additional user info
        });

        if (error) throw error;

        res.json({ success: true, message: 'Registration successful. Check your email for verification.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error registering user' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Received login request for email: ${email}`);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        res.json({ success: true, message: 'Login successful', user: data.user, token: data.session.access_token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});

// Email verification using 6-digit code
app.post('/verify', async (req, res) => {
    const { email, verificationCode } = req.body;
    console.log(`Verifying email: ${email} with code: ${verificationCode}`);

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: verificationCode,
            type: 'signup'
        });

        if (error) {
            console.error('Verification failed:', error);
            return res.status(400).json({ success: false, message: 'Invalid verification code.' });
        }

        res.json({ success: true, message: 'Email verified successfully', token: data.session?.access_token });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Error verifying email' });
    }
});

// Fallback route to serve React frontend for any unmatched routes
// ========================================================
// Message Board Routes
// ========================================================

// Work out who is logged in from the token the browser sends
async function getUserFromRequest(req) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user;
}

// Get the 20 latest messages
app.get('/messages', async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Please log in' });

    const { data, error } = await supabase
        .from('messages')
        .select('id, content, email, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Post a new message
app.post('/messages', async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Please log in' });

    const content = (req.body.content || '').trim();
    if (!content || content.length > 500) {
        return res.status(400).json({ error: 'Message must be 1 to 500 characters' });
    }

    const { error } = await supabase
        .from('messages')
        .insert({ user_id: user.id, email: user.email, content });

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ ok: true });
});
// Fallback: serve the React app for any other route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
