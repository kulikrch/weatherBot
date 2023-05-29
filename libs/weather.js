const axios = require('axios');
const _ = require('lodash');
const config = require('config');
const log = require('./log');

const appid = config.get('appid');

const wr = axios.create({
    baseURL: 'https://api.openweathermap.org',
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
    }
});

module.exports.getCoordinates = async (q) => {
    let params = {
        q,
        appid,
        limit: 1
    };

    return await wr.get(`/geo/1.0/direct`, { params }).catch(e => {
            log.error(`Error getCoordinates on OpenWeather: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
            return null
        });
};

module.exports.getWeather = async (lat, lon) => {
    let params = {
        lat,
        lon,
        appid,
        units: 'metric',
        lang: 'ru'
    };

    return await wr.get(`/data/2.5/weather`, { params }).catch(e => {
        log.error(`Error getWeather on OpenWeather: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
        return null
    });
};

module.exports.getForecast = async (lat, lon) => {
    let params = {
        lat,
        lon,
        appid,
        cnt: '40',
        units: 'metric',
        lang: 'ru'
    };

    return await wr.get(`/data/2.5/forecast`, { params }).catch(e => {
        log.error(`Error getForecast on OpenWeather: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
        return null
    });
};