const tg = require('../libs/tg');
const weather = require('../libs/weather');
const log = require('../libs/log');
const moment = require('moment');

const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    log.debug(JSON.stringify(req.body));

    if (req.body.message) {
        let userId = req.body.message.chat.id;
        let userText = req.body.message.text;
        let userLocation = req.body.message.location;

        if (userText === '/start') {
            await tg.sendMessage(userId, helloMessage, helloKeyboard);
        }
        else if (userText === 'Узнать погоду⛈') {
            await tg.sendMessage(userId, cityMessage, helloKeyboard);
        }
        else if (userText === 'Прогноз👩🏽‍💻') {
            await tg.sendMessage(userId, forecastMessage, helloKeyboard);
        }
        else if (userLocation) {
            let weatherData = await weather.getWeather(userLocation.latitude, userLocation.longitude);

            if (!weatherData) {
                await tg.sendMessage(userId, errorMessage);
                res.sendStatus(200);
                return;
            }

            await tg.sendMessage(userId, getWeatherMessage(weatherData.data), helloKeyboard);
        }
        else if (userText.toLowerCase().includes('прогноз')) {
            let forecastCities = await weather.getCoordinates(userText.toLowerCase().replace(/(прогноз:)/g, ''));

            if (!forecastCities) {
                await tg.sendMessage(userId, errorMessage, helloKeyboard);
                res.sendStatus(200);
                return;
            }

            if (forecastCities.data.length === 0) {
                await tg.sendMessage(userId, clarifyMessage, helloKeyboard);
                res.sendStatus(200);
                return;
            }

            for (let city of forecastCities.data) {
                await tg.sendMessage(
                    userId,
                    `Название: ${city.name}\nСтрана: ${city.country}`,
                    false,
                    false,
                    [
                        [{text: `Выбрать этот пункт`, callback_data: `${city.lat}/${city.lon}/пр`}],
                        [{text: 'Это не он❌', callback_data: 'Отмена'}]
                    ]
                );
                await tg.sendLocation(userId, city.lat, city.lon);
            }
        }
        else if (userText) {
            let cities = await weather.getCoordinates(userText);

            if (!cities) {
                await tg.sendMessage(userId, errorMessage, helloKeyboard);
                res.sendStatus(200);
                return;
            }

            if (cities.data.length === 0) {
                await tg.sendMessage(userId, clarifyMessage, helloKeyboard);
                res.sendStatus(200);
                return;
            }

            for (let city of cities.data) {
                await tg.sendMessage(
                    userId,
                    `Название: ${city.name}\nСтрана: ${city.country}`,
                    false,
                    false,
                    [
                        [{text: `Выбрать этот пункт`, callback_data: `${city.lat}/${city.lon}`}],
                        [{text: 'Это не он❌', callback_data: 'Отмена'}]
                    ]
                );
                await tg.sendLocation(userId, city.lat, city.lon);
            }
        }
    }
    else if (req.body.callback_query) {
        if (!req.body.callback_query.message) {
            res.sendStatus(200);
            return;
        }

        let callback = req.body.callback_query.data;
        let text = req.body.callback_query.message.text.toLowerCase();
        let userId = req.body.callback_query.message.chat.id;
        let messageId = req.body.callback_query.message.message_id;

        let locationString = callback.split('/');
        let promises = [];
        let weatherData = null;

        if (callback === 'Отмена') {
            promises.push(tg.editMessageText(userId, messageId, clarifyMessage, []));
            promises.push(tg.deleteMessage(userId, messageId + 1));
        }
        else if (text.includes('название')) {
            weatherData = locationString.includes('пр') ? await weather.getForecast(locationString[0], locationString[1]) : await weather.getWeather(locationString[0], locationString[1]);

            if (!weatherData) {
                promises.push(tg.editMessageText(userId, messageId, errorMessage, []));
                promises.push(tg.deleteMessage(userId, messageId + 1));
                res.sendStatus(200);
                return;
            }

            promises.push(tg.editMessageText(
                userId,
                messageId,
                locationString.includes('пр') ? getForecastWeatherMessage(weatherData.data) : getWeatherMessage(weatherData.data),
                []
            ));
            promises.push(tg.deleteMessage(userId, messageId + 1));
        }

        await Promise.all(promises);
    }

    res.sendStatus(200);
});

const helloMessage = 'Привет✌ \nЯ, WeatherFreeBot️☀️\n' +
    'Моя миссия помочь тебе быстро узнать погоду где угодно, но только в пределах планеты Земля🌐\n\n' +
    'Также ты можешь очень легко узнать погоду за окном🪟\n' +
    'Воспользуйся моей клавиатурой, либо прикрепи к сообщению геопозицию📍\n\n' +
    'Не стесняйся и сразу пиши название населённого пункта🌆';

const cityMessage = 'Не стесняйся и пиши название населённого пункта🌆';

const forecastMessage = 'Напиши ключевое слово "Прогноз" и название населённого пункта🌆\nПрогноз: город';

const errorMessage = 'Мне не удалось обработать запрос😭\nВ силу ограниченных средств существует ограничение на кол-во запросов💰\nПопробуй позже🥺';

const clarifyMessage = 'Пожалуйста, попробуй уточнить данные в формате: город, страна';

const helloKeyboard = [
    [
        { text: 'Узнать погоду⛈' },
        { text: 'Отправить геопизицию📍', request_location: true}
    ],
    [
        { text: 'Прогноз👩🏽‍💻' }
    ]
];

const getForecastWeatherMessage = (w) => {
    let timezone = w.city.timezone;
    let messageForecast = `<b>${w.city.name}</b>\n`;
    let i = 0;

    for (let listItem of w.list) {
        messageForecast += `${getDate(listItem.dt, timezone)}: <b>${listItem.main.temp.toFixed(2)}&#8451;</b>,` +
            `вер-ть осад. <b>${listItem.pop.toFixed(2) * 100.00}%</b>, ${listItem.weather[0].description}\n`;

        i++;
        if (i === 8) {
            i = 0;

            messageForecast += '\n';
        }
    }

    return messageForecast;
};

const getWeatherMessage = (w) => {
    let messagePrecipitation = '';

    if (w.rain) {
        messagePrecipitation += w.rain['1h'] ? `Объем дождя за последний час: <b>${w.rain['1h'].toFixed(2)}</b> мм\n` : '';
        messagePrecipitation += w.rain['3h'] ? `Объем дождя за последние 3 часа: <b>${w.rain['3h'].toFixed(2)}</b> мм\n` : '';
    }

    if (w.snow) {
        messagePrecipitation += w.snow['1h'] ? `Объем снега за последний час: <b>${w.snow['1h'].toFixed(2)}</b> мм\n` : '';
        messagePrecipitation += w.snow['3h'] ? `Объем снега за последние 3 часа: <b>${w.snow['3h'].toFixed(2)}</b> мм\n` : '';
    }

    return `<b>${w.name}</b>\n` +
        `Температура: <b>${w.main.temp.toFixed(2)}&#8451;</b>\n` +
        `Чувствуется как: <b>${w.main.feels_like.toFixed(2)}&#8451;</b>\n` +
        messagePrecipitation +
        `Влажность: <b>${w.main.humidity.toFixed(2)}%</b>\n` +
        `Облачность: <b>${w.clouds.all.toFixed(2)}%</b>\n` +
        `Видимость: <b>${w.visibility.toFixed(2)}</b> метров\n` +
        `Скорость ветра: <b>${w.wind.speed.toFixed(2)}</b> метров в секунду\n` +
        `Описание: ${w.weather[0].description}\n` +
        `Время заката: ${getDate(w.sys.sunset, w.timezone)}\n` +
        `Страна: ${w.sys.country}`;
};

const getDate = (dt, timezone) => {
    let utc_seconds = parseInt(dt, 10) + parseInt(timezone, 10);
    let utc_milliseconds = utc_seconds * 1000;

    return moment(utc_milliseconds).format('DD.MM.YYYY HH:mm');
}

const DATE_FORMAT = 'DD.MM.YYYY HH:mm';

module.exports = router;