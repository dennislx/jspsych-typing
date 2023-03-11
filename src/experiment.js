import "jspsych/css/jspsych.css";
import "./style.css";
import jsPsych from "./prepare"
import { readYaml, checkEmpty, fullScreenHandler} from "./utils";
import {practicePhase, renderPlugin, bonusInstruction, bonusPhase} from "./trials/jspsych-typing";



// read configurations
const args = await readYaml('configs/default.yaml')

// group condition and global data
args.condition = jsPsych.randomization.sampleWithoutReplacement(
    ['binary streak', 'continuous streak', 'binary'], 1
)
jsPsych.data.addProperties({
    date: new Date(),
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
$('div#jspsych-content').css('max-width', args.screenwidth);

// consent page
// timeline.push( renderPlugin({args: args.consent}))

// instruction page
// timeline.push( renderPlugin({args: args.practice_instruction}))

// practice phases
timeline.push( new practicePhase(args.practice).getTrial() )


// bonus phase instruction
// timeline.push( bonusInstruction({condition: args.condition, ...args.bonus_instruction}))


// bonus phase trials start here
timeline.push( new bonusPhase({condition: args.condition, ...args.bonus}).getTrial() )



jsPsych.opts.show_progress_bar = args.show_progress_bar
jsPsych.run(timeline)
