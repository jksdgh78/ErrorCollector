const express = require('express');
const bodyParser = require('body-parser');
const qs = require('querystring');
const axios = require('axios');
const JsonDB = require('node-json-db');
const fs = require('fs');
const dotenv = require('dotenv');
const result = dotenv.config();
const channel = require('./channel');
var crawler = require('./crawler');

const DB = new JsonDB('users', true, false);

const app = express();

/*
 * Parse application/x-www-form-urlencoded && application/json
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('<h2>The Channel Webhook app is running</h2> <p>Follow the' +
  ' instructions in the README to configure the Slack App and your' +
  ' environment variables.</p>');
});

app.get('/img/:name', (req, res) => {
    const file = req.params.name;
    let s = fs.createReadStream('img/' + file);
    s.on('open', function () {
        res.set('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', function () {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
    });
});

/*
 * Endpoint for the app to receive messages.
 * POST requests to this endpoint must have a nonce in the URL that matches
 * the nonce associated with a channel in the datastore.
 */
app.post('/incoming/:channel_nonce', (req, res) => {
  const channelId = channel.findByNonce(req.params.channel_nonce);
  if (channelId) {
    const contype = req.headers['content-type'];
    let body = req.body;
    // Parse the body as JSON if the content type is application/json.
    // Don't do anything for form-urlencoded body types
    if (contype.indexOf('application/json') > 0) { body = JSON.parse(req.body); }

    channel.sendNotification(body, channelId);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.post('/incoming/naver_login', (req, res) => {
  const channelId = channel.findByNonce(req.params.channel_nonce);
  if (channelId) {
    const contype = req.headers['content-type'];
    let body = req.body;
    // Parse the body as JSON if the content type is application/json.
    // Don't do anything for form-urlencoded body types
    if (contype.indexOf('application/json') > 0) { body = JSON.parse(req.body); }

    channel.sendNotification(body, channelId);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

/*
 * Endpoint to receive events from Slack's Events API.
 * Handles:
 *   - url_verification: Returns challenge token sent when present.
 *   - event_callback: Confirm verification token & handle `member_joined_channel` events.
 */
app.post('/events', (req, res) => {
  switch (req.body.type) {
    case 'url_verification': {
      // verify Events API endpoint by returning challenge if present
      res.status(200).send({ challenge: req.body.challenge });
      break;
    }
    case 'event_callback': {
      // verify that the verification token matches what's expected from Slack
      if (req.body.token === process.env.SLACK_VERIFICATION_TOKEN) {
        console.log("here");
        const event = req.body.event;
       
        // handle member_joined_channel event that's emitted when the bot joins a channel
        if (event.type === 'app_mention') {
          const message = {
            text: '왜요',
            attachments: [{
              text: "",
              color: '#7e1cc9',
            }],
          };
          channel.sendNotification(message , event.channel);
        }
        
        if (event.user === app.botId && event.type === 'member_joined_channel') {
          const contype = req.headers['content-type'];
          let body = req.body;
          body.text = "Thanks for calling";
          if (contype.indexOf('application/json') > 0) { body = JSON.parse(req.body); }
          channel.sendNotification(body ,event.channel);
        }
        
        res.sendStatus(200);
      } else { res.sendStatus(500); }
      break;
    }
    default: res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}!`);
  app.botId = process.env.BOT_ID;
});
