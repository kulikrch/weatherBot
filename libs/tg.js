const axios = require('axios');
const _ = require('lodash');
const config = require('config');
const log = require('./log');

const token = config.get('token');

const tg = axios.create({
    baseURL: 'https://api.telegram.org',
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
    }
});

module.exports.sendMessage = async (chat_id, text, keyboard, remove_keyboard, inline_keyboard) => {
    if (!chat_id)
        return;

    let stringArray = text.split('\n');
    let i = 0;

    while (i < stringArray.length) {
        let sumLength = 0;
        let currentMessage = "";

        sumLength += stringArray[i].length;

        while (sumLength <= 4096 && i < stringArray.length) {
            sumLength += stringArray[i].length;
            currentMessage += stringArray[i] + '\n';
            ++i;
        }

        let params = {
            chat_id,
            text: currentMessage,
            parse_mode: "HTML",
        };

        if (keyboard)
            params.reply_markup ={
                keyboard
            };

        if (remove_keyboard)
            params.reply_markup = {
                remove_keyboard
            };

        if (inline_keyboard)
            params.reply_markup = {
                inline_keyboard
            };

        try {
            await tg.get(`/bot${token}/sendMessage`, { params });
        }
        catch (e) {
            log.error(`Error sending TG message: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
        }
    }
};

module.exports.editMessageText = async (chat_id, message_id, text, inline_keyboard) => {
    let params = {
        chat_id,
        message_id,
        text,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard
        }
    };

    try {
        await tg.get(`/bot${token}/editMessageText`, { params });
    }
    catch (e) {
        log.error(`Error edit TG message: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
    }
};

module.exports.deleteMessage = async (chat_id, message_id) => {
    try {
        await tg.get(`/bot${token}/deleteMessage`, {
            params: {
                chat_id,
                message_id
            }
        });
    }
    catch (e) {
        log.error(`Error delete TG message: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
    }
};

module.exports.sendLocation = async (chat_id, latitude, longitude) => {
    try {
        await tg.get(`/bot${token}/sendLocation`, {
            params: {
                chat_id,
                latitude,
                longitude
            }
        });
    }
    catch (e) {
        log.error(`Error sending TG location: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
    }
};

module.exports.setWebhook = async (url) => {
    try {
        await tg.get(`/bot${token}/setWebhook`, { params: {url} });
    }
    catch (e) {
        log.error(`Error set webhook TG: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
    }
};