# Bouquet Sender

Automatically creates and sends a digital flower bouquet via WhatsApp three times a day. You can also text the Twilio number a custom message before a scheduled run and it'll be included with the bouquet.

### ⚠️ Important: do not click "Update" unless you mean to replace the value

When you click on a secret in GitHub, you'll see an **Update** button. Clicking it opens an input field — if you then click **Save** without typing a new value, GitHub will **overwrite your secret with an empty string**, breaking the workflow silently.

The safe rule: only open a secret if you actually need to change it. If you just want to confirm a secret exists, you can see its name in the list without clicking into it. You cannot read back the value of a secret once it's saved — GitHub intentionally hides it — so there is no way to "view" it, only replace it.

If you accidentally clear a secret, just click Update again and paste the correct value back in.

---

## How it works

### The components

**`bouquet.mjs`** is the main script. Every time it runs it:
1. Fetches a custom message from the server (or falls back to the default "Thinking of you!")
2. Randomly picks 2-4 flower types (IDs 1-12, with IDs 2 and 5 weighted more heavily), with a total flower count between 6-10
3. Randomly generates an arrangement and greenery level
4. Posts the bouquet to Supabase, which returns a unique UUID-based share link
5. Sends the link to your WhatsApp number via Twilio

**`server.mjs`** is a small Express server hosted on Render. It does two things:
- Listens for incoming WhatsApp messages forwarded by Twilio (`POST /incoming`) and stores the latest one in memory
- Serves the stored message to `bouquet.mjs` when requested (`GET /message`), then clears it so the next run falls back to the default

**`.github/workflows/send-bouquet.yml`** is the GitHub Actions workflow. It runs `bouquet.mjs` on a schedule three times a day and also exposes a manual trigger so you can run it on demand.

---

## Flow diagram
You (WhatsApp)
|
| text a custom message
v
Twilio Sandbox
|
| POST /incoming
v
Render Server (server.mjs)
|
| stores message in memory
|
|--- GET /message (when job runs)
v
GitHub Actions (bouquet.mjs)
|
| POST bouquet payload
v
Supabase
|
| returns share URL
v
Twilio
|
| sends WhatsApp message
v
You (WhatsApp) 🌸

---

## Schedule

The workflow runs automatically at these times (EDT, UTC-4):

| Local time | Cron (UTC) |
|---|---|
| 8:00 AM EDT | `0 12 * * *` |
| 12:00 PM EDT | `0 16 * * *` |
| 7:00 PM EDT | `0 23 * * *` |

Note: GitHub Actions cron can run up to 15-30 minutes late during high-traffic periods. This is normal.

When clocks change in November (EST, UTC-5), update the cron times by adding 1 to each hour value. Change them back in March when EDT resumes.

---

## Sending a custom message

1. Text anything to the Twilio sandbox number from your WhatsApp
2. You'll get a reply confirming it was saved
3. The next scheduled run will use your message instead of the default
4. After it's used, the message resets — the run after that will go back to "Thinking of you!"

If you don't send a custom message, every run uses the default.

---

## Testing manually

**Test the server is running:**
Visit `https://your-render-url.onrender.com/message` in your browser. You should see:
```json
{ "message": null }
```

**Test the WhatsApp → server connection:**
Text the Twilio sandbox number. Then visit `/message` again — it should now show your text. If it still shows `null`, check that the Twilio sandbox webhook is set to `https://your-render-url.onrender.com/incoming` with method `HTTP POST`.

**Test the full flow:**
Go to your repo → Actions → Send Bouquet → Run workflow → Run workflow. Watch the logs — you should see:
Bouquet created: https://digibouquet.vercel.app/bouquet/...
WhatsApp message sent!

Then check your WhatsApp for the bouquet link.

**Test the default message fallback:**
Don't text the Twilio number, then trigger the workflow manually. The bouquet message should say "Thinking of you!".

---

## GitHub Secrets

The following secrets are stored in the repo under Settings → Secrets and variables → Actions:

| Secret | What it is |
|---|---|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_TO` | Your WhatsApp number e.g. `whatsapp:+11234567890` |
| `SERVER_URL` | Your Render URL e.g. `https://your-app.onrender.com` |

---

## Repo structure
digibouquet-scheduler/
├── .github/
│   └── workflows/
│       └── send-bouquet.yml   # scheduling and CI
├── bouquet.mjs                # main script
├── server.mjs                 # Express server for custom messages
├── package.json               # marks project as ESM, lists dependencies
└── README.md                  # this file
