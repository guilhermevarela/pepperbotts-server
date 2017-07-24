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
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);

bot.localePath(path.join(__dirname, './locale'));
bot.recognizer(recognizer);
var intents = new builder.IntentDialog({recognizers: [recognizer]})
.matches('Info-general',  (session, args) => {
  session.send('HI I\'m Mrs Pepper Pots your newest personal assistant. And I will assist you by making appointments')
  session.send('LUIS MODEL INTENT SCORE \n' + JSON.stringify(args))
})
.matches('Make-appointment', (session, args) => {
  //RESOLVE TEST 
  var intent  = args.intent;
  var entities = args.entities;
  var subject = builder.EntityRecognizer.findEntity(entities, 'Subject'),
      target  = builder.EntityRecognizer.findEntity(entities, 'Target'),
      dateObj = builder.EntityRecognizer.findEntity(entities, 'builtin.datetimeV2.datetime');

      
  session.send('You intend is \n' + intent)
  session.send('THE SUBJECT IS \n' + subject.entity)
  session.send('THE TARGET IS \n' + target.entity)
  if (dateObj) {
    if (dateObj.hasOwnProperty('resolution')) {
      var res = dateObj['resolution'];
      if (res.hasOwnProperty('values')) {
        var values = res['values'];
        if (values[0].hasOwnProperty('value')) {
          var value = values[0]['value'];
          session.send('at \n' + value)   
        }  else {          
          console.log('values ' + JSON.stringify(values))  
          session.send('Sorry, I didnt quite catch the time. Could you repeat?')    
        }
      } else {
        console.log('res ' + JSON.stringify(res))
        session.send('Sorry, I didnt quite catch the time. Could you repeat?')    
      }     
    } else {
      console.log('dateObj ' + JSON.stringify(dateObj))  
      session.send('Sorry, I didnt quite catch the time. Could you repeat?')    
    }        
  } else {    
    session.send('Sorry, I didnt quite catch the time. Could you repeat?')    
  } 
  

  session.send('LUIS MODEL INTENT SCORE \n' + JSON.stringify(args))


})
.onDefault( (session) => { 
  session.send('Sorry i didin\'t quite catch that')
});
bot.dialog('/', intents);


// bot.dialog('/', function (session) {
//     session.send('You said ' + session.message.text);
// });

//determining the intent of the user is the main objective when building a chatbot (that, and extracting entities, but more on that later)
// var intents = new builder.IntentDialog();
// bot.dialog('/', intents);
// intents.matches(/^say something else/i, [
//     function (session) {
//         session.beginDialog('/changesentence');
//     },
//     function (session, results) {
//         session.send('Ok, I will say the following sentence from now on: %s', session.userData.sentence);
//     }
// ])
// intents.onDefault([
//   function (session, args, next) {
//     if (!session.userData.sentence) {
//       session.beginDialog('/changesentence');        
//     } else {
//       next();
//     }
//   },
//   function (session, results) {
//     session.send(session.userData.sentence);            
//   }
// ]);
// bot.dialog('/changesentence',[
//   function (session) {
//     builder.Prompts.text(session, 'Hi, I am version 2.0 of the Microsoft Chatbot! I am already a lot smarter now! What would you like me to say?');
//   },
//   function (session, results) {
//     session.userData.sentence = results.response;
//     session.endDialog();
//   }
// ])

//'http://docs.botframework.com/builder/node/guides/understanding-natural-language/'



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
