import express from "express";

const app = express();
app.use(express.urlencoded({ extended: false }));

let queue = [];

function reply(res, text) {
  res.set("Content-Type", "text/xml");
  res.send(`<Response><Message>${text}</Message></Response>`);
}

app.post("/incoming", (req, res) => {
  const text = req.body.Body?.trim();
  if (!text) return res.sendStatus(200);

  // !queue — show all queued messages
  if (text.toLowerCase() === "!queue") {
    if (queue.length === 0) return reply(res, "Queue is empty.");
    const list = queue.map((msg, i) => `${i + 1}. ${msg}`).join("\n");
    return reply(res, `Queue (${queue.length}):\n${list}`);
  }

  // !delete <number> — delete a specific entry
  const deleteMatch = text.match(/^!delete\s+(\d+)$/i);
  if (deleteMatch) {
    const index = parseInt(deleteMatch[1]) - 1;
    if (index < 0 || index >= queue.length) {
      return reply(res, `Invalid number. Queue has ${queue.length} item(s).`);
    }
    const removed = queue.splice(index, 1)[0];
    return reply(res, `Deleted #${index + 1}: "${removed}"\nQueue now has ${queue.length} item(s).`);
  }

  // Otherwise treat it as a new message
  queue.push(text);
  return reply(res, `Got it! Added to queue at position ${queue.length}.\nSend !queue to see all queued messages.`);
});

app.get("/message", (req, res) => {
  const message = queue.length > 0 ? queue.shift() : null;
  res.json({ message });
});

app.listen(3000, () => console.log("Server running on port 3000"));
