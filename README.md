# Lab 3B: Full-Stack Registration App (React + Express + Supabase)

A small full-stack app where you can **register** with a name, school email and password, receive a **6-digit verification code** by email, **verify** your account, and **log in** to a dashboard.

- **Frontend:** React (in `client/`)
- **Backend:** Node.js + Express (in `server/`)
- **Database + Auth + Email:** [Supabase](https://supabase.com)
- **Hosting:** Heroku

> **Updated October 2026.** Supabase and Heroku have changed since this lab was first written. If you're following an older guide, read [What changed since 2025](#what-changed-since-2025) first.

---

## Table of contents

1. [How a full-stack app works](#1-how-a-full-stack-app-works)
2. [HTTP basics: GET, POST, PUT, PATCH, DELETE](#2-http-basics-get-post-put-patch-delete)
3. [How this app is put together](#3-how-this-app-is-put-together)
4. [Setup: clone and install](#4-setup-clone-and-install)
5. [Setup: Supabase](#5-setup-supabase)
6. [Create your `.env` file](#6-create-your-env-file)
7. [Run it locally](#7-run-it-locally)
8. [Deploy to Heroku](#8-deploy-to-heroku)
9. [Troubleshooting](#9-troubleshooting)
10. [What changed since 2025](#what-changed-since-2025)

---

## 1. How a full-stack app works

A web app is split into two programs that talk to each other over the internet:

| | **Frontend** (client) | **Backend** (server) |
|---|---|---|
| Runs where? | In the user's **browser** | On a **server** you control (your laptop, Heroku, etc.) |
| Written in (here) | React (JavaScript + JSX) | Node.js + Express |
| Job | Show the page, collect input, react to clicks | Receive requests, apply rules, talk to the database, send back answers |
| Can users see the code? | **Yes.** Anything in the frontend is public | No. Secrets (API keys, passwords) live here |

The frontend never talks to the database directly. It sends an **HTTP request** to the backend, the backend does the work and sends back an **HTTP response**, usually as **JSON**:

```
 Browser (React)                Express server                  Supabase
 ───────────────                ──────────────                  ────────
 user clicks "Register"
   POST /register  ───────────▶ check email domain
   {name,email,password}        supabase.auth.signUp() ───────▶ create user,
                                                                email a 6-digit code
                   ◀─────────── 200 {"success":true, ...}  ◀─── ok
 show "enter your code"
```

**Why not put the Supabase calls in the browser?** Because our backend uses a **secret key** that gives full admin access to the project. Anything shipped to the browser can be read by anyone, so secrets stay on the server.

---

## 2. HTTP basics: GET, POST, PUT, PATCH, DELETE

Every HTTP request has:

- a **method** (what you want to do),
- a **path** (what you want to do it to), e.g. `/register`,
- optional **headers** (metadata, e.g. `Content-Type: application/json`),
- an optional **body** (the data, usually JSON).

Every response has a **status code** and usually a body.

### The methods

Think of a list of users stored on a server. The methods map to **CRUD** (Create, Read, Update, Delete):

| Method | CRUD | Meaning | Has a body? | Example |
|---|---|---|---|---|
| **GET** | Read | "Give me this thing." Never changes data | No | `GET /users/42` → returns user 42 |
| **POST** | Create / action | "Here's new data" or "do this action" | Yes | `POST /users` with `{"name":"Ada"}` → creates a user |
| **PUT** | Update (replace) | "Replace this thing **entirely** with what I'm sending" | Yes | `PUT /users/42` with the full user object |
| **PATCH** | Update (partial) | "Change **only these fields**" | Yes | `PATCH /users/42` with `{"name":"Ada L."}` |
| **DELETE** | Delete | "Remove this thing" | Usually no | `DELETE /users/42` |

**PUT vs PATCH:** if user 42 is `{"name":"Ada","email":"ada@spelman.edu"}` and you `PUT` `{"name":"Ada L."}`, a strict API would now have a user with **no email**, because PUT replaces the whole thing. `PATCH` with the same body changes only the name.

**Why does login use POST and not GET?** GET requests put their data in the URL (`/login?password=hunter2`), and URLs end up in browser history and server logs. Anything sensitive, or anything that changes state, goes in a POST body.

### Status codes you'll see

| Code | Meaning | In this app |
|---|---|---|
| `200 OK` | It worked | Successful register / verify / login |
| `400 Bad Request` | Your input is wrong | Email isn't `@spelman.edu`/`@morehouse.edu`, wrong code |
| `401 Unauthorized` | Not logged in / bad credentials | Wrong password, or email not verified yet |
| `404 Not Found` | No such thing | |
| `500 Internal Server Error` | The server broke | Supabase rejected the request (read the message) |

Rule of thumb: **4xx = the client's fault, 5xx = the server's fault.**

### In code

Frontend (React, using `axios`), from `client/src/App.js`:

```javascript
const response = await axios.post('/register', { name, email, password });
// response.data is the JSON the server sent back
```

The other methods look the same: `axios.get(url)`, `axios.put(url, body)`, `axios.patch(url, body)`, `axios.delete(url)`.

Backend (Express), from `server/server.js`:

```javascript
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;  // the JSON body the frontend sent
    // ...do work...
    res.json({ success: true, message: '...' }); // send JSON back (status 200)
});
```

Express has a matching function for each method: `app.get`, `app.post`, `app.put`, `app.patch`, `app.delete`.

### Try it without a browser

With the server running locally (step 7), you can send requests yourself using `curl`:

```bash
# A request the server rejects (400): wrong email domain
curl -i -X POST http://localhost:5001/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@gmail.com","password":"secret123"}'

# A GET request: the server returns the React page's HTML
curl -i http://localhost:5001/
```

`-i` shows the status code and headers. Compare them with the table above.

---

## 3. How this app is put together

```
digitalentrepreneurship-lab3b/
├── package.json          ← used by Heroku: installs server deps, builds the client, starts the server
├── .env.example          ← template for your secrets (copy to .env)
├── server/
│   └── server.js         ← the Express backend (all API routes live here)
└── client/
    ├── package.json      ← React app; "proxy" forwards API calls to the server in dev mode
    └── src/
        ├── App.js        ← register / verify / login forms + the axios calls
        └── Dashboard.js  ← shown after you log in or verify
```

### The API (all in `server/server.js`)

| Method | Path | Body | What it does |
|---|---|---|---|
| `POST` | `/register` | `{ name, email, password }` | Checks the email domain, calls `supabase.auth.signUp()`. Supabase emails a 6-digit code |
| `POST` | `/verify` | `{ email, verificationCode }` | Calls `supabase.auth.verifyOtp()` to confirm the code |
| `POST` | `/login` | `{ email, password }` | Calls `supabase.auth.signInWithPassword()`. Returns the user's name |
| `GET` | `*` (anything else) | | Sends back the built React app (`client/build/index.html`) |

This app only uses POST and GET. **Exercise:** add a `PATCH /profile` route that updates the user's name with `supabase.auth.admin.updateUserById(id, { user_metadata: { name } })`, and a `DELETE /account` route using `supabase.auth.admin.deleteUser(id)`.

### Dev mode vs production

- **Production (Heroku):** one Express server does both jobs. It serves the built React files **and** answers `/register`, `/login`, `/verify`.
- **Dev mode:** you run **two** servers. React's dev server on port **3000** gives you live reload, and Express runs on **5001**. The `"proxy"` line in `client/package.json` forwards any request React doesn't recognize (like `POST /register`) to `localhost:5001`. That's why the frontend can call `axios.post('/register')` without a full URL in both modes.

---

## 4. Setup: clone and install

**You need:** [Node.js 22 LTS](https://nodejs.org) (Node 20 or newer works locally), [git](https://git-scm.com), and a code editor.

```bash
git clone https://github.com/amoretti86/digitalentrepreneurship-lab3b.git
cd digitalentrepreneurship-lab3b

npm install                   # server dependencies (Express, Supabase, dotenv)
npm install --prefix client   # React dependencies (takes a minute)
```

You'll see `npm audit` warnings from the React tooling. They're expected and safe to ignore for this lab.

---

## 5. Setup: Supabase

### 5.1 Create a project

1. Sign up at [supabase.com](https://supabase.com). The free plan is fine.
2. Click **New project**. Pick a name, set a database password (save it somewhere), and choose a region near you.
3. Wait a minute or two while it provisions.

> **Use your own project.** Each student should create their own Supabase project. See [5.4](#54-email-limits-read-this-before-the-demo) for why.

### 5.2 Make the email send a 6-digit code (not a link)

By default, Supabase's confirmation email contains a **link**. Our app expects a **code**, so change the template:

1. Go to **Authentication → Emails** (in some dashboard versions: **Authentication → Email Templates**).
2. Open the **Confirm signup** template.
3. Replace the body with something like:

   ```html
   <h2>Confirm your signup</h2>
   <p>Your verification code is:</p>
   <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
   <p>This code expires in 1 hour.</p>
   ```

   `{{ .Token }}` is the code. Remove `{{ .ConfirmationURL }}` if you don't want the link too.
4. **Save.**

Then check two settings under **Authentication → Sign In / Providers → Email**:

- **Confirm email** must be **ON**. Otherwise users are logged in immediately and no code is sent.
- **Email OTP Length** should be **6**. Some projects default to 8 digits.

### 5.3 Get your keys

1. **Project URL:** Go to **Project Settings → Data API** (or click **Connect** at the top of the project page). It looks like `https://abcdefghijkl.supabase.co`.
2. **Secret key:** Go to **Project Settings → API Keys**. Under **Secret keys**, copy the key that starts with `sb_secret_`. Click **Create new API keys** first if you don't see one.

Notes:

- Supabase replaced the old `anon` and `service_role` keys with **publishable** (`sb_publishable_...`) and **secret** (`sb_secret_...`) keys. Old guides that say "Settings → API → service_role" are describing the same thing. The legacy `service_role` key still works in this app if your project has one (under the **Legacy API Keys** tab), but it's being retired by the end of 2026.
- This app only needs the **secret** key, because all Supabase calls happen on the server. You don't need the publishable/anon key.
- **The secret key is a password to your whole project.** Never put it in frontend code, never commit it to GitHub, never paste it in Slack.

### 5.4 Email limits (read this before the demo)

Supabase's built-in email sender is for testing only:

- **It only sends to members of your Supabase team.** Any other address fails with `Email address not authorized`.
- **It sends at most 2 emails per hour** (per project).

What this means for the lab:

| Situation | Does it work? |
|---|---|
| You registered on Supabase with the same school email you register with in the app | ✅ Yes, you're a team member |
| You signed up for Supabase with Gmail but register in the app with `@spelman.edu` | ❌ Not authorized. Either invite your school email to your Supabase org (**Organization settings → Team → Invite**) or sign up for Supabase with your school email |
| The instructor runs one shared project and the whole class registers | ❌ Only team members get email, and only 2 per hour. Use **custom SMTP** (below) |
| You register 3 times in an hour while debugging | ❌ Third one is rate-limited. Wait, or delete the test user and try later |

**Custom SMTP (for a shared class project or a real app):** Create a free account with an email provider such as [Resend](https://resend.com), [Brevo](https://brevo.com) or [Postmark](https://postmarkapp.com). Get its SMTP host, port, username and password, and enter them under **Authentication → Emails → SMTP Settings** in Supabase. With custom SMTP, Supabase emails any address, and the default limit rises to 30 emails per hour (adjustable under **Authentication → Rate Limits**). Most providers require you to verify a sending domain first. Do this before class, not during it.

### 5.5 Allowed email domains

The app only accepts emails ending in `@spelman.edu` or `@morehouse.edu`. That check lives in **two** places: `client/src/App.js` (instant feedback) and `server/server.js` (the real enforcement, because frontend checks can be bypassed with `curl`). To allow other domains, edit the regex in both files:

```javascript
const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
```

---

## 6. Create your `.env` file

The server reads secrets from a file called `.env` in the **repo root** (next to `package.json`). It's listed in `.gitignore`, so git won't commit it.

```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

```bash
SUPABASE_URL=https://abcdefghijkl.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_real_key_here
PORT=5001
```

If you start the server without these, it stops immediately with `Missing SUPABASE_URL or SUPABASE_SECRET_KEY`.

---

## 7. Run it locally

### Option A: Dev mode (two terminals, live reload). Use this while coding.

```bash
# Terminal 1: backend on http://localhost:5001
npm start

# Terminal 2: frontend on http://localhost:3000 (opens your browser)
npm start --prefix client
```

Use the app at **http://localhost:3000**. Edits to React files reload instantly. After editing `server/server.js`, stop the server (Ctrl+C) and run `npm start` again.

### Option B: Production mode (one server, same as Heroku)

```bash
npm run build --prefix client   # compiles React into client/build/
npm start                       # serves everything on http://localhost:5001
```

Use the app at **http://localhost:5001**. Run the build again whenever you change frontend code.

### Test the whole flow

1. **Register** with your name, school email and a password of at least 6 characters.
2. The page switches to **Verify Your Email**. Check your inbox **and spam folder** for the code.
3. Enter the code and click **Verify**. You should see the dashboard.
4. Log out, switch to the **Login** tab and log in with the same email and password. The dashboard should greet you by name.
5. In Supabase, open **Authentication → Users**. Your user is there, with a confirmed email.

Watch the terminal running the server. It logs every request it receives, and any error from Supabase.

---

## 8. Deploy to Heroku

### 8.1 Before you start

- **Cost:** Heroku has no free plan. The cheapest **Eco** dynos cost **$5/month** for your whole account, and they sleep when unused. Students: the [GitHub Student Developer Pack](https://education.github.com/pack) has included Heroku credits. Check what it currently offers before paying.
- Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) (`brew install heroku/brew/heroku` on Mac), then run `heroku login`.
- The project must be a git repo with your changes **committed**, because Heroku deploys whatever is in your latest commit.

### 8.2 Create the app and set your secrets

```bash
heroku create your-app-name      # adds a git remote called "heroku"
# (If you created the app on heroku.com instead: heroku git:remote -a your-app-name)

heroku config:set SUPABASE_URL=https://abcdefghijkl.supabase.co
heroku config:set SUPABASE_SECRET_KEY=sb_secret_your_real_key_here
```

**Don't set `PORT` on Heroku.** Heroku assigns it automatically, and overriding it breaks the app. Your `.env` file is **not** uploaded (it's gitignored), which is why the secrets are set with `config:set`.

### 8.3 Deploy

```bash
git add .
git commit -m "Deploy registration app"
git push heroku main
```

During the push, Heroku:

1. installs Node 22 (from `"engines"` in `package.json`),
2. installs the server dependencies,
3. runs `heroku-postbuild`, which installs and builds the React app,
4. starts the app with `npm start` (`node server/server.js`).

Then:

```bash
heroku open          # opens https://your-app-name-xxxx.herokuapp.com
heroku logs --tail   # live server logs; use this when something doesn't work
```

Run the same test flow from step 7 on the live URL.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Missing SUPABASE_URL or SUPABASE_SECRET_KEY` | No `.env` in the repo root (locally) or no config vars (Heroku: `heroku config`) |
| `Email address not authorized` | Built-in email only sends to your Supabase team. See [5.4](#54-email-limits-read-this-before-the-demo) |
| `email rate limit exceeded` | Over 2 emails/hour on the built-in sender. Wait, or set up custom SMTP |
| Email arrives with a **link**, not a code | You didn't edit the **Confirm signup** template ([5.2](#52-make-the-email-send-a-6-digit-code-not-a-link)) |
| Code is **8 digits** | Set **Email OTP Length** to 6, or just type all 8. The app accepts either |
| No email at all | Check spam. Check **Confirm email** is ON. Check the server terminal and **Logs → Auth** in Supabase |
| `Invalid verification code` | Typo, or the code expired (1 hour) or was replaced by a newer one. Only the latest code works |
| Login says `Invalid email or password` but the password is right | The email isn't verified yet. Verify first, or confirm the user manually in **Authentication → Users** |
| `User already registered` | That email exists. Log in instead, or delete the user in **Authentication → Users** |
| `Password should be at least 6 characters` | Supabase's minimum password length |
| `Invalid API key` | Wrong key or URL. Paste the **secret** key, not the publishable one, with no extra spaces or quotes |
| Frontend loads but every request fails with a proxy error (dev mode) | The backend isn't running. Start it with `npm start` in the repo root |
| `EADDRINUSE` / port already in use | Another server is already running. Stop it, or change `PORT` in `.env` (and `"proxy"` in `client/package.json`) |
| Heroku: `Application error` page | Run `heroku logs --tail`. Usually missing config vars |
| Heroku build fails | Make sure you committed everything and that `node_modules` is **not** committed |
| Supabase project "paused" | Free projects pause after about a week of inactivity. Click **Restore** in the dashboard |

---

## What changed since 2025

If you're comparing with an older version of this lab:

| Before | Now |
|---|---|
| Keys under **Settings → API**: `anon` + `service_role` | Keys under **Settings → API Keys**: publishable `sb_publishable_...` + secret `sb_secret_...`. Legacy keys are being retired by the end of 2026 |
| `.env` used `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ANON_KEY` | Uses `SUPABASE_SECRET_KEY` (the old name still works as a fallback). The anon key was never used, so it's gone |
| Built-in email sent to anyone, a few per hour | Built-in email only sends to **project team members**, 2 per hour. Use custom SMTP for anything else |
| Node 20 on Heroku | Node 20 reached end of life in April 2026. Now **Node 22** |
| Server on port 5000 | Port **5001**, because macOS AirPlay Receiver takes port 5000 |
| `node_modules` was committed to the repo | Removed and gitignored |
| Dashboard said "Hello, User" after logging in | The server now returns the user's name on login |
| Shared Supabase client could keep a logged-in user's session | Server client is created with `persistSession: false` |

Built on the Supabase docs: [API keys](https://supabase.com/docs/guides/api/api-keys), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless). Heroku: [Node.js support](https://devcenter.heroku.com/articles/nodejs-support).
