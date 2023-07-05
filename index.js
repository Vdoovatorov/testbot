const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
let users = [];

bot.start((ctx) => {
    ctx.reply('Добро пожаловать! Пожалуйста, введите свое имя:', Markup.forceReply());
});

bot.on('text', (ctx) => {
    let user = users.find(u => u.id === ctx.from.id);
    if (!user) {
        user = { id: ctx.from.id };
        users.push(user);
    }
    if (!user.name) {
        user.name = ctx.message.text;
        ctx.reply(`Привет, ${user.name}! Пожалуйста, укажите свой пол:`, Markup.keyboard(['Мужской', 'Женский']).oneTime().resize());
    } else if (!user.gender) {
        user.gender = ctx.message.text;
        ctx.reply(`Спасибо, ${user.name}! Теперь укажите свой возраст:`, Markup.forceReply());
    } else if (!user.age) {
        user.age = parseInt(ctx.message.text);
        if (user.age < 16 || user.age > 90) {
            ctx.reply('Извините, но вы должны быть старше 16 лет и младше 90 лет, чтобы использовать этот бот.');
            users = users.filter(u => u.id !== ctx.from.id);
        } else {
            ctx.reply(`Отлично, ${user.name}! Вы можете найти собеседника, используя кнопки ниже:`, Markup.keyboard([
                ['Найти мужчину', 'Найти женщину'],
                ['Найти кого-то моего возраста', 'Найти кого-то младше меня', 'Найти кого-то старше меня'],
                ['Остановить поиск']
            ]).resize());
        }
    } else if (!user.partnerId) {
        let partner;
        switch (ctx.message.text) {
            case 'Найти мужчину':
                partner = users.find(u => u.gender === 'Мужской' && u.id !== ctx.from.id && !u.partnerId);
                break;
            case 'Найти женщину':
                partner = users.find(u => u.gender === 'Женский' && u.id !== ctx.from.id && !u.partnerId);
                break;
            case 'Найти кого-то моего возраста':
                partner = users.find(u => u.age === user.age && u.id !== ctx.from.id && !u.partnerId);
                break;
            case 'Найти кого-то младше меня':
                partner = users.find(u => u.age < user.age && u.id !== ctx.from.id && !u.partnerId);
                break;
            case 'Найти кого-то старше меня':
                partner = users.find(u => u.age > user.age && u.id !== ctx.from.id && !u.partnerId);
                break;
            case 'Остановить поиск':
                ctx.reply('Вы остановили поиск. Вы можете начать новый поиск в любое время, используя кнопки ниже:', Markup.keyboard([
                    ['Найти мужчину', 'Найти женщину'],
                    ['Найти кого-то моего возраста', 'Найти кого-то младше меня', 'Найти кого-то старше меня'],
                    ['Остановить поиск']
                ]).resize());
                return;
        }
        if (partner) {
            user.partnerId = partner.id;
            partner.partnerId = user.id;
            ctx.reply(`Вы нашли собеседника! Его имя ${partner.name}, пол ${partner.gender}, возраст ${partner.age}. Начните общение!`, Markup.keyboard([
                ['Завершить чат']
            ]).resize());
            bot.telegram.sendMessage(partner.id, `Вы нашли собеседника! Его имя ${user.name}, пол ${user.gender}, возраст ${user.age}. Начните общение!`, Markup.keyboard([
                ['Завершить чат']
            ]).resize());
        } else {
            ctx.reply('Извините, но мы не смогли найти подходящего собеседника. Попробуйте еще раз позже.');
        }
    } else {
        let partner = users.find(u => u.id === user.partnerId);
        if (ctx.message.text === 'Завершить чат') {
            ctx.reply(`Вы завершили чат с ${partner.name}. Вы можете начать новый поиск, используя кнопки ниже:`, Markup.keyboard([
                ['Найти мужчину', 'Найти женщину'],
                ['Найти кого-то моего возраста', 'Найти кого-то младше меня', 'Найти кого-то старше меня'],
                ['Остановить поиск']
            ]).resize());
            bot.telegram.sendMessage(partner.id, `${user.name} завершил чат с вами. Вы можете начать новый поиск, используя кнопки ниже:`, Markup.keyboard([
                ['Найти мужчину', 'Найти женщину'],
                ['Найти кого-то моего возраста', 'Найти кого-то младше меня', 'Найти кого-то старше меня'],
                ['Остановить поиск']
            ]).resize());
            user.partnerId = null;
            partner.partnerId = null;
        } else {
            bot.telegram.sendMessage(partner.id, ctx.message.text);
        }
    }
});

bot.on('voice', (ctx) => {
    let user = users.find(u => u.id === ctx.from.id);
    if (user && user.partnerId) {
        let partner = users.find(u => u.id === user.partnerId);
        bot.telegram.sendVoice(partner.id, ctx.message.voice.file_id);
    }
});

bot.on('photo', (ctx) => {
    let user = users.find(u => u.id === ctx.from.id);
    if (user && user.partnerId) {
        let partner = users.find(u => u.id === user.partnerId);
        bot.telegram.sendPhoto(partner.id, ctx.message.photo[0].file_id);
    }
});

bot.on('video', (ctx) => {
    let user = users.find(u => u.id === ctx.from.id);
    if (user && user.partnerId) {
        let partner = users.find(u => u.id === user.partnerId);
        bot.telegram.sendVideo(partner.id, ctx.message.video.file_id);
    }
});

bot.launch();
