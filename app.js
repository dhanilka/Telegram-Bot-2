const telegramBot = require("node-telegram-bot-api");

const token = "6202677382:AAE1JNnSFaUAPJZCt3ec0xSjdAWuBNlv4nc";

const bot = new telegramBot(token, { polling: true });

bot.on("message", (message) => {
  let chat_id = message.from.id;
  console.log(message.text);
if(message.text === "/start"){
  bot.sendMessage(chat_id, "Hello, Im chandani");
}else if(message.text === "/send"){
    bot.sendMessage(chat_id, "Message sent");

}else if(message.text === "/audio"){
    bot.sendMessage(chat_id,"Audio sent")
}


else{
    bot.sendMessage(chat_id, "Sorry!, Enter valid command");
}
});
