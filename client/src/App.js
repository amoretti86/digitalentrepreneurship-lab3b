import React, { useState } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';
import PatientOnboarding from './PatientOnboarding';
import InsuranceUpload from './InsuranceUpload';
import './App.css';

function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [role, setRole] = useState('patient');

  const [message, setMessage] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [isStarted, setIsStarted] = useState(false);
  const [submittedOnboarding, setSubmittedOnboarding] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/register', { name, email, password, role });
      setMessage(response.data.message || 'Verification email sent.');
      setIsEmailSent(true);
    } catch (error) {
      setMessage('Registration error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/login', { email, password });
      setName(response.data.name || 'User');
      setMessage('Login successful!');
      setIsVerified(true);
    } catch (error) {
      setMessage('Login error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const response = await axios.post('/verify', { email, verificationCode });
      setMessage(response.data.message || 'Email verified.');
      if (response.data.success) setIsVerified(true);
    } catch (error) {
      setMessage('Verification failed.');
    }
  };

  const handleLogout = () => {
    setName('');
    setEmail('');
    setPassword('');
    setVerificationCode('');
    setMessage('');
    setIsEmailSent(false);
    setIsVerified(false);
    setIsStarted(false);
    setSubmittedOnboarding(false);
  };

  const renderRegistrationForm = () => (
    <form onSubmit={handleRegister}>
      <div>
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <label>Registering as:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="patient">Patient</option>
          <option value="pharmacy">Pharmacy</option>
        </select>
      </div>
      <button type="submit">Register</button>
    </form>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin}>
      <div>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button type="submit">Login</button>
    </form>
  );

  const renderVerificationForm = () => (
    <div>
      <h2>Verify Your Email</h2>
      <label>Verification Code</label>
      <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
      <button onClick={handleVerifyEmail}>Verify</button>
    </div>
  );

  return (
    <div className="App">
      <div className="navbar">
        {!isVerified ? (
          <>
            <button onClick={() => { setAuthMode('login'); setIsStarted(true); }}>Login</button>
            <button onClick={() => { setAuthMode('register'); setIsStarted(true); }}>Register</button>
          </>
        ) : (
          <button onClick={handleLogout}>Log Out</button>
        )}
      </div>

      {!isStarted ? (
        <div className="hero">
          <h1>Chronic Care Companion</h1>
          <p>Bridging Chronic Care and Local Pharmacy Support</p>
          <button onClick={() => setIsStarted(true)}>Get Started</button>
        </div>
      ) : !isVerified ? (
        <div className="auth-container">
          <h1>Chronic Care Companion</h1>
          <p>Bridging Chronic Care and Independent Pharmacy Support</p>
          {isEmailSent ? (
            renderVerificationForm()
          ) : (
            authMode === 'register' ? renderRegistrationForm() : renderLoginForm()
          )}
        </div>
      ) : (
        role === 'patient' && !submittedOnboarding
          ? <PatientOnboarding email={email} onComplete={() => setSubmittedOnboarding(true)} />
          : (
            <>
              <InsuranceUpload email={email} />
            </>
          )
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default App;