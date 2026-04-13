const SUPABASE_URL = "https://mfpgiwrnekanudelowcy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcGdpd3JuZWthbnVkZWxvd2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzUxMTIsImV4cCI6MjA2OTYxMTExMn0.AEJkTniZT97oWpg32rANC32AeJKLEZ6DUOunfOBOX2o";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM        = "whatsapp:+14155238886";
const TWILIO_TO          = process.env.TWILIO_TO;
const SERVER_URL         = process.env.SERVER_URL;

const DEFAULT_MESSAGE    = "Remember to eat on time!";

function generateShortId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function getCustomMessage() {
  try {
    const res = await fetch(`${SERVER_URL}/message`);
    const { message } = await res.json();
    return message || DEFAULT_MESSAGE;
  } catch {
    return DEFAULT_MESSAGE;
  }
}

async function createBouquet({ flowers, flowerOrder, greenery = 0, sender = "", recipient = "", message = "" }) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/bouquets`);
  url.searchParams.set("columns", '"short_id","mode","flowers","letter","timestamp","greenery","flowerOrder"');
  url.searchParams.set("select", "*");

  const payload = [{
    short_id: generateShortId(),
    mode: "color",
    flowers,
    letter: { sender, recipient, message },
    timestamp: Date.now(),
    greenery,
    flowerOrder
  }];

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "accept": "*/*",
      "apikey": SUPABASE_KEY,
      "authorization": `Bearer ${SUPABASE_KEY}`,
      "content-type": "application/json",
      "content-profile": "public",
      "prefer": "return=representation",
      "x-client-info": "supabase-js-web/2.95.3",
      "origin": "https://digibouquet.vercel.app",
      "referer": "https://digibouquet.vercel.app/"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

  const [bouquet] = await response.json();
  return `https://digibouquet.vercel.app/bouquet/${bouquet.id}`;
}

async function sendWhatsApp(body) {
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      From: TWILIO_FROM,
      To:   TWILIO_TO,
      Body: body
    })
  });

  if (!response.ok) throw new Error(`Twilio error: ${await response.text()}`);
  console.log("WhatsApp message sent!");
}

const message  = await getCustomMessage();
const shareUrl = await createBouquet({
  flowers: [{ id: 2, count: 7 }],
  flowerOrder: [6, 5, 4, 0, 2, 1, 3],
  greenery: 0,
  sender: "Walter Mitty",
  recipient: "Sreelu",
  message
});

console.log("Bouquet created:", shareUrl);
await sendWhatsApp(`🌸 Your bouquet is ready!\n\n${shareUrl}`);
