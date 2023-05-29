'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf } = format;
const config = require('config');

const myFormat = printf(info => {
    return `${info.timestamp} ${info.level}: ${info.message}`
});

module.exports = createLogger({
    level: config.get('log.level'),
    format: combine(
        timestamp(),
        colorize(),
        myFormat
    ),
    transports: [
        new transports.Console(),
    ]
});