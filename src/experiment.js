import "jspsych/css/jspsych.css";
import "./style.css";
import jsPsych from "./prepare";
import jsPsychPipe from '@jspsych-contrib/plugin-pipe';
import jsPsychSurveyLikert from '@jspsych/plugin-survey-likert';
import jsPsychSurveyMultiChoice from '@jspsych/plugin-survey-multi-choice';

import { readYaml, checkEmpty, fullScreenHandler, exportData, JSON2CSV} from "./utils";
import {practicePhase, renderPlugin, bonusInstruction, bonusPhase, DICT} from "./jspsych-typing";


// read configurations
const args = await readYaml('configs/default.yaml');


// obtain subject id and assign their group condition 
const subject_id = jsPsych.randomization.randomID(10);
const streakType = ['binary streak', 'continuous streak'][Math.floor(Math.random() * 2)];
args.condition = jsPsych.randomization.repeat([streakType, 'binary'], 1);
console.log(args.condition);

let PROLIFIC_PID = jsPsych.data.getURLVariable("PROLIFIC_PID");
if (!PROLIFIC_PID) { PROLIFIC_PID = 0}

jsPsych.data.addProperties({
    date: new Date(),
    subject_id: subject_id,
    game_1: args.condition[0],
    game_2: args.condition[1],
    PROLIFIC_PID: PROLIFIC_PID,
});
console.log(`you are in group ${args.condition}`);


// dv constructor functions
const zeroToExtremely = ["0<br>A little", '1', '2', '3', '4', '5', '6', '7', '8', '9', "10<br>Extremely"];
const zeroToALot = ['0<br>A little', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10<br>A lot'];

const MakeFlowQs = function(order) {
    this.type = jsPsychSurveyLikert;
    this.preamble = `<div style='padding-top: 50px; width: 850px; font-size:16px'>

    <p>Thank you for completing the ${order} version of the typing task! Now we want to know:<br><strong>To what extent did you feel immersed and engaged in the ${order} version of the typing task?</strong></p>
    <p>To report how immersed and engaged you felt in the ${order} version of the typing task,<br>please answer the following questions as honestly as possible.</p>`;
    this.questions = [
        {prompt: `During the ${order} version of the typing task, how <strong>absorbed</strong> did you feel in what you were doing?`,
        name: `absorbed_${order}`,
        labels: ["0<br>Not very absorbed", '1', '2', '3', '4', '5', '6', '7', '8', '9', "10<br>More absorbed than I've ever felt"]},
        {prompt: `During the ${order} version of the typing task, how <strong>immersed</strong> did you feel in what you were doing?`,
        name: `immersed_${order}`,
        labels: ["0<br>Not very immersed", '1', '2', '3', '4', '5', '6', '7', '8', '9', "10<br>More immersed than I've ever felt"]},
        {prompt: `During the ${order} version of the typing task, how <strong>engaged</strong> did you feel in what you were doing?`,
        name: `engaged_${order}`,
        labels: ["0<br>Not very engaged", '1', '2', '3', '4', '5', '6', '7', '8', '9', "10<br>More engaged than I've ever felt"]},
        {prompt: `During the ${order} version of the typing task, how <strong>engrossed</strong> did you feel in what you were doing?`,
        name: `engrossed_${order}`,
        labels: ["0<br>Not very engrossed", '1', '2', '3', '4', '5', '6', '7', '8', '9', "10<br>More engrossed than I've ever felt"]},
    ];
    this.randomize_question_order = false;
    this.scale_width = 700;
};

const MakeEnjoyQs = function(order) {
    this.type = jsPsychSurveyLikert;
    this.preamble = `<div style='padding-top: 50px; width: 850px; font-size:16px'>

    <p>Below are a few more questions about the ${order} version of the typing task.</p><p>Instead of asking about immersion and
    engagement, these questions ask about <strong>enjoyment</strong>.<br>Report how much you <strong>enjoyed</strong> 
    the ${order} version of the typing task by answering the following questions.</p></div>`;
    this.questions = [
        {prompt: `How much did you <strong>enjoy</strong> the ${order} version of the typing task?`,
        name: `enjoyable_${order}`,
        labels: zeroToALot},
        {prompt: `How much did you <strong>like</strong> the ${order} version of the typing task?`,
        name: `like_${order}`,
        labels: zeroToALot},
        {prompt: `How much did you <strong>dislike</strong> the ${order} version of the typing task?`,
        name: `dislike_${order}`,
        labels: zeroToALot},
        {prompt: `How much <strong>fun</strong> did you have completing the ${order} version of the typing task?`,
        name: `fun_${order}`,
        labels: zeroToALot},
        {prompt: `How <strong>entertaining</strong> was the ${order} version of the typing task?`,
        name: `entertaining_${order}`,
        labels: zeroToExtremely},
    ];
    this.randomize_question_order = false;
    this.scale_width = 700;
};

// timeline
const timeline = [];

// preload assets || preload_conditon determines whether or not we include this procedure
const preload_condition = () => !checkEmpty(args.images_to_preload.images);
timeline.push( renderPlugin({args: args.images_to_preload, conditional_function: preload_condition}) );

// fullscreen if required
const fullscreen_onstart = (trial) => {
    document.addEventListener('fullscreenchange', fullScreenHandler)
};
timeline.push( renderPlugin({args: args.fullscreen, on_start: fullscreen_onstart}));

// consent page
timeline.push( renderPlugin({args: args.consent}))

// instruction page
timeline.push( renderPlugin({args: args.practice_instruction}))

// practice phase
timeline.push( new practicePhase(args.practice).getTrial() )

// bonus phase (first)
timeline.push( bonusInstruction({condition: args.condition[0], ...args.bonus_instruction}))

// bonus phase trials start here (first)
timeline.push( new bonusPhase({condition: args.condition[0], ...args.bonus, first_trial_num: 0}).getTrial() )

timeline.push( new MakeFlowQs('first') );
timeline.push( new MakeEnjoyQs('first') );

// bonus phase (second)
timeline.push( bonusInstruction({condition: args.condition[1], ...args.bonus_instruction_2}))

// bonus phase trials start here (second)
timeline.push( new bonusPhase({condition: args.condition[1], ...args.bonus, first_trial_num: 20}).getTrial() )

timeline.push( new MakeFlowQs('second') );
timeline.push( new MakeEnjoyQs('second') );


// debrief

const survey_start = (trial) => {
    trial.pages = [trial.pages];
    const data = jsPsych.data.get();
    const successArray = data.filter({phase: 'bonus'}).select('success').values;
    const totalSuccess_1 = successArray.slice(0, 20).reduce((a,b)=>a+b,0);
    const totalSuccess_2 = successArray.slice(19, 40).reduce((a,b)=>a+b,0);
    const totalSuccess = totalSuccess_1 + totalSuccess_2;
    const threesArray = data.filter({phase: 'bonus_feedback_score'}).select('bonus').values;
    const totalThrees_1 = threesArray.slice(0, 20).reduce((a,b)=>a+b,0);
    const totalThrees_2 = threesArray.slice(19, 40).reduce((a,b)=>a+b,0);
    let totalBonus_1 = (totalSuccess_1 * 5) / 100;
    let totalBonus_2 = (totalSuccess_2 * 5) / 100;
    if (args.condition[0] == 'binary streak') { totalBonus_1 = totalThrees_1 / 100 };
    if (args.condition[1] == 'binary streak') { totalBonus_2 = totalThrees_2 / 100 };
    const totalBonus = totalBonus_1 + totalBonus_2;
    trial.data = {
        totalBonus: totalBonus,
        totalSuccess_1: totalSuccess_1,
        totalSuccess_2: totalSuccess_2,
        totalSuccess: totalSuccess,
        phase: 'last_page',
        ...trial.data,
    }
};

timeline.push( renderPlugin({args: args.debrief, on_start: survey_start}));

// save data via DataPiepe
args.pipe_data_to_osf && timeline.push({
    type: jsPsychPipe,
    action: 'save',
    experiment_id: args.osf_id,
    filename: `${subject_id}.csv`,
    data_string: () => {
        const trial_data = jsPsych.data.get();
        const clean_data = exportData(trial_data);
        return JSON2CSV([clean_data]);
    },
})

jsPsych.opts.show_progress_bar = args.show_progress_bar;
// $('div#jspsych-content').css({max-width: `${args.screenwidth} px`}); can achieve similar result
jsPsych.opts.experiment_width = args.screenwidth;
jsPsych.opts.on_finish = () => {
    const data = jsPsych.data.get();
    const successArray = data.filter({phase: 'bonus'}).select('success').values;
    const totalSuccess_1 = successArray.slice(0, 20).reduce((a,b)=>a+b,0);
    const totalSuccess_2 = successArray.slice(19, 40).reduce((a,b)=>a+b,0);
    const threesArray = data.filter({phase: 'bonus_feedback_score'}).select('bonus').values;
    const totalThrees_1 = threesArray.slice(0, 20).reduce((a,b)=>a+b,0);
    const totalThrees_2 = threesArray.slice(19, 40).reduce((a,b)=>a+b,0);
    let totalBonus_1 = (totalSuccess_1 * 5) / 100;
    let totalBonus_2 = (totalSuccess_2 * 5) / 100;
    if (args.condition[0] == 'binary streak') { totalBonus_1 = totalThrees_1 / 100 };
    if (args.condition[1] == 'binary streak') { totalBonus_2 = totalThrees_2 / 100 };
    console.log(successArray, totalSuccess_1, totalSuccess_2, threesArray, totalThrees_1, totalThrees_2, totalBonus_1, totalBonus_2)
    const totalBonus = totalBonus_1 + totalBonus_2;
    document.body.innerHTML = args.thank_you_msg.replaceAll('${totalBonus}', totalBonus.toFixed(2));
    setTimeout(function() { 
        location.href = `https://app.prolific.co/submissions/complete?cc=C1B3XSBB`
    }, 3000); // 2 seconds
}
jsPsych.run(timeline);
