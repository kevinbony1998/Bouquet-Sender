import express from "express";

const app = express();
app.use(express.urlencoded({ extended: false }));

let queue = [];

const HELP = `\nCommands:\n!queue — see all queued messages\n!delete <number> — delete a specific message`;

function reply(res, text) {
  res.set("Content-Type", "text/xml");
  res.send(`<Response><Message>${text}</Message></Response>`);
}

app.post("/incoming", (req, res) => {
  const text = req.body.Body?.trim();
  if (!text) return res.sendStatus(200);

  const lower = text.toLowerCase();

  // !queue — show all queued messages
  if (lower === "!queue") {
    if (queue.length === 0) return reply(res, `Queue is empty.${HELP}`);
    const list = queue.map((msg, i) => `${i + 1}. ${msg}`).join("\n");
    return reply(res, `Queue (${queue.length}):\n${list}${HELP}`);
  }

  // !delete <number> — delete a specific entry
  const deleteMatch = text.match(/^!delete\s+(\d+)$/i);
  if (deleteMatch) {
    const index = parseInt(deleteMatch[1]) - 1;
    if (index < 0 || index >= queue.length) {
      return reply(res, `Invalid number. Queue has ${queue.length} item(s).${HELP}`);
    }
    const removed = queue.splice(index, 1)[0];
    return reply(res, `Deleted #${index + 1}: "${removed}"\nQueue now has ${queue.length} item(s).${HELP}`);
  }

  // --- Suggestions for common mistakes ---

  // "queue" or "show queue" without "!"
  if (lower === "queue" || lower === "show queue" || lower === "list" || lower === "show" || lower === "list queue") {
    return reply(res, `Did you mean "!queue"?${HELP}`);
  }

  // "delete <number>" without "!"
  const deleteMissingBang = text.match(/^delete\s+(\d+)$/i);
  if (deleteMissingBang) {
    return reply(res, `Did you mean "!delete ${deleteMissingBang[1]}"?${HELP}`);
  }

  // "!delete" without a number
  if (lower === "!delete") {
    return reply(res, `Please specify a number, e.g. "!delete 2".${HELP}`);
  }

  // "delete" without a number or "!"
  if (lower === "delete" || lower === "remove") {
    return reply(res, `Did you mean "!delete <number>"? e.g. "!delete 2".${HELP}`);
  }

  // "!delete <number>" with extra text after the number
  const deleteExtraText = text.match(/^!delete\s+(\d+)\s+.+$/i);
  if (deleteExtraText) {
    return reply(res, `Did you mean "!delete ${deleteExtraText[1]}"?${HELP}`);
  }

  // "remove <number>" instead of "!delete <number>"
  const removeSuggestion = text.match(/^remove\s+(\d+)$/i);
  if (removeSuggestion) {
    return reply(res, `Did you mean "!delete ${removeSuggestion[1]}"?${HELP}`);
  }

  // "clear" or "clear queue" — no longer supported, suggest !delete
  if (lower === "clear" || lower === "clear queue" || lower === "reset" || lower === "reset queue") {
    return reply(res, `There's no clear command. To remove a specific message, use "!delete <number>".\nSend "!queue" to see what's in the queue.${HELP}`);
  }

  // Otherwise treat it as a new message
  queue.push(text);
  return reply(res, `Got it! Added to queue at position ${queue.length}.\n\nQueue (${queue.length}):\n${queue.map((msg, i) => `${i + 1}. ${msg}`).join("\n")}${HELP}`);
});

app.get("/message", (req, res) => {
  const message = queue.length > 0 ? queue.shift() : null;
  res.json({ message });
});

app.listen(3000, () => console.log("Server running on port 3000"));
