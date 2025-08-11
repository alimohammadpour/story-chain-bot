import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { getStartingResponse, getTwistResponse } from './googleGenAIHandler.js';

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.setMyCommands([
  { command: 'start', description: 'Start a new story' },
  { command: 'twist', description: 'Add a plot twist' },
  { command: 'end', description: 'End and show the story' },
  { command: 'add', description: 'Add your line'}
]);

const stories = {};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  if (stories[chatId]?.active) {
    return await bot.sendMessage(chatId, "📖 A story is already in progress. Use /end to finish it.");
  }

  const startingLine = await getStartingResponse();
  stories[chatId] = {
    active: true,
    text: [startingLine],
    lastAuthorId: null,
    repeatCount: 0
  };

  await bot.sendMessage(chatId, `📖 New story started!\n\n${startingLine}`);
  await bot.sendMessage(chatId, "Add your next line to continue the story. Use the /add command followrd by your desired plot! Keep it short!");
});

bot.onText(/\/add (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const storyLine = match[1].trim();

  const MAX_WORDS = 20;
  if (storyLine.split(/\s+/).length > MAX_WORDS) {
    return await bot.sendMessage(chatId, `${msg.from.first_name}, your message is too long. Please limit it to ${MAX_WORDS} words.`);
  }

  if (!stories[chatId]?.active) {
    return await bot.sendMessage(chatId, "There's no active story. Use /start to begin a new one.");
  }

  const story = stories[chatId];
  if (story.lastAuthorId === userId) {
    story.repeatCount += 1;

    if (story.repeatCount > 2) {
      return await bot.sendMessage(chatId, `Hey ${msg.from.first_name}, you've already added two plots. Wait for someone else or use /twist.`);
    }
  } else {
    story.lastAuthorId = userId;
    story.repeatCount = 1;
  }

  story.text.push(storyLine);
});

bot.onText(/\/twist/, async (msg) => {
  const chatId = msg.chat.id;

  if (!stories[chatId]?.active) {
    return await bot.sendMessage(chatId, "No story is currently in progress. Use /start to begin.");
  }

  const twist = await getTwistResponse(stories[chatId].text.join(' '));
  stories[chatId].text.push(twist);

  stories[chatId].lastAuthorId = msg.from.id;
  stories[chatId].repeatCount = 0;

  await bot.sendMessage(chatId, `Plot twist: ${twist}`);
});

bot.onText(/\/end/, async ({ chat: { id } }) => {
  if (!stories[id]?.active) {
    return await bot.sendMessage(id, "No story is currently in progress.");
  }

  const fullStory = stories[id].text.join(" ");
  stories[id].active = false;

  await bot.sendMessage(id, `📚 Here's your complete story:\n\n${fullStory}`);
});
