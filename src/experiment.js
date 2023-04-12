import "jspsych/css/jspsych.css";
import "./style.css";
import jsPsych from "./prepare";
import jsPsychPipe from '@jspsych-contrib/plugin-pipe';
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
