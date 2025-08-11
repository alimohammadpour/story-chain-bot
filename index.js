require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const promptsData = require('./prompts.json');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.setMyCommands([
  { command: 'start', description: 'Start a new story' },
  { command: 'twist', description: 'Add a plot twist' },
  { command: 'end', description: 'End and show the story' },
  { command: 'add', description: 'Add your line'}
]);

const stories = {};

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (stories[chatId]?.active) {
    return bot.sendMessage(chatId, "📖 A story is already in progress. Use /end to finish it.");
  }

  const prompt = randomFromArray(promptsData.prompts);
  stories[chatId] = {
    active: true,
    text: [prompt],
    lastAuthorId: null,
    repeatCount: 0
  };

  bot.sendMessage(chatId, `📖 New story started!\n\n${prompt}`);
  bot.sendMessage(chatId, "Add your next line to continue the story. Use the /add command followrd by your desired plot! Keep it short!");
});

bot.onText(/\/add (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const storyLine = match[1].trim();

  const MAX_WORDS = 20;
  if (storyLine.split(/\s+/).length > MAX_WORDS) {
    return bot.sendMessage(chatId, `${msg.from.first_name}, your message is too long. Please limit it to ${MAX_WORDS} words.`);
  }

  if (!stories[chatId]?.active) {
    return bot.sendMessage(chatId, "There's no active story. Use /start to begin a new one.");
  }

  const story = stories[chatId];
  if (story.lastAuthorId === userId) {
    story.repeatCount += 1;

    if (story.repeatCount > 2) {
      bot.sendMessage(chatId, `Hey ${msg.from.first_name}, you've already added two plots. Wait for someone else or use /twist.`);
      return;
    }
  } else {
    story.lastAuthorId = userId;
    story.repeatCount = 1;
  }

  story.text.push(storyLine);
});

bot.onText(/\/twist/, (msg) => {
  const chatId = msg.chat.id;

  if (!stories[chatId]?.active) {
    return bot.sendMessage(chatId, "No story is currently in progress. Use /start to begin.");
  }

  const twist = randomFromArray(promptsData.twists);
  stories[chatId].text.push(twist);

  stories[chatId].lastAuthorId = msg.from.id;
  stories[chatId].repeatCount = 0;

  bot.sendMessage(chatId, `Plot twist: ${twist}`);
});

bot.onText(/\/end/, (msg) => {
  const chatId = msg.chat.id;

  if (!stories[chatId]?.active) {
    return bot.sendMessage(chatId, "No story is currently in progress.");
  }

  const fullStory = stories[chatId].text.join(" ");
  stories[chatId].active = false;

  bot.sendMessage(chatId, `📚 Here's your complete story:\n\n${fullStory}`);
});
