const fs = require('fs');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token
const BOT_TOKEN = "YOUR_BOT_TOKEN";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Replace with your Telegram User ID for admin access to /broadcast
const ADMIN_ID = YOUR_TELEGRAM_USER_ID; // Example: 123456789

/**
 * 🎉 Handles the /start command.
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    😇 *Hello, ${msg.chat.first_name}!*\n\n +
    🎉 *Welcome to the APNA URL Shortener Bot!* 🎉\n +
    🔗 Easily shorten your URLs using *[APNAURL.in](https://apnaurl.in)* API service.\n\n +

    ✨ *How to Use?* 👇\n +
    ✅ 1. Visit [APNAURL.in](https://apnaurl.in) and register.\n +
    ✅ 2. Copy your *API Key* from: [API Page](https://apnaurl.in/member/tools/api).\n +
    ✅ 3. Set up your API using:\n\/setapi YOUR_API_KEY\\n\n +

    📌 *Example:*\n\/setapi 7ac758689ab3932d4937888ebd5a37111011a944\\n\n +

    ⚠️ *Important:* Your URLs must start with *https://* or *http://* for successful shortening.\n\n +

    ❤️ *Made with love by:* [@ApnaURL](https://t.me/apnaurl_support),
    {
      parse_mode: "Markdown",
      disable_web_page_preview: true
    }
  );
});

/**
 * 📌 Shortens a single URL using the user's AdlinkFly API token.
 */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands
  if (text.startsWith('/')) return;

  // Retrieve user API token
  const adlinkflyToken = getUserToken(chatId);

  if (!adlinkflyToken) {
    bot.sendMessage(
      chatId,
      ⚠️ *API Token Not Set!*\n\n +
      🔑 Please set up your *APNAURL API token* first.\n\n +
      🛠 Use the command:\n\/setapi YOUR_APNAURL_API_TOKEN\``
    );
    return;
  }

  try {
    const apiUrl = https://apnaurl.in/api?api=${adlinkflyToken}&url=${encodeURIComponent(text)};
    const response = await axios.get(apiUrl);

    if (response.data.shortenedUrl) {
      bot.sendMessage(chatId, 🔗 *Shortened URL:* ${response.data.shortenedUrl});
    } else {
      bot.sendMessage(chatId, ❌ *Error:* Unable to shorten the URL.);
    }
  } catch (error) {
    console.error('🚨 Shorten URL Error:', error);
    bot.sendMessage(chatId, ❌ *Error:* Something went wrong. Please try again later.);
  }
});

/**
 * 🗂 Saves the user's AdlinkFly API token.
 */
bot.onText(/\/setapi (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const token = match[1];

  saveUserToken(chatId, token);
  bot.sendMessage(chatId, ✅ *API Token Saved Successfully!*);
});

/**
 * 🔍 Retrieves the stored API token for a user.
 */
function getUserToken(chatId) {
  const dbData = getDatabaseData();
  return dbData[chatId];
}

/**
 * 📂 Reads and returns the database content.
 */
function getDatabaseData() {
  try {
    return JSON.parse(fs.readFileSync('./src/database.json', 'utf8'));
  } catch (error) {
    return {}; // Return an empty object if the file is missing or invalid
  }
}

/**
 * 💾 Saves the user's API token in the database.
 */
function saveUserToken(chatId, token) {
  const dbData = getDatabaseData();
  dbData[chatId] = token;
  fs.writeFileSync('./src/database.json', JSON.stringify(dbData, null, 2));
}

/**
 * 📢 Broadcast Message to All Users (Admin Only).
 */
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  if (chatId !== ADMIN_ID) {
    bot.sendMessage(chatId, "❌ *You are not authorized to use this command!*");
    return;
  }

  const message = match[1];
  const users = Object.keys(getDatabaseData());

  users.forEach((userId) => {
    bot.sendMessage(userId, 📢 *Broadcast Message:*\n\n${message}, { parse_mode: "Markdown" });
  });

  bot.sendMessage(chatId, "✅ *Broadcast sent successfully!*");
});

console.log("🚀 Bot is running...");
