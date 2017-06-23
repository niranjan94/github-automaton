import setupConfig from './config'
import express from 'express';
import bodyParser from 'body-parser'
import winston from 'winston-color'
import handler from './handler'

setupConfig();
const app = express();

app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.set('Content-Type', 'text/plain');
    if (process.env.USER_AGENT) {
        res.set('User-Agent', process.env.USER_AGENT);
    }
    next()
});

app.get('/', function (req, res) {
    res.send('ok')
});

app.get('/ping', function (req, res) {
    res.send('pong')
});

app.post('/events', function (req, res) {
    const signature = req.get('X-Hub-Signature');
    const type = req.get('X-GitHub-Event');
    handler(signature, req.body, type);
    res.send('ok')
});

const listenPort = parseInt(process.env.PORT || 3000);

app.listen(listenPort, function () {
    winston.info(`Bot listening on ${listenPort} !`);
});