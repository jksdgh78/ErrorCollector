const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const qs = require('querystring');
const axios = require('axios');
const JsonDB = require('node-json-db');
const fs = require('fs');
const dotenv = require('dotenv');
const url = require('url');
const result = dotenv.config();
const channel = require('./channel');
var crawler = require('./crawler');
const colors = require('./colors.json');

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

app.post('/slash/refresh', (req, res) => {
  if (req.body.token === process.env.SLACK_VERIFICATION_TOKEN) {
    crawler.DBtitleRemoveAll( req.body.channel_id);
    res.sendStatus(200);
  }
});
 
app.post('/slash/addcafe', (req, res) => {
  if (req.body.token === process.env.SLACK_VERIFICATION_TOKEN) {

    var dialog = {
      "callback_id": "addcafe",
      "title": "Add a Naver cafe",
      "submit_label": "Request",
      "notify_on_cancel": true,
      "state": "Limo",
      "elements": [
          {
              "type": "text",
              "label": "네이버 카페 대표 URL",
              "name": "text_mainurl"
          },
          {
              "type": "text",
              "subtype": "url",
              "label": "네이버 카페 글 URL",
              "name": "text_url"
          },
          {
              "type": "text",
              "label": "카페 명칭",
              "name": "text_name"
          },
          {
            "label": "Colors",
            "type": "select",
            "name": "color",
            "options": [
              {
                "label": "Red",
                "value": "red"
              },
              {
                "label": "Green",
                "value": "green"
              },
              {
                "label": "Blue",
                "value": "blue"
              } 
            ]
          }
      ]
    };
    
    channel.sendDialog(dialog, req.body.trigger_id, req.body.channel_id);

  } else { res.sendStatus(500); }
});

const requestOptions  = { 
	method: "GET"
	,uri: ""
	,headers: { "User-Agent": "Mozilla/5.0" }
	,encoding: null
};

app.post('/action_endpoint', (req, res) => {
  var body = req.body;
  var payload = JSON.parse(body.payload);
  
  if (payload.token === process.env.SLACK_VERIFICATION_TOKEN) {
    
    if(payload.callback_id == "addcafe")
    {
      var queryData = url.parse(payload.submission.text_url, true).query;
      var uri = 'https://cafe.naver.com/ArticleList.nhn?search.clubid=' + queryData.clubid 
         + '&search.menuid=' + queryData.menuid + '&search.boardtype=L';
      requestOptions.uri = uri;
      request(requestOptions, (err, res2, body) => {
          if (err) { return console.log(err); }
          
          if(res2.statusCode === 200) 
          {
            var result = crawler.DBcafeFindOrCreate(payload.submission.text_name, uri, 
              payload.submission.text_mainurl, payload.channel.id, colors[payload.submission.color]);
            
            if(result === 1)
              channel.sendOK(payload.submission.text_name + " 등록에 성공했습니다." , payload.channel.id);
            else if(result === 2 )
              channel.sendFail(payload.submission.text_name + "가 이미 등록되어 있습니다." , payload.channel.id);
          }
          else
          {
            channel.sendFail("네이버 카페 URL 이 이상해요" , payload.channel.id);
          }
      });
      
      
      res.status(200).send("");
    }
    
    
  } else {

    channel.sendFail('토큰이 이상해요!', payload.channel.id); 
  }
});

/*
 * Endpoint to receive events from Slack's Events API.
 * Handles:
 *   - url_verification: Returns challenge token sent when present.
 *   - event_callback: Confirm verification token & handle `member_joined_channel` events.
 { payload: '{"type":"dialog_submission","token":"CtuSqtZAVhxy363KkoxWeyZo","action_ts":"1546337605.139374","team":{"id":"T024QV52Z","domain":"smartstudy"},"user":{"id":"UEWPT7KK7","name":"gomji"},"channel":{"id":"CF0846S9E","name":"unit_game_error"},"submission":{"loc_origin":"w","loc_destination":"w"},"callback_id":"ryde-46e2b0","response_url":"https:\\/\\/hooks.slack.com\\/app\\/T024QV52Z\\/515823036118\\/LDiTrHGDeTj8Uo02TBCzLc0m","state":"Limo"}' }
 
 
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
