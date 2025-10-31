# Full-Stack Registration App Lesson Plan
## Building Authentication with Supabase

**Duration:** 90-120 minutes (add 10-15 minutes if students need to install Heroku CLI)  
**Level:** Intermediate  
**Prerequisites:** Basic JavaScript, Node.js, and React knowledge

---

## Learning Objectives

By the end of this lesson, students will be able to:
- Understand the challenges of building authentication from scratch
- Set up and configure Supabase for backend-as-a-service
- Implement user registration with email verification
- Build a complete full-stack authentication flow
- Deploy a full-stack application to production

---

## Lesson Structure

### Part 1: Introduction & Context (10 minutes)

**Script:**

"Today we're going to build a full-stack registration app. But before we dive in, let's talk about what we're NOT going to do.

Who here has ever built authentication from scratch? [pause for responses]

If you have, you know it's painful. You need to:
- Set up a PostgreSQL database
- Write SQL schemas for users
- Hash passwords securely
- Send verification emails
- Handle email templates
- Manage session tokens
- Deal with password resets

That's a LOT of work just to let someone create an account!

This is where Backend-as-a-Service (BaaS) solutions like Supabase come in. Think of Supabase as your entire backend team in a box. It gives you:
- A PostgreSQL database (already set up)
- Authentication (already built)
- Email handling (already configured)
- Real-time subscriptions
- Storage for files
- And it's all managed for you

Today, we're going to see how much simpler life is when we let Supabase handle the heavy lifting."

---

### Part 2: Architecture Overview (10 minutes)

**Script:**

"Let's look at what we're building. [Show architecture diagram on screen]

**Frontend (React):**
- Registration form
- Email verification form
- Login form
- Dashboard (protected route)

**Backend (Node.js/Express):**
- API endpoints for signup, verify, and login
- Supabase client integration
- Environment variable management

**Supabase (Backend-as-a-Service):**
- PostgreSQL database
- Authentication service
- Email service
- User management dashboard

The beauty of this architecture is that we write minimal backend code. Supabase does most of the heavy lifting.

Here's the flow:
1. User fills out registration form
2. Frontend sends data to our Express API
3. Our API calls Supabase to create the user
4. Supabase automatically sends a 6-digit verification code
5. User enters the code
6. We verify the code with Supabase
7. User is now registered and can log in

Simple, right? Let's build it!"

---

### Part 3: Setting Up Supabase (15 minutes)

**Script:**

"First, we need to set up our Supabase project. This is like setting up your database and authentication server, but it takes 2 minutes instead of 2 hours.

**Step 1: Create Supabase Account**

Go to supabase.com and sign up. It's free for development.

**Step 2: Create a New Project**

Click 'New Project' and give it a name. I'll call mine 'registration-app-demo'.

Choose a strong database password. Write it down! You'll need it later if you want to connect directly to the database.

Click 'Create new project' and wait about 30 seconds while Supabase provisions your entire backend infrastructure. Amazing, right?

**Step 3: Get Your API Keys**

Once your project is ready, go to Settings → API.

You'll see three important values:
1. **Project URL** - This is your Supabase backend endpoint
2. **Anon Key** - This is for client-side operations (public, safe to expose)
3. **Service Role Key** - This is for server-side operations (secret, never expose!)

Copy these values. We'll need them in a moment.

**Step 4: Configure Environment Variables**

In your backend folder, create a `.env` file:

```
SUPABASE_URL=your-project-url-here
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=5000
```

**Important:** Never commit `.env` files to git! They contain secrets.

**Step 5: Install Supabase SDK**

In your terminal, inside the server folder:

```bash
npm install @supabase/supabase-js
```

That's it! Your backend is ready. No database migrations, no email configuration, nothing. It's all done."

---

### Part 4: Code Walkthrough - Backend (25 minutes)

**Script:**

"Now let's look at the backend code. Open up `server/server.js`.

**Setting Up the Supabase Client:**

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

This creates our connection to Supabase. We're using the Service Role Key because we're on the server side and need admin privileges.

**Registration Endpoint:**

Let's look at the signup route:

```javascript
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { name } // Store additional user info
    }
  });
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.json({ 
    message: 'Check your email for verification code',
    user: data.user 
  });
});
```

Notice how simple this is? We don't have to:
- Hash the password (Supabase does it)
- Insert into a database (Supabase does it)
- Send an email (Supabase does it)
- Generate a verification token (Supabase does it)

We just call `supabase.auth.signUp()` and everything happens automatically.

**Verification Endpoint:**

```javascript
app.post('/api/auth/verify', async (req, res) => {
  const { email, code } = req.body;
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'signup'
  });
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.json({ 
    message: 'Email verified successfully',
    session: data.session 
  });
});
```

The user receives a 6-digit code in their email. They enter it, we send it to Supabase, and Supabase verifies it. Simple!

**Login Endpoint:**

```javascript
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  res.json({ 
    message: 'Login successful',
    session: data.session,
    user: data.user 
  });
});
```

Supabase checks the email and password, and returns a session token if it's valid.

**Key Takeaway:** Our backend is incredibly thin. It's basically just a proxy to Supabase. This is the power of BaaS!"

---

### Part 5: Code Walkthrough - Frontend (20 minutes)

**Script:**

"Now let's look at the frontend. This is a React app that talks to our backend API.

**Registration Form:**

Open `client/src/components/Register.js`. 

The form captures email, password, and name. When submitted:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setShowVerification(true);
      alert('Check your email for verification code!');
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

After signup succeeds, we show the verification form.

**Verification Form:**

The user enters their 6-digit code:

```javascript
const handleVerify = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: verificationCode })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Email verified! You can now log in.');
      navigate('/login');
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Login Form:**

Open `client/src/components/Login.js`. Similar pattern:

```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

Notice we're storing the session token in localStorage. In production, you'd want to use httpOnly cookies for better security.

**Protected Routes:**

The dashboard is protected. Only logged-in users can access it. We check for the token in localStorage."

---

### Part 6: Live Demo (15 minutes)

**Script:**

"Let's see this in action!

**Step 1: Start the Backend**

```bash
cd server
npm install
npm start
```

You should see 'Server running on port 5000'.

**Step 2: Start the Frontend**

In a new terminal:

```bash
cd client
npm install
npm start
```

Your browser should open to localhost:3000.

**Step 3: Test Registration**

Let's register a new user:
- Click 'Sign Up'
- Enter email: demo@example.com
- Enter password: SecurePass123!
- Enter name: Demo User
- Click 'Register'

[Wait for email]

Now check your email. **Important:** Check your spam folder! Supabase emails sometimes land there.

You should see a 6-digit code. Enter it in the verification form.

**Step 4: View in Supabase Dashboard**

Let's go back to Supabase. Click Authentication → Users.

See that? Our user is now in the database. We can see:
- Email
- When they signed up
- Whether they're verified
- Their metadata (name)

We didn't write any database code for this!

**Step 5: Test Login**

Now let's log in with our new account. Go to the login page and enter your credentials.

Success! You're now on the dashboard.

**Step 6: Inspect the Session**

Open your browser's developer tools → Application → Local Storage.

See the token? That's your session token. The backend can verify this token with Supabase to authenticate API requests."

---

### Part 7: Deployment (15 minutes)

**Script:**

"Now let's deploy this to production. We'll use Heroku for the backend.

**Prerequisites: Install Heroku CLI**

First, we need to install the Heroku Command Line Interface. This lets us deploy and manage apps from our terminal.

**For macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**For Windows:**
Download and run the installer from: https://devcenter.heroku.com/articles/heroku-cli

**For Linux (Ubuntu/Debian):**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

After installation, verify it worked:
```bash
heroku --version
```

You should see something like 'heroku/8.x.x'.

**Login to Heroku:**

```bash
heroku login
```

This will open your browser for authentication. Log in with your Heroku account (create one at heroku.com if you don't have one - it's free).

**Step 1: Create Heroku App**

Now we're ready to create our app:

```bash
heroku create your-app-name
```

**Step 2: Set Environment Variables**

```bash
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_ANON_KEY=your-anon-key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-service-key
heroku config:set PORT=5000
```

**Step 3: Deploy**

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

**Step 4: Update Frontend API URL**

In your React app, change the API URL from localhost to your Heroku URL:

```javascript
const API_URL = 'https://your-app-name.herokuapp.com';
```

**Step 5: Deploy Frontend**

You can deploy the frontend to Vercel, Netlify, or any static hosting service.

That's it! Your app is live!"

---

### Part 8: Discussion & Best Practices (10 minutes)

**Script:**

"Before we wrap up, let's talk about some important considerations:

**Security Best Practices:**

1. **Never expose Service Role Key** - Only use it on the backend
2. **Use HTTPS in production** - Always encrypt data in transit
3. **Validate user input** - Don't trust anything from the frontend
4. **Use httpOnly cookies** - Better than localStorage for tokens
5. **Implement rate limiting** - Prevent brute force attacks

**Supabase Advantages:**

- ✅ Fast development - No need to build auth from scratch
- ✅ Scalable - Supabase handles thousands of users easily
- ✅ Secure - They handle security patches and best practices
- ✅ Free tier - Great for learning and small projects
- ✅ Real-time features - Bonus: built-in real-time subscriptions

**Supabase Limitations:**

- ❌ Vendor lock-in - You're tied to Supabase's platform
- ❌ Less control - Can't customize everything
- ❌ Costs at scale - Free tier has limits
- ❌ Learning curve - Need to learn their API

**When to Use Supabase:**

- MVPs and prototypes
- Startups needing to move fast
- Projects with standard auth requirements
- When you don't want to manage infrastructure

**When NOT to Use Supabase:**

- When you need complete control over auth logic
- Highly customized authentication flows
- When you already have a backend team
- Compliance requirements that need on-premise hosting

**Questions to Consider:**

- How would you add password reset functionality?
- How would you implement social login (Google, GitHub)?
- How would you add two-factor authentication?
- How would you handle user roles and permissions?

All of these are possible with Supabase and just require exploring their documentation!"

---

### Part 9: Hands-On Exercise (15 minutes)

**Script:**

"Now it's your turn! Here's what I want you to do:

**Exercise 1: Clone and Run**

Clone the repository and get it running locally:

```bash
git clone https://github.com/amoretti86/digitalentrepreneurship-lab3b.git
cd digitalentrepreneurship-lab3b
```

Follow the setup instructions in the README.

**Exercise 2: Customize**

Make these modifications:
1. Add a 'Company' field to the registration form
2. Display the user's name and company on the dashboard
3. Change the email verification to use a different message

**Exercise 3: Explore Supabase**

In your Supabase dashboard:
1. Find your registered user
2. Manually verify a user
3. Delete a test user
4. Explore the database tables

**Bonus Challenge:**

Add a 'Forgot Password' feature using Supabase's password reset functionality.

Hint: Look at `supabase.auth.resetPasswordForEmail()`

Take 15 minutes to work on this. I'll walk around and help if you get stuck."

---

### Part 10: Wrap-Up & Resources (5 minutes)

**Script:**

"Great work today! Let's recap what we learned:

**Key Takeaways:**

1. Backend-as-a-Service platforms like Supabase dramatically reduce development time
2. Authentication is complex, but BaaS makes it simple
3. You can build production-ready auth in hours, not weeks
4. The trade-off is some loss of control and potential vendor lock-in

**What's Next?**

- Explore Supabase's other features (real-time, storage, edge functions)
- Add social authentication (Google, GitHub)
- Implement role-based access control
- Add two-factor authentication
- Explore alternatives (Firebase, Auth0, AWS Amplify)

**Resources:**

- Supabase Documentation: https://supabase.com/docs
- This project repo: https://github.com/amoretti86/digitalentrepreneurship-lab3b
- Supabase Discord community (great for questions!)
- My office hours: [Your availability]

**Homework:**

Deploy your version of this app and send me the link. Add at least one custom feature.

Questions?"

---

## Assessment Ideas

**Quick Quiz:**
1. What are the three Supabase API keys and when do you use each?
2. What's the difference between BaaS and traditional backend development?
3. Why do we use email verification codes instead of magic links?

**Project Assessment:**
- Does the app run without errors?
- Is the code properly structured?
- Did they successfully customize a feature?
- Did they deploy to production?

**Discussion Questions:**
- When would you choose Supabase over building custom auth?
- What security considerations are important for authentication?
- How would you scale this app to handle 100,000 users?

---

## Troubleshooting Guide

**Common Issues:**

1. **Heroku CLI not installed**
   - Mac: `brew tap heroku/brew && brew install heroku`
   - Windows: Download from https://devcenter.heroku.com/articles/heroku-cli
   - Linux: `curl https://cli-assets.heroku.com/install.sh | sh`
   - Verify: `heroku --version`

2. **"Address already in use" error**
   - Kill process on port 5000: `lsof -ti:5000 | xargs kill -9`

2. **Email not arriving**
   - Check spam folder
   - Verify Supabase project is active
   - Check email settings in Supabase dashboard

3. **"Invalid API key" error**
   - Double-check .env file
   - Ensure you copied the full key from Supabase
   - Restart the server after changing .env

4. **CORS errors**
   - Ensure CORS is properly configured in server.js
   - Check that frontend is calling correct backend URL

5. **Git revert issues**
   - Run `git revert --abort` first
   - Then try the revert command again

---

## Additional Resources

**Sample Code Snippets:**
- Password reset functionality
- Social auth integration
- Role-based access control
- Session management improvements

**Further Reading:**
- OAuth 2.0 and OpenID Connect
- JWT tokens and session management
- Database normalization for user data
- Security best practices for web apps

---

**End of Lesson Plan**

*Note: Adjust timing based on your class size and student experience level. Consider splitting into two sessions if needed.*
