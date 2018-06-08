// This is an attendance app for Alexa
// Initially it will just read off a list of names

'use strict';
const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");
const config = require("./user-config.json");
const HashMap = require("hashmap");

const courses = new HashMap();
courses.set("1111", [{name: "Tom", beenCalled: 0}, {name: "Jerry", beenCalled: 0}, {name: "Joe", beenCalled: 0}]);
courses.set("2222", [{name: "Jack", beenCalled: 0}, {name: "Daewoo", beenCalled: 0}]);

const questions = new HashMap();

questions.set("1111", [
    {question: "How old is Tom Brady?", answer: "Eternal"},
    {question: "How much more clever were my original questions?", answer: "Infinite"},
    {question: "What's the capital of Nebraska?", answer: "I think Omaha"}
]);

questions.set("2222", [
    {question: "What is China?", answer: "A Country"},
    {question: "What is a Jesuit?", answer: "Kinda like a priest. That's all I know about it."}
]);

AWS.config.update({region: 'us-east-1'});

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = config.appID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function linearSearch(L, target) {
    if (L.length === 0) return false;
    if (L[0].equals(target)) return true;
    return linearSearch(L.slice(1), target);
}

function randomQuizQuestion(courseNumber) {
    if (questions.has(courseNumber)) {
        const randomIndex = Math.floor(Math.random() * questions.get(courseNumber).length);
        return questions.get(courseNumber)[randomIndex]
    } else {
        return null;
    }
}

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

        this.emit(':ask');
        //should there be an error/failure case?
    },

    //Required Intents
    'AMAZON.HelpIntent': function () {
        const speechOutput = 'This is the Roll Call skill.';

        this.response.speak(speechOutput);
        this.emit(':responseReady');
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
    'GroupPresent': function () {

        // presentList used throughout so declare here so in scope for
        // both findStudent and main code
        let presentList = [];

        // Searches existing presentation list for the student's name, returns true if name is not in list
        function findStudent(student) {
            for (let i = 0; i < presentList.length; i++) {
                if (presentList[i] === student) {
                    return false;
                }
            }
            return true;
        }

        if (this.event.request.dialogState === "STARTED" || this.event.request.dialogState === "IN_PROGRESS") {

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

            const courseNumber = this.event.request.intent.slots.courseNumber.value;
            const groupNumber = this.event.request.intent.slots.groupNumber.value;
            this.attributes.courseNumber = courseNumber;
            this.attributes.groupNumber = groupNumber;
            const students = courses.get(courseNumber);
            presentList = []; // reset presentList

            // Adds students in random order to presentation list if student is not already in list
            let j = 0;
            while (j < students.length) {
                let randomIndex = Math.floor(Math.random() * students.length);
                let randomStudent = students[randomIndex];

                if (findStudent(randomStudent.name)) {
                    presentList.push(randomStudent.name);
                    j++;
                }
            }

            // Names all students randomly ordered, along with number for purpose of presentation order
            // Divides student names into groups based on groupNumber
            let k = 1;
            let speechOutput = '';
            if (groupNumber === 1) {
                for (let l = 0; l < presentList.length; l++) {
                    speechOutput += `${k}, ${presentList[l]}; `;
                    k++;
                }
            } else {
                let groups;
                const eachGroup = [];
                const groupList = [];

                if (students.length % groupNumber === 0) {
                    groups = students.length / groupNumber;
                } else {
                    groups = Math.floor(students.length / groupNumber) + 1;
                }

                for (let l = 0; l < groups; l++) {
                    for (let m = 0; m < groupNumber; m++) {
                        if (presentList.length === 0) {
                            break;
                        }
                        eachGroup.push(presentList[0]);
                        presentList.shift();
                    }
                    groupList.push(eachGroup);
                }

                for (let n = 0; n < groupList.length; n++) {
                    speechOutput += `group ${k}, ${groupList[n].toString()}; `;
                    k++;
                }
            }

            this.response.speak(speechOutput);
            this.emit(':responseReady');
        }
    },

    'ColdCall': function () {

        if (this.event.request.dialogState === "STARTED" || this.event.request.dialogState === "IN_PROGRESS") {

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

            const courseNumber = this.event.request.intent.slots.courseNumber.value;
            this.attributes.courseNumber = courseNumber;
            const beenCalledList = [];
            if (courses.has(courseNumber)) {
                courses.get(courseNumber).forEach(student => beenCalledList.push(student.beenCalled));
                const minim = Math.min(...beenCalledList);
                let loop = true;
                while (loop === true) {
                    let randomIndex = Math.floor(Math.random() * courses.get(courseNumber).length);
                    let randomStudent = courses.get(courseNumber)[randomIndex];
                    if (randomStudent.beenCalled === minim) {
                        const speechOutput = randomStudent.name;
                        randomStudent.beenCalled++;
                        loop = false;
                        this.response.speak(speechOutput);
                        this.emit(':responseReady');
                    }
                }
            } else {
               console.log('Invalid courseNumber');
               this.emit(':tell', 'I\'m sorry, that course number doesn\'t exist.');
               // maybe call 'ColdCall' again and reset the dialogue somehow? Maybe trigger a reprompt somehow?
            }


        }
    },

    'QuizQuestion': function () {
        if (this.event.request.dialogState === "STARTED" || this.event.request.dialogState === "IN_PROGRESS") {
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
            let courseNumber = this.event.request.intent.slots.courseNumber.value;
            this.attributes['question'] = randomQuizQuestion(courseNumber);
            this.response.speak(this.attributes.question);
            this.emit(":responseReady");
        }
    }

};
