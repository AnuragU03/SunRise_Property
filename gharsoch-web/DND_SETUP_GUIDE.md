# DND Scrubbing Setup Guide

## How to Get Your Free RapidAPI Key

### Step 1: Sign Up (Free Account)
1. Go to **https://rapidapi.com**
2. Click **Sign Up** (top right)
3. Create a free account using:
   - Email address
   - Password
   - Or sign up with Google/GitHub

### Step 2: Subscribe to Free DND India API
1. After logging in, go to: **https://rapidapi.com/rajr/api/free-dnd-india**
2. Click the **Subscribe** button (usually on the right side)
3. Select the **Free Plan** (default, 100 requests/day)
4. Click **Subscribe to this API**

### Step 3: Find Your API Key
1. Once subscribed, go to your **Dashboard** (top right menu)
2. In the left sidebar, look for **Apps** or **My Apps**
3. Select your application (or the default one)
4. Look for the **API Key** section (usually shows `X-RapidAPI-Key`)
5. Copy the long string that looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 4: Add to Your .env File
1. Open your `.env` file (in the project root)
2. Find the line:
   ```
   DND_RAPIDAPI_KEY=
   ```
3. Paste your API key:
   ```
   DND_RAPIDAPI_KEY=your-copied-api-key-here
   ```
4. Save the file

### Step 5: Restart Your App
```bash
# Stop the running dev server (Ctrl+C)
# Then restart:
npm run dev
```

---

## What's Included in Your Free Account

- **100 API calls per day** (free tier)
- Real-time DND status checks
- No credit card required
- Can upgrade to higher tier if needed

---

## How It Works in Your App

Once configured, every outbound call will:

1. Check if the number is already flagged as DND locally (instant)
2. If not found locally, query RapidAPI to check India's NCPR registry in real-time
3. Block the call if DND is confirmed
4. Log the DND status for audit trail

**Without the API key:** Only local database checks run (still TRAI-compliant, just not real-time)

---

## Troubleshooting

### "DND_RAPIDAPI_KEY not configured"
- Make sure you've added the key to `.env`
- Restart the dev server after editing `.env`
- Double-check the key is copied completely (no extra spaces)

### "HTTP 429 - Too Many Requests"
- You've exceeded 100 calls/day on the free tier
- Wait until next day or upgrade your plan on RapidAPI

### "HTTP 401 - Unauthorized"
- Your API key is incorrect or expired
- Re-copy the key from your RapidAPI dashboard

---

## RapidAPI Dashboard Reference

**Location of API Key:**
1. Login to https://rapidapi.com
2. Click your **Avatar** (top right) → **Dashboard**
3. Go to **Apps** section (left sidebar)
4. Select your app
5. The **X-RapidAPI-Key** is shown in the code snippets section

---

## Security Note

- Never commit `.env` to git — it contains your API key
- The `.env` file is already listed in `.gitignore`
- Keep your API key private; don't share it in public repositories
