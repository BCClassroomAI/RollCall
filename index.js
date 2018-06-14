// This is an attendance app for Alexa
// Initially it will just read off a list of names

'use strict';
const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");
const config = require("./user-config.json");
const HashMap = require("hashmap");
const s3 = new AWS.S3();

const initializeCourses = (attributes) => {
    console.log("We're in initializeCourses");
    if (!attributes.hasOwnProperty('courses')) {
        console.log('making a courses attribute');
        attributes.courses = {
    "1111": [{name: "Tom", beenCalled: 0}, {name: "Jerry", beenCalled: 0}, {name: "Joe", beenCalled: 0}],
    "2222": [{name: "Jack", beenCalled: 0}, {name: "Daewoo", beenCalled: 0}]
        }
    }
};

const questions = new HashMap();

questions.set("1111", [
    {question: "How old is Tom Brady?", answer: "Eternal"},
    {question: "How much more clever were my original questions?", answer: "Infinite"},
    {question: "What's the capital of Nebraska?", answer: "Omaha"}
]);

questions.set("2222", [
    {question: "What is China?", answer: "A Country"},
    {question: "What is a Jesuit?", answer: "Kinda like a priest. That's all I know about it."},
    {question: "Best looking 26 year old in Boston?", answer: "Jamie Kim"}
]);

AWS.config.update({region: 'us-east-1'});

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    //const s3bkt = event.Records[0].s3.bucket.bcalexaquizquestions;
    //const s3key = event.Records[0].s3.object.quizquestions/SampleQuizQuestions.txt;
    // alexa.dynamoDBTableName = 'RollCallAttributes';
    alexa.appId = config.appID;
    alexa.dynamoDBTableName = "RollCall";
    alexa.registerHandlers(handlers);
    alexa.execute();

};

function S3write(params, callback) {
    // call AWS S3
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();

    s3.putObject(params, function(err, data) {
        if(err) { console.log(err, err.stack); }
        else {
            callback(data["ETag"]);

        }
    });
}

function randomQuizQuestion(questionSet) {
    if (questions.has(questionSet)) {
        const randomIndex = Math.floor(Math.random() * questions.get(questionSet).length);
        return questions.get(questionSet)[randomIndex]
    } else {
        return null;
    }
}

const handlers = {
    'LaunchRequest': function () {
        const speechOutput = 'This is the Roll Call skill.';
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },

    //Required Intents
    'AMAZON.HelpIntent': function () {
        const speechOutput = 'This is the Roll Call skill.';
        this.emit(':tell', speechOutput);
    },

    'AMAZON.CancelIntent': function () {
        const speechOutput = 'Goodbye!';
        this.emit(':tell', speechOutput);
    },

    'AMAZON.StopIntent': function () {
        const speechOutput = 'See you later!';
        this.emit(':tell', speechOutput);
    },

    'Unhandled': function () {
        let speechOutput = 'I did not understand that command. You can tell me to call on a student or make presentation groups.';

        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },

    //Custom Intents
    'GroupPresent': function () {

        initializeCourses(this.attributes);
        // presentList used throughout so declare here so in scope for
        // both findStudent and main code
        let presentList = [];
        const slotObj = this.event.request.intent.slots;

        // Searches existing presentation list for the student's name, returns true if name is not in list
        function findStudent(student) {
            for (let i = 0; i < presentList.length; i++) {
                if (presentList[i] === student) {
                    return false;
                }
            }
            return true;
        }

        let currentDialogState = this.event.request.dialogState;
        if (currentDialogState !== 'COMPLETED') {

            if (!slotObj.courseNumber.value) {
                const slotToElicit = 'courseNumber';
                const speechOutput = 'What is the course number?';
                this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
            }

            /* if (!this.attributes.courses.hasOwnProperty(slotObj.courseNumber.value)) {
                const slotToElicit = 'courseNumber';
                const speechOutput = 'Please provide a valid course number.';
                this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
            } */

            if (!slotObj.groupNumber.value) {
                const slotToElicit = 'groupNumber';
                const speechOutput = 'How many people per group?';
                this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
            }

        }

        console.log('Point A');

        const courseNumber = slotObj.courseNumber.value;
        const groupNumber = parseInt(slotObj.groupNumber.value);
        this.attributes.courseNumber = courseNumber;
        this.attributes.groupNumber = groupNumber;
        const students = this.attributes.courses[courseNumber];
        console.log(students);
        presentList = []; // reset presentList

        // Adds students in random order to presentation list if student is not already in list
        console.log('Point B');
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
        console.log('Point C');

        let k = 1;
        let speechOutput = '';
        if (groupNumber === 1) {
            for (let l = 0; l < presentList.length; l++) {
                speechOutput += `${k}, ${presentList[l]}; `;
                k++;
            }
        } else {
            let groups;
            let eachGroup = [];
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
                eachGroup = [];
            }

            for (let n = 0; n < groupList.length; n++) {
                speechOutput += `group ${k}, ${groupList[n].toString()}; `;
                k++;
            }
        }

        console.log('Point D');

        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },

    'ColdCall': function () {

        initializeCourses(this.attributes);

        if (this.event.request.dialogState !== "COMPLETED") {

            this.emit(':delegate');

        } else if (!this.attributes.courses.hasOwnProperty(this.event.request.intent.slots.courseNumber.value)) {

            let slotToElicit = 'courseNumber';
            let speechOutput = "I'm sorry, I don't have that course number on record. For which course would you like me to cold call from?";
            this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);

        } else {

            const courseNumber = this.event.request.intent.slots.courseNumber.value;
            this.attributes.courseNumber = courseNumber;
            const beenCalledList = [];
            this.attributes.courses[courseNumber].forEach(student => beenCalledList.push(student.beenCalled));
            const minim = Math.min(...beenCalledList);
            let loop = true;

            while (loop === true) {
                let randomIndex = Math.floor(Math.random() * this.attributes.courses[courseNumber].length);
                let randomStudent = this.attributes.courses[courseNumber][randomIndex];
                if (randomStudent.beenCalled === minim) {
                    const speechOutput = randomStudent.name;
                    randomStudent.beenCalled++;
                    this.attributes.courses[courseNumber].forEach(student => console.log(`name: ${student.name}, beencalled: ${student.beenCalled}`));
                    loop = false;
                    this.response.speak(speechOutput);
                    this.emit(':responseReady');
                }
            }
        }
    },

    'QuizQuestion': function () {
        this.attributes['question'] = randomQuizQuestion(questionSet);
        const slotObj = this.event.request.intent.slots;

        let currentDialogState = this.event.request.dialogState;
        if (currentDialogState !== 'COMPLETED') {

            if (!slotObj.questionSet.value) {
                const slotToElicit = 'questionSet';
                const speechOutput = 'What is the question set number?';
                this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
            }

            if (!questions.has(slotObj.questionSet.value)) {
                const slotToElicit = 'questionSet';
                const speechOutput = 'Please provide a valid questionSet.';
                this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
            }
        }

        this.attributes.questionSet = this.event.request.intent.slots.questionSet.value;

        this.response.speak(this.attributes.question).listen(this.attributes.question);
        this.emit(":responseReady");
    },

    'AnswerIntent': function () {
        const userAnswer = this.event.request.intent.slots.testAnswers.value;
        const correctAnswer = questions.get(this.attributes.questionSet)[this.attributes.randomIndex].answer;
        const newQuestion = randomQuizQuestion(this.attributes.questionSet);
        this.attributes.question = newQuestion;

        if (userAnswer === correctAnswer) {
            this.response.speak('Nice job! The correct answer is ' + correctAnswer + '. Here is your next question.' +
                newQuestion).listen(newQuestion);
        }
        else {
            this.response.speak('Sorry you dummy, the correct answer is ' + correctAnswer + 'Here is your next question.' +
                newQuestion).listen(newQuestion);
        }
        this.emit(':responseReady');
    }
}





/*
    'CorrectAnswer': function() {
        const answerResponse = this.event.request.intent.slots.Answer.value;
        if (answerResponse ===  )
    }

    var rand = myArray[Math.floor(Math.random() * myArray.length)];
};

s3.getObject({
        Bucket: s3bkt,
        Key: s3key
    }, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            callback(err);
        } else {
            console.log("Raw text:\n" + data.Body.toString('ascii'));
            callback(null, null);
        }
    });
*/
