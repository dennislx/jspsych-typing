import "jspsych/css/jspsych.css";
import "./style.css";
import jsPsych from "./prepare"
import jsPsychPipe from '@jspsych-contrib/plugin-pipe';
import { readYaml, checkEmpty, fullScreenHandler} from "./utils";
import {practicePhase, renderPlugin, bonusInstruction, bonusPhase, DICT} from "./jspsych-typing";



// read configurations
const args = await readYaml('configs/default.yaml');

// obtain subject id and assign their group condition 
const subject_id = jsPsych.randomization.randomID(10); 
const condition = await jsPsychPipe.getCondition(args.exp_id);
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
const debrief = [];
args.debrief.timeline.map(e => {
    e.type = DICT[e.type];
    if (e.name === "email"){
        e.on_start = (trial) => {
            const totalBonus = jsPsych.data.get().filter({phase: 'bonus_feedback'}).select('bonus').sum();
            trial.preamble = trial.preamble.replaceAll('${totalBonus}', totalBonus);
        }
    }
    debrief.push(e);
});
timeline.push({
    timeline: debrief
})

// save data via DataPiepe
timeline.push({
    type: jsPsychPipe,
    action: 'save',
    experiment_id: args.exp_id,
    filename: `${subject_id}.csv`,
    data_string: () => {
        const data = jsPsych.data.get().csv();
        return data;
    },
    on_finish: () => {
        document.body.innerHTML = `
        <div align='center' style="margin: 10%">
            <p>Thank you for participating in the study!<p>
            <p>You may close your window now<p> 
        </div>
        `
    }
})

jsPsych.opts.show_progress_bar = args.show_progress_bar;
// $('div#jspsych-content').css({max-width: `${args.screenwidth} px`}); can achieve similar result
jsPsych.opts.experiment_width = args.screenwidth;
jsPsych.run(timeline);
