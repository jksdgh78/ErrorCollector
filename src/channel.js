const JsonDB = require('node-json-db');
const qs = require('querystring');
const axios = require('axios');
const colors = require('./colors.json');

const DB = new JsonDB('channels', true, false);

// generate a unique number based on the current DateTime and a random number
const generateNonce = () => `${+new Date()}${Math.floor((Math.random() * 100) + 1)}`;

const logResult = (result) => {
  console.log(result.data);
};

// Send messages to a Slack channel using chat.postMessage method
const sendNotification = (messageJSON, channelId) => {
  const bodyVars = {
    token: process.env.SLACK_TOKEN,
    channel: channelId,
  };

  // overwrite or add in the token and channel
  const body = Object.assign({}, messageJSON, bodyVars);
  if (messageJSON.attachments) {
    body.attachments = JSON.stringify(messageJSON.attachments);
  }

  const sendMessage = axios.post('https://slack.com/api/chat.postMessage',
    qs.stringify(body));

  sendMessage.then(logResult);
};

// Send OK messages to a Slack channel using chat.postMessage method
const sendOK = (textmessage, channelId, res) => {
  const bodyVars = {
    token: process.env.SLACK_TOKEN,
    channel: channelId,
  };
  const message = {
      "attachments": [
          {
              "title": "Message",
              "text": textmessage,
              "color" : colors.green,
              "mrkdwn_in": [
                  "pretext"
              ]
          }
      ]
  }
  
  // overwrite or add in the token and channel
  const body = Object.assign({}, message, bodyVars);
  if (message.attachments) {
    body.attachments = JSON.stringify(message.attachments);
  }

  const sendMessage = axios.post('https://slack.com/api/chat.postMessage',
    qs.stringify(body));

  sendMessage.then(logResult);
  res.status(200).send("");
};

const sendFail = (textmessage, channelId, res) => {
  const bodyVars = {
    token: process.env.SLACK_TOKEN,
    channel: channelId,
  };
  const message = {
      "attachments": [
          {
              "title": "Message",
              "text": textmessage,
              "color" : colors.red,
              "mrkdwn_in": [
                  "pretext"
              ]
          }
      ]
  }
  
  // overwrite or add in the token and channel
  const body = Object.assign({}, message, bodyVars);
  if (message.attachments) {
    body.attachments = JSON.stringify(message.attachments);
  }

  const sendMessage = axios.post('https://slack.com/api/chat.postMessage',
    qs.stringify(body));

  sendMessage.then(logResult);
  res.status(400).send("");
};

//
const sendDialog = (dialog, trigger_id, channel_id) => {

  const body = {
    "token" : process.env.SLACK_TOKEN,
    "trigger_id" : trigger_id,
    "dialog" : JSON.stringify(dialog)
  };

  const sendMessage = axios.post('https://slack.com/api/dialog.open',
    qs.stringify(body));
    
  sendMessage.then(logResult);
};

const findOrCreate = (channelId) => 
{
  let channel = false;
  try { channel = DB.getData(`/${channelId}`); } catch (error) {
    console.error(`${channelId} not found`);
  }

  // save channel if one isn't found
  if (!channel) {
    const nonce = generateNonce();
    const message = {
      text: `Webhook created for <#${channelId}>:`,
      attachments: [{
        text: `${process.env.BASE_URL}/incoming/${nonce}`,
        color: '#7e1cc9',
      }],
    };
    DB.push(`/${channelId}`, nonce);

    // let the channel know about the webhook URL
    sendNotification(message, channelId);
  }
};

const findByNonce = (nonce) => {
  const channels = DB.getData('/');
  return Object.keys(channels).find(key => channels[key] === nonce);
};

const remove = (channelId) => {
  DB.delete(`/${channelId}`);
};

module.exports = { sendOK, sendFail, sendDialog, findOrCreate, findByNonce, sendNotification, remove };
