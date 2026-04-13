const SUPABASE_URL = "https://mfpgiwrnekanudelowcy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcGdpd3JuZWthbnVkZWxvd2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzUxMTIsImV4cCI6MjA2OTYxMTExMn0.AEJkTniZT97oWpg32rANC32AeJKLEZ6DUOunfOBOX2o";

function generateShortId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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

// --- Configure your bouquet here ---
const shareUrl = await createBouquet({
  flowers: [{ id: 2, count: 7 }],
  flowerOrder: [6, 5, 4, 0, 2, 1, 3],
  greenery: 0,
  sender: "Alice",
  recipient: "Kevin",
  message: "Thinking of you!"
});

console.log("Bouquet created:", shareUrl);
