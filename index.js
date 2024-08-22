const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const { sendMessage } = require("./predict");
require("dotenv").config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_KEY;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const app = express();
const PORT = process.env.PORT || 4040;

// Handle the /eligibility command
bot.onText(/\/eligibility (.+)/, async (msg, match) => {
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
