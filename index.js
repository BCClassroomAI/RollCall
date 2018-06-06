// This is an attendance app for Alexa
// Initially it will just read off a list of names

'use strict';
const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");
const config = require("./user-config.json");

var courses = [{"1111": [{name: "Tom", beenCalled: 0}, {name: "Jerry", beenCalled: 0}, {name: "Joe", beenCalled: 0}],
    "2222": [{name: "Jack", beenCalled: 0}, {name: "Daewoo", beenCalled: 0}]}];

AWS.config.update({region: 'us-east-1'});

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context);

    alexa.appId = config.appID;

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
	var courseNumber = this.event.request.intent.slots.courseNumber.value;
	if (courses.forEach(course => course === courseNumber)) {
	    courses.courseNumber.forEach(student => {
	        this.response.speak(student.name);
            })
        this.emit(':response.Ready');
	    }
    },

    'ColdCall': function () {

        if (this.event.request.dialogState == "STARTED" || this.event.request.dialogState == "IN_PROGRESS") {
            this.context.succeed({
                "response": {
                    "directives": [
                        {
                            "type": "Dialog.Delegate"
                        }
                    ],
                    "shouldEndSession": false
                },
                "sessionAttributes": {}
            });

        } else {
            var courseNumber = this.event.request.intent.slots.courseNumber.value;
            var beenCalledList = courses.courseNumber.forEach(student => beenCalledList.push(student.beenCalled));
            if (courses.forEach(course => course === courseNumber)) {
                var loop = true;
                while (loop === true) {
                    var randomIndex = Math.floor(Math.random() * courses.courseNumber.length);
                    var randomStudent = courses.courseNumber[randomIndex];
                    if (randomStudent.beenCalled <= Math.min(beenCalledList)) {
                        const speechOutput = randomStudent.name;
                        randomStudent.beenCalled++;
                        loop = false;
                        this.response.speak(speechOutput);
                        this.emit(':responseReady');
                    };
                }
            } else {
               console.log('Invalid courseNumber');
               this.response.speak("I'm sorry, that course number doesn't exist.");
               // maybe call 'ColdCall' again and reset the dialogue somehow? Maybe trigger a reprompt somehoew?
            }


        }
    }

};
