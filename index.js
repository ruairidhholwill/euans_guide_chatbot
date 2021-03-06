"use strict";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  app = express().use(body_parser.json()); // creates express http server

let currentQuestion;
let handleResponse;
let place;
let overallRating;

const ratings = [
  {
    content_type: "text",
    title: "1",
    payload: "one"
  },
  {
    content_type: "text",
    title: "2",
    payload: "two"
  },
  {
    content_type: "text",
    title: "3",
    payload: "three"
  },
  {
    content_type: "text",
    title: "4",
    payload: "four"
  },
  {
    content_type: "text",
    title: "5",
    payload: "five"
  }
];

function questions(questionNumber, place, overallRating) {
  const questionsArray = [
    `Hello! Thanks for clicking get started. Would you like to leave a review or chat to us?`,
    "Can you confirm the name of the place you visited?",
    `Ok, great! Can you confirm which town or city ` + place + ` is in?`,
    `Do you have any photos or images you'd like to upload?`,
    `Do you have any more photos or images you'd like to upload?`,
    "Great, to select an image to attach, click on the picture icon in the bottom left corner of the messenger and send it.",
    "Great! Now, what would you like to title your review?",
    "Great Title! Now for a rating, how would you rate the disabled access overall?",
    `You've given a rating of ` +
      overallRating +
      `. Could you summarize your experience at ` +
      place +
      `?`,
    `We'll start with Getting There. Would you like to add any information on parking or transport?`,
    `Ok, great! Let's start with a rating, again out of 5.`,
    `Awesome! Could you give us some more information?`,
    `Thank You! Now onto getting in and around ` +
      place +
      `. Is there anything specific about Disabled Access you would like to add?`,
    `Ok, great! Let's start with a rating, again out of 5 for getting in and around.`,
    `Great! Could you give us some more information on what you noticed about ` +
      place +
      `?`,
    `Now, onto toilets. Our users consistently tell us how important both accessible toilets and information about toilets is. Are you able to tell us anything about the toilets at ` +
      place +
      `?`,
    `Ok, great! Let's start with a rating, again out of 5 for toilet accessiblity.`,
    `Would you be able to provide some more details about the toilets?`,
    `Now we come to staff. Would you like to add any further information about the people you came across at ` +
      place +
      `?`,
    `Ok, great! Let's start with a rating, again out of 5 for staff.`,
    `Would you be able to provide some more details about the staff?`
  ];
  return questionsArray[questionNumber];
}

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

// Accepts POST requests at /webhook endpoint
app.post("/webhook", (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === "page") {
    body.entry.forEach(function(entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender ID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message || webhook_event.attachments) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });
    // Return a '200 OK' response to all events
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint
app.get("/webhook", (req, res) => {
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

function handleMessage(sender_psid, received_message) {
  if (
    received_message.text !== currentQuestion &&
    currentQuestion === questions(0, place, overallRating) &&
    received_message.text === `Review!`
  ) {
    handleResponse = {
      text: questions(1, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text !== currentQuestion &&
    currentQuestion === questions(1, place, overallRating)
  ) {
    place = received_message.text;
    handleResponse = {
      text: questions(2, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text !== currentQuestion &&
    currentQuestion === questions(2, place, overallRating)
  ) {
    handleResponse = {
      text: questions(3, place, overallRating),
      quick_replies: [
        {
          content_type: "text",
          title: "Yes!",
          payload: "yes"
        },
        {
          content_type: "text",
          title: "No!",
          payload: "yes"
        }
      ]
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text === "No!" &&
    received_message.text !== currentQuestion &&
    (currentQuestion === questions(3, place, overallRating) ||
      currentQuestion === questions(4, place, overallRating))
  ) {
    handleResponse = {
      text: questions(6, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text === "Yes!" &&
    received_message.text !== currentQuestion &&
    (currentQuestion === questions(3, place, overallRating) ||
      currentQuestion === questions(4, place, overallRating))
  ) {
    handleResponse = {
      text: questions(5, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.attachments &&
    currentQuestion === questions(5, place, overallRating) &&
    received_message.text !== currentQuestion
  ) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    handleResponse = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Is this the right picture?",
              subtitle: "Tap a button to answer.",
              image_url: attachment_url,
              buttons: [
                {
                  type: "postback",
                  title: "Yes!",
                  payload: "yes"
                },
                {
                  type: "postback",
                  title: "No!",
                  payload: "no"
                }
              ]
            }
          ]
        }
      }
    };
  } else if (
    received_message.text !== currentQuestion &&
    currentQuestion === questions(6, place, overallRating)
  ) {
    handleResponse = {
      text: questions(7, place, overallRating),
      quick_replies: ratings
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text === "1" || "2" || "3" || "4" || "5") &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(7, place, overallRating)
  ) {
    overallRating = received_message.text;
    handleResponse = {
      text: questions(8, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text !== currentQuestion &&
    currentQuestion === questions(8, place, overallRating)
  ) {
    handleResponse = {
      text: `Thank you very much your review is nearly complete!`,
      quick_replies: [
        {
          content_type: "text",
          title: "Continue",
          payload: "continue_option_question"
        },
        {
          content_type: "text",
          title: "Finish",
          payload: "finish_option_question"
        }
      ]
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text === "Finish" &&
    received_message.text !== currentQuestion &&
    currentQuestion === `Thank you very much your review is nearly complete!`
  ) {
    handleResponse = {
      text: `Thank you for your review - it's great. We'll send you a message when it has gone live! :)`
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text === "Continue" &&
    received_message.text !== currentQuestion &&
    currentQuestion === `Thank you very much your review is nearly complete!`
  ) {
    handleResponse = {
      text: questions(9, place, overallRating),
      quick_replies: [
        {
          content_type: "text",
          title: "Yes",
          payload: "yes_get_there"
        },
        {
          content_type: "text",
          title: "Skip",
          payload: "skip_get_there"
        }
      ]
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text === "Yes" &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(9, place, overallRating)
  ) {
    handleResponse = {
      text: questions(10, place, overallRating),
      quick_replies: ratings
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text === "1" || "2" || "3" || "4" || "5") &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(10, place, overallRating)
  ) {
    handleResponse = {
      text: questions(11, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text || received_message.text === "Skip") &&
    received_message.text !== currentQuestion &&
    (currentQuestion === questions(11, place, overallRating) ||
      currentQuestion === questions(9, place, overallRating))
  ) {
    handleResponse = {
      text: questions(12, place, overallRating),
      quick_replies: [
        {
          content_type: "text",
          title: "Yes",
          payload: "yes_disabled_access"
        },
        {
          content_type: "text",
          title: "Skip",
          payload: "skip_disabled_access"
        }
      ]
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text === "Yes" &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(12, place, overallRating)
  ) {
    handleResponse = {
      text: questions(13, place, overallRating),
      quick_replies: ratings
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text === "1" || "2" || "3" || "4" || "5") &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(13, place, overallRating)
  ) {
    handleResponse = {
      text: questions(14, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text || received_message.text === "Skip") &&
    received_message.text !== currentQuestion &&
    (currentQuestion === questions(14, place, overallRating) ||
      currentQuestion === questions(12, place, overallRating))
  ) {
    {
      handleResponse = {
        text: questions(15, place, overallRating),
        quick_replies: [
          {
            content_type: "text",
            title: "Yes",
            payload: "yes_disabled_access"
          },
          {
            content_type: "text",
            title: "Skip",
            payload: "skip_disabled_access"
          }
        ]
      };
      currentQuestion = handleResponse["text"];
    }
  } else if (
    received_message.text === "Yes" &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(15, place, overallRating)
  ) {
    handleResponse = {
      text: questions(16, place, overallRating),
      quick_replies: ratings
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text === "1" || "2" || "3" || "4" || "5") &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(16, place, overallRating)
  ) {
    handleResponse = {
      text: questions(17, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text || received_message.text === "Skip") &&
    received_message.text !== currentQuestion &&
    (currentQuestion === questions(15, place, overallRating) ||
      currentQuestion === questions(17, place, overallRating))
  ) {
    handleResponse = {
      text: questions(18, place, overallRating),
      quick_replies: [
        {
          content_type: "text",
          title: "Yes",
          payload: "yes_disabled_access"
        },
        {
          content_type: "text",
          title: "Skip",
          payload: "skip_disabled_access"
        }
      ]
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text === "Yes" &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(18, place, overallRating)
  ) {
    handleResponse = {
      text: questions(19, place, overallRating),
      quick_replies: ratings
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text === "1" || "2" || "3" || "4" || "5") &&
    received_message.text !== currentQuestion &&
    currentQuestion === questions(19, place, overallRating)
  ) {
    handleResponse = {
      text: questions(20, place, overallRating)
    };
    currentQuestion = handleResponse["text"];
  } else if (
    (received_message.text || received_message.text === "Skip") &&
    received_message.text !== currentQuestion &&
    (currentQuestion === questions(18, place, overallRating) ||
      currentQuestion === questions(20, place, overallRating))
  ) {
    handleResponse = {
      text: `Thank you for your review - it's great. We'll send you a message when it has gone live! :)`
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text !== currentQuestion &&
    currentQuestion === questions(0, place, overallRating) &&
    received_message.text === "Chat!"
  ) {
    handleResponse = {
      text: `No problem! Leave us a message and we will get back to you as soon as possible!`
    };
    currentQuestion = handleResponse["text"];
  } else if (
    received_message.text !== currentQuestion &&
    (currentQuestion ===
      `Thank you for your review - it's great. We'll send you a message when it has gone live! :)` ||
      currentQuestion ===
        `No problem! Leave us a message and we will get back to you as soon as possible!`)
  ) {
    handleResponse = {
      text: `Uh oh. Something's went wrong. Try deleting the chat and starting again. Sorry!`
    };
    currentQuestion = handleResponse["text"];
  }

  // Send the response message
  callSendAPI(sender_psid, handleResponse);
}
function handlePostback(sender_psid, received_postback) {
  console.log("ok");
  let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload

  if (payload === "GET_STARTED") {
    response = {
      text: `Hello! Thanks for clicking get started. Would you like to leave a review or chat to us?`,
      quick_replies: [
        {
          content_type: "text",
          title: "Review!",
          payload: "review"
        },
        {
          content_type: "text",
          title: "Chat!",
          payload: "chat"
        }
      ]
    };
    currentQuestion = response["text"];
  } else if (payload === "yes") {
    response = {
      text: questions(4, place, overallRating),
      quick_replies: [
        {
          content_type: "text",
          title: "Yes!",
          payload: "yes"
        },
        {
          content_type: "text",
          title: "No!",
          payload: "yes"
        }
      ]
    };
    currentQuestion = response["text"];
  } else if (payload === "no") {
    response = { text: "Oops, try sending another image." };
  }
  // Send the message to acknowledge the postback
  // setCurrentQuestion(response);
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  if (
    currentQuestion ===
    `Uh oh. Something's went wrong. Try deleting the chat and starting again. Sorry!`
  ) {
    return null;
  }
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}
