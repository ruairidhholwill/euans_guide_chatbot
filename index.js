'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

let currentQuestion;
let handleResponse;
let place;
let overallRating;
let conversationObject = {};
// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if ((webhook_event.message) || (webhook_event.attachments)) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;


  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

function handleMessage(sender_psid, received_message) {

  populateConversationObject(received_message.text)

  if ((received_message.text !== currentQuestion) && (currentQuestion === "Can you confirm the name of the place you visited?")) {
    place = received_message.text
    handleResponse = {
      "text": `Ok, great! Can you confirm which town or city ` + place + ` is in?`
    }
    currentQuestion = handleResponse["text"]

  } else if ((received_message.text !== currentQuestion) && (currentQuestion === `Ok, great! Can you confirm which town or city ` + place + ` is in?`)) {
    handleResponse = {
      "text": `Do you have any photos or images you'd like to upload?`,
      "quick_replies": [
        {
          "content_type": "text",
          "title": "Yes!",
          "payload": "yes"
        },
        {
          "content_type": "text",
          "title": "No!",
          "payload": "yes"
        }
      ]
    }
    currentQuestion = handleResponse["text"]

  } else if ((received_message.text === "No!") && (received_message.text !== currentQuestion) && ((currentQuestion === `Do you have any photos or images you'd like to upload?`) || ( currentQuestion === `Do you have any more photos or images you'd like to upload?`))) {
    handleResponse = {
      "text": "Great! Now, what would you like to title your review?"
    }
    currentQuestion = handleResponse["text"]

  } else if ((received_message.text === "Yes!") && (received_message.text !== currentQuestion) && ((currentQuestion === `Do you have any photos or images you'd like to upload?`) || ( currentQuestion === `Do you have any more photos or images you'd like to upload?`))) {
    handleResponse = {
      "text": "Great, send it!"
    }
    currentQuestion = handleResponse["text"]

  } else if ((received_message.attachments) && (currentQuestion === "Great, send it!") && (received_message.text !== currentQuestion)) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    handleResponse = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }

  } else if ((received_message.text !== currentQuestion) && (currentQuestion === "Great! Now, what would you like to title your review?")) {
    handleResponse = {
      "text": "Great Title! Now for a rating, how would you rate the disabled access overall?",
      "quick_replies": [
        {
          "content_type": "text",
          "title": "1",
          "payload": "one"
        },
        {
          "content_type": "text",
          "title": "2",
          "payload": "two"
        },
        {
          "content_type": "text",
          "title": "3",
          "payload": "three"
        },
        {
          "content_type": "text",
          "title": "4",
          "payload": "four"
        },
        {
          "content_type": "text",
          "title": "5",
          "payload": "five"
        }
      ]
    }
    currentQuestion = handleResponse["text"]

  } else if((received_message.text === "1" || "2" || "3" || "4" || "5") && (received_message.text !== currentQuestion) && (currentQuestion === "Great Title! Now for a rating, how would you rate the disabled access overall?")){
    overallRating = received_message.text
    handleResponse = {
      "text": `You've given a rating of ` + overallRating + `. Could you summarize your experience at ` + place + `?`
    }
    currentQuestion = handleResponse["text"]

  } else if((received_message.text !== currentQuestion) && (currentQuestion === `You've given a rating of ` + overallRating + `. Could you summarize your experience at ` + place + `?`)){
    handleResponse = {
      "text": `Thanks very much that's your review submitted! `
    }
    currentQuestion = handleResponse["text"]
  }


  // Send the response message
  callSendAPI(sender_psid, handleResponse);

}

function populateConversationObject(response) {
  if (response !== currentQuestion) {
    conversationObject[currentQuestion] = response
  }
  console.log("OBJECT", conversationObject)
}


function handlePostback(sender_psid, received_postback) {
  console.log('ok')
  let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload

  if (payload === 'GET_STARTED') {
    response = { "text": "Can you confirm the name of the place you visited?" }
    currentQuestion = response["text"]

  } else if (payload === 'yes') {
      response = {
        "text": `Do you have any more photos or images you'd like to upload?`,
        "quick_replies": [
          {
            "content_type": "text",
            "title": "Yes!",
            "payload": "yes"
          },
          {
            "content_type": "text",
            "title": "No!",
            "payload": "yes"
          }
        ]
      }
    currentQuestion = response["text"]

  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  // setCurrentQuestion(response);
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

// curl -X POST -H "Content-Type: application/json" -d '{
//   "get_started": {"payload": "GET_STARTED"}
// }' "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=EAAEZBxZBsDMYYBAJPLwYYBncuKhIZCnAVq9GrZAhkD9EwKbISZBS30D2xmmqMqKzMnFx6UE80KFFmnZAkWuy832RoWAOLCHJnivAjcggKZAO3JYmjg9Va4nng6mi0Coz8ZCyW0W8qWN4DrCFtgrjB1PxjdZC0nURiBnZBFcOcfwDOeJBvZAsqzEMFbFBWiE7MAuVP0ZD"


// curl -X POST -H "Content-Type: application/json" -d '{
//   "greeting": [
//     {
//       "locale":"default",
//       "text":"Hello {{user_first_name}}! Click on Get Started to leave your review"
//     }
//   ]
// }' "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=EAAEZBxZBsDMYYBAJPLwYYBncuKhIZCnAVq9GrZAhkD9EwKbISZBS30D2xmmqMqKzMnFx6UE80KFFmnZAkWuy832RoWAOLCHJnivAjcggKZAO3JYmjg9Va4nng6mi0Coz8ZCyW0W8qWN4DrCFtgrjB1PxjdZC0nURiBnZBFcOcfwDOeJBvZAsqzEMFbFBWiE7MAuVP0ZD"
