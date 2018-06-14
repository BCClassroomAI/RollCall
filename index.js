// This is the roll call  app for Alexa

'use strict';
const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");
//const config = require("./user-config.json");
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
    // alexa.appId = config.appID;
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
    console.log("Getting a random quiz question.");
    if (questions.has(questionSet)) {
	const qs = questions.get(questionSet);
        const randomIndex = Math.floor(Math.random() * qs.length);
	while (this.attributes.question == qs[randomIndex] && qs.length !== 1) {
	    const randomIndex = Math.floor(Math.random() * qs.length);
	}
        return qs[randomIndex];
    } else {
        return {question: "BLANK", answer: "BLANK"};
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
        let speechOutput = 'I did not understand that command. Please try again.';

        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },

    //Custom Intents
    'GroupPresent': function () {

        initializeCourses(this.attributes);
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

        let currentDialogState = this.event.request.dialogState;
        if (currentDialogState !== 'COMPLETED') {

            this.emit(':delegate');

        } else if (!this.attributes.courses.hasOwnProperty(this.event.request.intent.slots.courseNumber.value)) {

            const slotToElicit = 'courseNumber';
            const speechOutput = 'Please provide a valid course number.';
            this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);

        } else {

            const courseNumber = this.event.request.intent.slots.courseNumber.value;
            const groupNumber = parseInt(this.event.request.intent.slots.groupNumber.value);
            presentList = []; // reset presentList

            // Adds students in random order to presentation list if student is not already in list
            let j = 0;
            while (j < this.attributes.courses[courseNumber].length) {
                let randomIndex = Math.floor(Math.random() * this.attributes.courses[courseNumber].length);
                let randomStudent = this.attributes.courses[courseNumber][randomIndex];

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
                let eachGroup = [];
                const groupList = [];

                if (this.attributes.courses[courseNumber].length % groupNumber === 0) {
                    groups = this.attributes.courses[courseNumber].length / groupNumber;
                } else {
                    groups = Math.floor(this.attributes.courses[courseNumber].length / groupNumber) + 1;
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

            this.response.speak(speechOutput);
            this.emit(':responseReady');
        }
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
	console.log("**** Quiz Question Intent Triggered");
        const slotObj = this.event.request.intent.slots;

        let currentDialogState = this.event.request.dialogState;
	console.log("**** Dialog State: " + currentDialogState);
	
        if (currentDialogState !== 'COMPLETED') {
	    console.log(slotObj.questionSet.value);

            if (!slotObj.questionSet.value) {
		console.log("**** Getting the question set");
                const slotToElicit = 'questionSet';
                const speechOutput = 'What is the question set number?';
                this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
            } else {
		if (!questions.has(slotObj.questionSet.value)) {
		    console.log("**** Getting a valid question set");
                    const slotToElicit = 'questionSet';
                    const speechOutput = 'Please provide a valid questionSet.';
                    this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);
		}
	    }
        }
	this.attributes.questionSet = this.event.request.intent.slots.questionSet.value;
	console.log("Got the question set. It's " + this.attributes.questionSet);
	this.attributes['question'] = randomQuizQuestion(this.attributes.questionSet);
	console.log("**** Question: " + this.attributes['question'].question);

        this.response.speak(this.attributes.question.question).listen(this.attributes.question.question);
	console.log('Here');
        this.emit(":responseReady");
	
    },

    'AnswerIntent': function () {
	console.log("**** Answer Intent Started");
	console.log("**** Question: " + this.attributes.question.question + ". Answer: " + this.attributes.question.answer);

	const correctAnswer = this.attributes.question.answer;
	
	if (!this.event.request.intent.slots.testAnswers.value) {
	    this.reponse.speak('The answer is ' + correctAnswer);
	    this.emit(':responseReady');
	} else {
	    const userAnswer = this.event.request.intent.slots.testAnswers.value;
	    console.log("**** User Answer: " + userAnswer);
            this.attributes.question = randomQuizQuestion(this.attributes.questionSet);

            if (userAnswer === correctAnswer) {
		this.response.speak('Nice job! The correct answer is ' + correctAnswer + '<break strength = "medium"/>' + 'Here is your next question' +
				    this.attributes.question.question).listen(this.attributes.question.question);
            } else {
		this.response.speak('Ryan, you dummy, the correct answer is ' + correctAnswer + '<break strength = "medium"/>' + 'Here is your next question' +
				    this.attributes.question.question).listen(this.attributes.question.question);
            }
            this.emit(':responseReady');
	}
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
