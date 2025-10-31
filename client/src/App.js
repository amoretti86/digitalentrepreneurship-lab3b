import React, { useState } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';
import './App.css';

function App() {
    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    
    // Original input state variables
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    // NEW: Added password state for authentication
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    
    // Original application flow state
    const [message, setMessage] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    
    // NEW: Added authentication mode state to toggle between register and login
    // This controls which form is displayed to the user
    const [authMode, setAuthMode] = useState('register'); // Options: 'register' or 'login'
    
    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    
    // NEW: Renamed from handleSubmit to handleRegister
    // Now specifically handles the registration form submission
    const handleRegister = async (e) => {
        e.preventDefault();

        // Email validation remains the same
        const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
        if (!emailPattern.test(email)) {
            setMessage('Email must end with @spelman.edu or @morehouse.edu.');
            return;
        }

        try {
            // MODIFIED: Changed endpoint from /submit to /register
            // NEW: Now sending password along with name and email
            const response = await axios.post('/register', { name, email, password });
            console.log("Registration API response:", response);
            // Added fallback message in case response doesn't include a message
            setMessage(response.data.message || 'Verification code sent to your email!');
            setIsEmailSent(true); // Show verification step
        } catch (error) {
            // IMPROVED: More detailed error message with fallback
            setMessage('Error during registration: ' + (error.response?.data?.message || error.message));
        }
    };

    // NEW: Added function to handle login form submission
    // This is completely new functionality for returning users
    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            // Makes API call to login endpoint with email and password
            const response = await axios.post('/login', { email, password });
            console.log("Login API response:", response);
            
            if (response.data.success) {
                // NEW: Store user name from response if available
                setName(response.data.name || 'User'); // Use name from response or default to 'User'
                setMessage('Login successful!');
                // Skip verification for login and go straight to dashboard
                setIsVerified(true); 
            } else {
                setMessage(response.data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            setMessage('Error during login: ' + (error.response?.data?.message || error.message));
        }
    };

    // Verify email function remains largely unchanged
    const handleVerifyEmail = async () => {
        try {
            const response = await axios.post('/verify', { email, verificationCode });
            // IMPROVED: Added fallback message
            setMessage(response.data.message || 'Email verified successfully!');
            
            if (response.data.success) {
                setIsVerified(true); // Show dashboard
            }
        } catch (error) {
            setMessage('Invalid verification code.');
        }
    };

    // MODIFIED: Logout handler now resets password state too
    const handleLogout = () => {
        // Reset all states except authMode (keeps the same tab active)
        setName('');
        setEmail('');
        setPassword(''); // NEW: Clear password on logout
        setMessage('');
        setVerificationCode('');
        setIsEmailSent(false);
        setIsVerified(false);
    };

    // NEW: Function to toggle between register and login modes
    // This changes which form is displayed without changing page
    const toggleAuthMode = () => {
        setAuthMode(authMode === 'register' ? 'login' : 'register');
        setMessage(''); // Clear any messages when switching modes
    };

    // ==========================================
    // COMPONENT RENDERING FUNCTIONS
    // ==========================================
    
    // NEW: Separate function to render login form
    // Keeps the JSX organized and easier to maintain
    const renderLoginForm = () => (
        <form onSubmit={handleLogin}>
            <div>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Login</button>
        </form>
    );

    // NEW: Separate function to render registration form
    // Similar to original form but adds password field
    const renderRegistrationForm = () => (
        <form onSubmit={handleRegister}>
            <div>
                <label>Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Register</button>
        </form>
    );

    // NEW: Separate function for verification form 
    // Extracted from original code for better organization
    const renderVerificationForm = () => (
        <div>
            <h2>Verify Your Email</h2>
            <label>Enter Verification Code</label>
            <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
            />
            <button onClick={handleVerifyEmail}>Verify</button>
        </div>
    );

    // ==========================================
    // MAIN RENDER FUNCTION
    // ==========================================
    return (
        <div className="App">
            {/* MODIFIED: Conditional rendering now includes more logic */}
            {!isVerified ? (
                <>
                    {/* CHANGED: Heading from "Enter Your Info" to "Welcome" */}
                    <h1>Welcome</h1>
                    
                    {/* Conditional rendering: Show verification form or auth forms */}
                    {isEmailSent ? (
                        renderVerificationForm()
                    ) : (
                        <>
                            {/* NEW: Tab navigation for switching between register and login */}
                            <div className="auth-tabs">
                                <button 
                                    className={`tab-btn ${authMode === 'register' ? 'active' : ''}`}
                                    onClick={() => setAuthMode('register')}
                                >
                                    Register
                                </button>
                                <button 
                                    className={`tab-btn ${authMode === 'login' ? 'active' : ''}`}
                                    onClick={() => setAuthMode('login')}
                                >
                                    Login
                                </button>
                            </div>
                            
                            {/* NEW: Conditionally render either registration or login form */}
                            {authMode === 'register' ? renderRegistrationForm() : renderLoginForm()}
                        </>
                    )}
                </>
            ) : (
                /* Dashboard component remains the same */
                <Dashboard 
                    name={name} 
                    email={email} 
                    onLogout={handleLogout} 
                />
            )}
            
            {/* Message display remains the same */}
            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default App;