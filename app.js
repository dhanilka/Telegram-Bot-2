const express = require('express');
const app = express();
const port = 5000;

const TelegramBot = require('node-telegram-bot-api');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your own Telegram Bot token
const bot = new TelegramBot('6355483824:AAGwAQzrX9LI81wkEunEvZLIA5H16uytD80', { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the YouTube to MP3 converter bot!');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Check if the message contains a valid YouTube link
  if (ytdl.validateURL(messageText)) {
    let conversionMessageId = null;
    bot.sendMessage(chatId, 'Converting to MP3, please wait...')
      .then((response) => {
        conversionMessageId = response.message_id;
        // Download the YouTube video as MP4
        const videoStream = ytdl(messageText, { quality: 'highestaudio' });
        const videoFile = fs.createWriteStream('video.mp4');
        videoStream.pipe(videoFile);

        let lastMessageId = null;

        videoFile.on('finish', () => {
          // Convert the downloaded video to MP3 using ffmpeg
          const conversionProcess = ffmpeg('video.mp4')
            .outputOptions('-metadata', `title=${msg.from.username}_${Date.now()}`)
            .output('audio.mp3')
            .on('progress', (progress) => {
              // Calculate the conversion progress
              const percentage = Math.floor(progress.percent);
              const progressBar = generateProgressBar(percentage);
              const message = `Converting: ${percentage}% ${progressBar}`;

              // Update the progress message in a single line
              if (lastMessageId) {
                if (lastMessageId.content !== message) {
                  bot.editMessageText(message, { chat_id: chatId, message_id: lastMessageId.message_id })
                    .then((response) => {
                      lastMessageId = response;
                    });
                }
              } else {
                bot.editMessageText(message, { chat_id: chatId, message_id: conversionMessageId })
                  .then((response) => {
                    lastMessageId = response;
                  });
              }
            })
            .on('end', () => {
              // Send the converted MP3 file to the user
              bot.sendAudio(chatId, fs.readFileSync('audio.mp3'), {}, { filename: 'audio.mp3' })
                .then(() => {
                  // Delete the progress message and the conversion message
                  if (lastMessageId) {
                    bot.deleteMessage(chatId, lastMessageId.message_id)
                      .catch((error) => {
                        console.error('Error deleting progress message:', error.message);
                      });
                  }
                  bot.deleteMessage(chatId, conversionMessageId)
                    .catch((error) => {
                      console.error('Error deleting conversion message:', error.message);
                    });
                })
                .catch((error) => {
                  console.error('Error sending audio file:', error.message);
                });
            })
            .run();
        });
      })
      .catch((error) => {
        console.error('Error sending conversion message:', error.message);
      });
  } else {
    bot.sendMessage(chatId, 'Invalid YouTube link!');
  }
});

function generateProgressBar(percentage) {
  const progressBarLength = 20;
  const completed = Math.round(progressBarLength * (percentage / 100));
  const remaining = progressBarLength - completed;

  return `[${'='.repeat(completed)}${' '.repeat(remaining)}]`;
}

app.listen(port, () => console.log(`App listening on port ${port}`));
