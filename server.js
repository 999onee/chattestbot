require('dotenv').config();
const tmi = require('tmi.js');

// --- Markov Chain Engine ---
const chain = {};

function learn(text) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return;
  for (let i = 0; i < words.length - 1; i++) {
    const key = words[i].toLowerCase();
    if (!chain[key]) chain[key] = [];
    chain[key].push(words[i + 1]);
  }
}

function generate(maxWords = 20) {
  const keys = Object.keys(chain);
  if (keys.length === 0) return "I haven't learned anything yet!";
  let word = keys[Math.floor(Math.random() * keys.length)];
  const result = [word];
  for (let i = 0; i < maxWords; i++) {
    const next = chain[word.toLowerCase()];
    if (!next || next.length === 0) break;
    word = next[Math.floor(Math.random() * next.length)];
    result.push(word);
  }
  return result.join(' ');
}

// --- Twitch Client ---
const client = new tmi.Client({
  connection: { reconnect: true, secure: true },
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL],
});

client.connect();

client.on('message', (channel, context, message, self) => {
  if (self) return; // Ignore the bot's own messages

  const isBot = context.username.toLowerCase() === process.env.TWITCH_BOT_USERNAME.toLowerCase();
  if (!isBot) learn(message); // Learn from every human message

  if (message.toLowerCase().trim() === '!onei') {
    const sentence = generate();
    client.say(channel, `@${context.username} → ${sentence}`);
  }
});

console.log('Bot is running...');
