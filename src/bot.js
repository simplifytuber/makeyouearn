const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const port = 8080;
app.listen(port, () => {
  console.log(Server running at http://localhost:${port});
});

// Retrieve the Telegram bot token from the environment variable
const botToken = process.env.TELEGRAM_BOT_TOKEN;

// Create the Telegram bot instance
const bot = new TelegramBot(botToken, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'User';

  const welcomeMessage = 😇 *Hello, ${username}!* 

🔗 *Welcome to the APNA URL Shortener Bot!*
Easily shorten URLs using [ApnaURL](https://apnaurl.in). Just send a link, and I'll shorten it for you. 🚀

⚙️ *How to Use:*
1️⃣ [Register on ApnaURL](https://apnaurl.in)
2️⃣ Copy your API key from [here](https://apnaurl.in/member/tools/api)
3️⃣ Set your API key using:
   \/setapi YOUR_APNAURL_API_TOKEN\
4️⃣ Send any link, and I’ll shorten it! 🔥

⚠️ _Make sure your links start with_ \https://\ _or_ \http://\

📌 Made with ❤️ by: @apnaurl;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Handle /setapi command
bot.onText(/\/setapi (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userToken = match[1].trim();

  // Save the user's AdlinkFly API token
  saveUserToken(chatId, userToken);

  bot.sendMessage(chatId, ✅ *Your APNAURL API token has been set successfully!*\n🔑 *Token:* \${userToken}\``, { parse_mode: 'Markdown' });
});

// Handle URL shortening
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  
  if (msg.text || msg.caption) {
    const text = msg.text || msg.caption;
    const links = extractLinks(text);

    if (links.length > 0) {
      const shortenedLinks = await shortenMultipleLinks(chatId, links);
      const updatedText = replaceLinksInText(text, links, shortenedLinks);

      bot.sendMessage(chatId, updatedText, {
        reply_to_message_id: msg.message_id,
      });
    }
  }
});

// Admin Broadcast Command
const adminChatId = 1234567890; // Replace with your Telegram user ID

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  if (chatId.toString() !== adminChatId.toString()) {
    bot.sendMessage(chatId, "❌ *You are not authorized to use this command!*", { parse_mode: 'Markdown' });
    return;
  }

  const message = match[1];
  const dbData = getDatabaseData();

  Object.keys(dbData).forEach((userId) => {
    bot.sendMessage(userId, 📢 *Broadcast Message:*\n\n${message}, { parse_mode: 'Markdown' });
  });

  bot.sendMessage(chatId, "✅ *Broadcast sent successfully!*", { parse_mode: 'Markdown' });
});

// Utility Functions

function extractLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})([^\s]*)/g;
  return [...text.matchAll(urlRegex)].map(match => match[0]);
}

function replaceLinksInText(text, originalLinks, shortenedLinks) {
  let updatedText = text;
  originalLinks.forEach((link, index) => {
    updatedText = updatedText.replace(link, shortenedLinks[index]);
  });
  return updatedText;
}

async function shortenMultipleLinks(chatId, links) {
  const shortenedLinks = [];
  for (const link of links) {
    const shortenedLink = await shortenUrl(chatId, link);
    shortenedLinks.push(shortenedLink || link);
  }
  return shortenedLinks;
}

async function shortenUrl(chatId, url) {
  const adlinkflyToken = getUserToken(chatId);

  if (!adlinkflyToken) {
    bot.sendMessage(chatId, '⚠️ *Please set up your APNAURL API token first!* 🔑\nUse:\n/setapi YOUR_APNAURL_API_TOKEN', { parse_mode: 'Markdown' });
    return null;
  }try {
    const apiUrl = https://apnaurl.in/api?api=${adlinkflyToken}&url=${encodeURIComponent(url)};
    const response = await axios.get(apiUrl);
    return response.data.shortenedUrl;
  } catch (error) {
    console.error('Shorten URL Error:', error);
    return null;
  }
}

function saveUserToken(chatId, token) {
  const dbData = getDatabaseData();
  dbData[chatId] = token;
  fs.writeFileSync('./src/database.json', JSON.stringify(dbData, null, 2));
}

function getUserToken(chatId) {
  const dbData = getDatabaseData();
  return dbData[chatId];
}

function getDatabaseData() {
  try {
    return JSON.parse(fs.readFileSync('./src/database.json', 'utf8'));
  } catch (error) {
    return {};
  }
}
