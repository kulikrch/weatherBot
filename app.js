const config = require('config');
const express = require('express');
require('express-async-errors'); // Handles async errors in route functions by default express error multipartHandler.

const log = require('./libs/log.js');
const tg = require('./libs/tg.js');

const app = express();
app.use(require('helmet')());
app.disable('x-powered-by')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', require('./routes/index'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next({status: 404, message: "Not found"});
});

// error handler
app.use((err, req, res, next) => {

    log.error(
        `Error ${(err.status || 'unknown error')} URL: ${req.method} ${req.path}
        \t\t\t\t\t message: ${JSON.stringify(err.message)} 
        \t\t\t\t\t body: ${JSON.stringify(req.body || {})}
        \t\t\t\t\t query: ${JSON.stringify(req.query || {})}`
    );

    if(err instanceof Error) {
        res.status(500).send(`Internal error: ${err.message}`);
        return;
    }

    res.status(err.status || 500);
    res.send(err.message);
});

app.listen(config.get('port') || 3000, async () => {
    log.info(`Bot running!`);

    await tg.setWebhook(config.get('url'));
});

module.exports = app;