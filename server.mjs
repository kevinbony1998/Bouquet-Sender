import express from "express";

const app = express();
app.use(express.urlencoded({ extended: false }));

let customMessage = null;

app.post("/incoming", (req, res) => {
  const text = req.body.Body?.trim();

  if (text) {
    customMessage = text;
    console.log("Custom message saved:", customMessage);
    res.set("Content-Type", "text/xml");
    res.send(`<Response><Message>Got it! I'll use this message for the next bouquet: "${text}"</Message></Response>`);
  } else {
    res.sendStatus(200);
  }
});

app.get("/message", (req, res) => {
  res.json({ message: customMessage });
  customMessage = null;
});

app.listen(3000, () => console.log("Server running on port 3000"));

app.get("/ping", (req, res) => res.send("pong"));
