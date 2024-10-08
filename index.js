const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const { sendMessage } = require("./predict");
const http = require("http");
require("dotenv").config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_KEY;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const app = express();
const PORT = process.env.PORT || 4040;

// Using a Free tier at the moment, that  every 50 seconds, this manually pings the server every 30 seconds to ensure it's still up
setInterval(() => {
  http
    .get(`http://localhost:${PORT}`, (res) => {
      console.log(`Pinged the server - Status Code: ${res.statusCode}`);
    })
    .on("error", (e) => {
      console.error(`Error pinging the server: ${e.message}`);
    });
}, 30000);

// Handle the /eligibility command
bot.onText(/\/review (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const projectDescription = match[1]; // Extract the project description from the command

  try {
    // Call the eligibility evaluation function
    const response = await sendMessage(projectDescription);

    // Send the response back to the group
    bot.sendMessage(chatId, response);
  } catch (error) {
    console.error("Error evaluating eligibility:", error);
    bot.sendMessage(chatId, "An error occurred while processing your request.");
  }
});

let expectingDescription = false;

bot.onText(/\/review/, async (msg) => {
  const chatId = msg.chat.id;
  expectingDescription = true;
  bot.sendMessage(chatId, "Please enter your project description:");
});

bot.on("message", async (msg) => {
  if (expectingDescription) {
    const chatId = msg.chat.id;
    const projectDescription = msg.text;
    // Call the review function with the project description
    try {
      const response = await sendMessage(projectDescription);
      bot.sendMessage(chatId, response);
    } catch (error) {
      console.error("Error reviewing project:", error);
      bot.sendMessage(
        chatId,
        "An error occurred while processing your request."
      );
    } finally {
      expectingDescription = false;
    }
  }
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const startMessage = `Welcome to AI-PGF BOT! This bot is designed to check your project Eligibility status and Provide Reasons.\n\nAvailable commands:\n/review - Followed by the description of your project to review your project`;
  bot.sendMessage(chatId, startMessage);
});

bot.onText(/\/(?!review|start)\w*/, async (msg) => {
  if (expectingDescription) return;
  const chatId = msg.chat.id;
  const unknownCommandMessage = `Sorry, I didn't understand that command. Available commands:\n/review - Review a project\n/start - Set of instructions to get started`;
  bot.sendMessage(chatId, unknownCommandMessage);
});
// Express POST route to handle Telegram webhook updates
app.post("/", express.json(), async (req, res) => {
  try {
    const update = req.body;

    // Process the update using the bot
    bot.processUpdate(update);

    // Respond with a 200 status to acknowledge receipt of the update
    res.status(200).send("OK");
  } catch (err) {
    console.error("Error processing request:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Handle errors for methods other than POST
app.all("/", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
