# stormworks-bot
# 🤖 Stormworks Security Bot

A powerful **Discord moderation & raid-protection bot** built with **Node.js + discord.js**.
Designed for **anti‑raid, anti‑alt detection, staff moderation, ban votes, and logging**.

---

## ✅ Features

* 🛡️ **Raid Mode** (manual toggle)
* 🚨 **Auto Raid Detection**
* 👶 **Join‑Age Protection**
* 🔍 **Anti‑Alt Detection**
* ⚠️ **Warning System (Database‑Backed)**
* 🗳️ **Ban Votes with Buttons**
* 🔨 **Auto‑Ban on Vote Pass**
* 📋 **Auto Staff Logging**
* ✅ **User Verification**
* 📚 **Interactive /help Menu**
* ☁️ **24/7 Hosting on Render**
* 🌐 **Optional Web Dashboard Sync via Webhooks**

---

## ⚙️ Requirements

* **Node.js v20+**
* **GitHub Account**
* **Discord Bot Token**
* **Render Account**

---

## 📁 Project Setup

### 1️⃣ Install Dependencies

```bash
npm install
```

---

### 2️⃣ Create `.env` File

```env
TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_APPLICATION_ID
GUILD_ID=YOUR_SERVER_ID
STAFF_LOG_CHANNEL_ID=YOUR_LOG_CHANNEL
MIN_ACCOUNT_AGE_DAYS=2
JOIN_RATE_THRESHOLD=8
JOIN_RATE_WINDOW_SECONDS=10
```

⚠️ **Never share your token publicly.**

---

### 3️⃣ Run Locally

```bash
node index.js
```

You should see:

```
✅ Bot online as YourBotName#0000
✅ Slash commands registered
```

---

## ☁️ Deploying on Render (24/7)

1. Push this project to **GitHub**
2. Go to **Render → New Web Service**
3. Connect your GitHub repo
4. Set:

   * **Build Command:** `npm install`
   * **Start Command:** `node index.js`
5. Add all `.env` variables under **Render → Environment**
6. Deploy ✅

---

## 🧠 Commands Summary

| Command     | Description            |
| ----------- | ---------------------- |
| `/help`     | Interactive help panel |
| `/verify`   | Gives verified role    |
| `/warn`     | Warn a user            |
| `/banvote`  | Start a ban vote       |
| `/modlogs`  | View staff logs        |
| `/raidmode` | Toggle raid protection |

---

## 🔒 Security Notes

* Bot **cannot detect IPs** (Discord does not allow this)
* All protection is based on:

  * Join age
  * Join rate
  * Account behavior
* Designed to prevent:

  * Alt spam
  * Join floods
  * Bot raids

---

## 👑 Credits

Built & maintained by **Josiah Gray‑Houchins**
Powered by **discord.js v14**

---

## ✅ Status

✅ Stable
✅ Production‑ready
✅ Safe for public servers

---

If you'd like, I can also:

* ✅ Add a **command list image**
* ✅ Add **badges (online, version, uptime)**
* ✅ Add a **website dashboard README section**
* ✅ Add a **roadmap section**

---

### ✅ Now Answering Your Render Question from Earlier:

You chose the **correct option** earlier:

✅ **Use: `Web Service`**
❌ Do NOT use: Static Site, Cron, Worker

---

If you want, next I can help you:
✅ Create your GitHub repo
✅ Push your files correctly
✅ Connect Render step‑by‑step
✅ Fix any command that still says “Application did not respond”

Just say **“let’s finish Render setup”** and I’ll walk you through it cleanly.

