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
const condition = await jsPsychPipe.getCondition(args.osf_id);
// const condition = jsPsych.randomization.randomInt(0, 2);
args.condition = ['binary streak', 'continuous streak', 'binary'][condition];

let PROLIFIC_PID = jsPsych.data.getURLVariable("PROLIFIC_PID");
if (!PROLIFIC_PID) { PROLIFIC_PID = 0}

jsPsych.data.addProperties({
    date: new Date(),
    subject_id: subject_id,
    condition: args.condition,
    PROLIFIC_PID: PROLIFIC_PID,
});
console.log(`you are in group ${args.condition}`);

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

// bonus phase
timeline.push( bonusInstruction({condition: args.condition, ...args.bonus_instruction}))


// bonus phase trials start here
timeline.push( new bonusPhase({condition: args.condition, ...args.bonus}).getTrial() )

// create questionnaires and push to timeline



const zeroToExtremely = ['0<br>A little', '1', '2', '3', '4', '5', '6', '7', '8<br>Extremely'];
const zeroToALot = ['0<br>A little', '1', '2', '3', '4', '5', '6', '7', '8<br>A lot'];
const flowQs = {
    type: jsPsychSurveyLikert,
    preamble: `<div style='padding-top: 50px; width: 850px; font-size:16px'>

    <p>Thank you for completing the typing task! Now we want to know:<br><strong>To what extent did you find the typing task immersive and engaging?</strong></p>
    <p>There are no right or wrong answers to the following questions. Different people experience different levels of immersion and engagement during the typing task. 
    We're interested in how much immersion and engagement <i>you</i> experienced, whether it was a lot or a little. 
    So, please answer the following questions as honestly as possible.</p>
    <p><i>You will receive full payment regardless of your answers to the following questions</i></div>.`,
    questions: [
        {prompt: `During the typing task, to what extent did you feel <strong>absorbed</strong> in what you were doing?`,
        name: `absorbed`,
        labels: zeroToExtremely},
        {prompt: `During the typing task, to what extent did you feel <strong>immersed</strong> in what you were doing?`,
        name: `immersed`,
        labels: zeroToExtremely},
        {prompt: `During the typing task, to what extent did you feel <strong>engaged</strong> in what you were doing?`,
        name: `engaged`,
        labels: zeroToExtremely},
        {prompt: `During the typing task, to what extent did you feel <strong>engrossed</strong> in what you were doing?`,
        name: `engrossed`,
        labels: zeroToExtremely},
    ],
    randomize_question_order: false,
    scale_width: 500,
};

timeline.push(flowQs);

const enjoyQs = {
    type: jsPsychSurveyLikert,
    preamble: `<div style='padding-top: 50px; width: 850px; font-size:16px'>

    <p>Below are a few more questions about the typing task.</p><p>Instead of asking about immersion and
    engagement, these questions ask about <strong>enjoyment</strong>.<br>Report how much you <strong>enjoyed</strong> 
    the typing task by answering the following questions.</p></div>`,
    questions: [
        {prompt: `How much did you <strong>enjoy</strong> the typing task?`,
        name: `enjoyable`,
        labels: zeroToALot},
        {prompt: `How much did you <strong>like</strong> the typing task?`,
        name: `like`,
        labels: zeroToALot},
        {prompt: `How much did you <strong>dislike</strong> the typing task?`,
        name: `dislike`,
        labels: zeroToALot},
        {prompt: `How much <strong>fun</strong> did you have completing the typing task?`,
        name: `fun`,
        labels: zeroToALot},
        {prompt: `How <strong>entertaining</strong> was the typing task?`,
        name: `entertaining`,
        labels: zeroToExtremely},
    ],
    randomize_question_order: false,
    scale_width: 500,
};

timeline.push(enjoyQs);

const purposeChk = {
  type: jsPsychSurveyMultiChoice,
  questions: [
    {
      prompt: "We asked you several questions about how immersed and engaged you felt during the typing task.<br>What do you think was the purpose of those questions?", 
      name: 'purpose', 
      options: ['To make sure I was paying attention.', 'To measure how immersed and engaged I felt during the typing task.'], 
      required: true
    }, 
  ],
};

timeline.push(purposeChk);

// debrief

const survey_start = (trial) => {
    trial.pages = [trial.pages];
    const data = jsPsych.data.get();
    const totalSuccess = +data.filter({phase: 'bonus'}).select('success').sum();
    let totalBonus;
    if (condition == 'binary streak') {
        totalBonus_raw = +data.filter({phase: 'bonus_feedback_score'}).select('bonus').sum().toFixed(2);
        totalBonus = totalBonus_raw / 100;
    } else {
        totalBonus = totalSuccess / 10;
    };
    trial.data = {
        totalBonus: totalBonus,
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
    const totalSuccess = +data.filter({phase: 'bonus'}).select('success').sum();
    let totalBonus;
    if (condition == 'binary streak') {
        totalBonus_raw = +data.filter({phase: 'bonus_feedback_score'}).select('bonus').sum().toFixed(2);
        totalBonus = totalBonus_raw / 100;
    } else {
        totalBonus = totalSuccess / 10;
    };
    document.body.innerHTML = args.thank_you_msg.replaceAll('${totalBonus}', totalBonus);
    setTimeout(function() { 
        location.href = `https://app.prolific.co/submissions/complete?cc=C1B3XSBB`
    }, 3000); // 2 seconds
}
jsPsych.run(timeline);
