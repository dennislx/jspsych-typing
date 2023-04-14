import "jspsych/css/jspsych.css";
import "./style.css";
import jsPsych from "./prepare";
import jsPsychPipe from '@jspsych-contrib/plugin-pipe';
import jsPsychSurveyLikert from '@jspsych/plugin-survey-likert';

import { readYaml, checkEmpty, fullScreenHandler, exportData, JSON2CSV} from "./utils";
import {practicePhase, renderPlugin, bonusInstruction, bonusPhase, DICT} from "./jspsych-typing";


// read configurations
const args = await readYaml('configs/default.yaml');


// obtain subject id and assign their group condition 
const subject_id = jsPsych.randomization.randomID(10); 
const condition = await jsPsychPipe.getCondition(args.osf_id);
// const condition = jsPsych.randomization.randomInt(0, 2);
args.condition = ['binary streak', 'continuous streak', 'binary'][condition];

jsPsych.data.addProperties({
    date: new Date(),
    subject_id: subject_id,
    condition: args.condition
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

    <p>Thank you for completing the bonus round of the typing task!</strong></p>

    <p>During the <strong>bonus round</strong>, to what extent did you feel immersed 
    and engaged in what you were doing?<br>Report how immersed and engaged you felt by 
    answering the following questions.</p></div>`,
    questions: [
        {prompt: `During the <strong>bonus round</strong>, to what extent did you feel absorbed in what you were doing?`,
        name: `absorbed`,
        labels: zeroToExtremely},
        {prompt: `During the <strong>bonus round</strong>, to what extent did you feel immersed in what you were doing?`,
        name: `immersed`,
        labels: zeroToExtremely},
        {prompt: `During the <strong>bonus round</strong>, to what extent did you feel engaged in what you were doing?`,
        name: `engaged`,
        labels: zeroToExtremely},
        {prompt: `During the <strong>bonus round</strong>, to what extent did you feel engrossed in what you were doing?`,
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

    <p>Below are a few more questions about the <strong>bonus round</strong> of the typing task.</p><p>Instead of asking about immersion and
    engagement, these questions ask about <strong>enjoyment</strong>.<br>Report how much you <strong>enjoyed</strong> 
    the <strong>bonus round</strong> by answering the following questions.</p></div>`,
    questions: [
        {prompt: `How much did you enjoy completing the <strong>bonus round</strong>?`,
        name: `enjoyable`,
        labels: zeroToALot},
        {prompt: `How much did you like completing the <strong>bonus round</strong>?`,
        name: `like`,
        labels: zeroToALot},
        {prompt: `How much did you dislike completing the <strong>bonus round</strong>?`,
        name: `dislike`,
        labels: zeroToALot},
        {prompt: `How much fun did you have completing the <strong>bonus round</strong>?`,
        name: `fun`,
        labels: zeroToALot},
        {prompt: `How entertaining was the <strong>bonus round</strong>?`,
        name: `entertaining`,
        labels: zeroToExtremely},
    ],
    randomize_question_order: false,
    scale_width: 500,
};

timeline.push(enjoyQs);

// debrief

const survey_start = (trial) => {
    trial.pages = [trial.pages]
}
timeline.push( renderPlugin({args: args.debrief, on_start: survey_start}));

const lastpage_start = (trial) => {
    const data = jsPsych.data.get()
    const totalBonus = +data.filter({phase: 'bonus_feedback_score'}).select('bonus').sum().toFixed(2);
    const totalSuccess = +data.filter({phase: 'bonus'}).select('success').sum();
    trial.data = {
        totalBonus: totalBonus,
        totalSuccess: totalSuccess,
        phase: 'last_page',
        ...trial.data,
    }
    trial.preamble = trial.preamble.replaceAll('${totalBonus}', totalBonus);
}
timeline.push( renderPlugin({args: args.lastpage, on_start: lastpage_start}));

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
    document.body.innerHTML = args.thank_you_msg;
    setTimeout(function() { 
        location.href = `https://app.prolific.co/submissions/complete?cc=${args.prolific_id}`
    }, 2000); // 2 seconds
}
jsPsych.run(timeline);
