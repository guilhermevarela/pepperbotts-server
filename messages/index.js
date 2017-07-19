"use strict";
require('dotenv').config()
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// bot.dialog('/', function (session) {
//     session.send('You said ' + session.message.text);
// });

//determining the intent of the user is the main objective when building a chatbot (that, and extracting entities, but more on that later)
var intents = new builder.IntentDialog();
bot.dialog('/', intents);
intents.matches(/^say something else/i, [
    function (session) {
        session.beginDialog('/changesentence');
    },
    function (session, results) {
        session.send('Ok, I will say the following sentence from now on: %s', session.userData.sentence);
    }
])
intents.onDefault([
  function (session, args, next) {
    if (!session.userData.sentence) {
      session.beginDialog('/changesentence');        
    } else {
      next();
    }
  },
  function (session, results) {
    session.send(session.userData.sentence);            
  }
]);
bot.dialog('/changesentence',[
  function (session) {
    builder.Prompts.text(session, 'Hi, I am version 2.0 of the Microsoft Chatbot! I am already a lot smarter now! What would you like me to say?');
  },
  function (session, results) {
    session.userData.sentence = results.response;
    session.endDialog();
  }
])

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
