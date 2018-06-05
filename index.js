// This is an attendance app for Alexa
// Initially it will just read off a list of names

'use strict';
const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");

var students = [{name: "Tom", beenCalled: false}, {name: "Jerry", beenCalled: false}, {name: "Joe", beenCalled: false},
    {name: "Jack", beenCalled: false}, {name: "Daewoo", beenCalled: false}];

AWS.config.update({region: 'us-east-1'});

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context);

    alexa.appId = 'amzn1.ask.skill.38dcbfd7-f6a7-4060-929e-c6f620b2929e'; //Will

    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function () {
        console.log('LaunchRequest');

        const speechOutput = 'This is the Roll Call skill.';
        const errorOutput = 'Whoops! Something went wrong!';

        this.context.succeed ({
            "response": {
                "outputSpeech": {
                    "type": "PlainText",
                    "text": speechOutput
                },
                "shouldEndSession": true
            },
            "sessionAttributes": {}
        });
        //should there be an error/failure case?
    },

    //Required Intents
    'AMAZON.HelpIntent': function () {
        const speechOutput = 'This is the Roll Call skill.';

        this.response.speak(speechOutput);
        this.emit(':responseReady'); //what is this?
    },

    'AMAZON.CancelIntent': function () {
        const speechOutput = 'Goodbye!';

        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },

    'AMAZON.StopIntent': function () {
        const speechOutput = 'See you later!';

        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },

    //Custom Intents
    'TakeAttendance': function () {
	
    },

    'ColdCall': function () {
        var i = 0;
        while (i < students.length) {
            const randomIndex = Math.floor(Math.random() * students.length);
            if (students[randomIndex].beenCalled = false) {
                const speechOutput = students[randomIndex].name;
                students[randomIndex].beenCalled = true;
                i++;

                this.response.speak(speechOutput);
                this.emit(':responseReady');
            }
        }
    }

};
