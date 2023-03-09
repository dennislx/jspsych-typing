import "jspsych/css/jspsych.css";
import "./style.css";
import jsPsych, {dict} from "./prepare"
import { readYaml, checkEmpty, renderPlugin, fullScreenHandler, createTable} from "./utils";
import * as intro from "./trials/intro"
import {practicePhase} from "./trials/jspsych-typing";


// read configurations
const args = await readYaml('configs/default.yaml')

// group condition and global data
args.condition = jsPsych.randomization.sampleWithoutReplacement(
    ['binary streak', 'continuous streak', 'binary framing'], 1
)
jsPsych.data.addProperties({
    date: new Date(),
    condition: args.condition
});

// timeline
const timeline = []

// preload assets
if (!checkEmpty(args.images_to_preload)) {
    timeline.push({
        type: dict['preload'],
        images:args.images_to_preload
    })
}

// fullscreen if required
if (args.fullscreen) {
    timeline.push({ type: dict['fullscreen'], })
    document.addEventListener('fullscreenchange', fullScreenHandler)
}

// consent page
timeline.push( renderPlugin(args.consent, dict))

// instruction page
timeline.push( renderPlugin(args.practice_instruction, dict))

// practice phases
timeline.push( new practicePhase(args.practice).getTrial())

// temporarily for verification purpose
const func = () => {
    const data = [...Object.values(jsPsych.data.get().filter({phrase: 'practice'}))][0];
    if (!checkEmpty(data)){
        const column = ['rt_valid','rt_typed','typed','score'];
        const table = createTable(data, column);
        $(".jspsych-content-wrapper").html(table);
    }
}
timeline.push( renderPlugin(args.practice_end, dict, undefined, func) )

// bonus phase instruction
timeline.push( renderPlugin(args.bonus_instruction, dict, args.condition)) 




jsPsych.opts.show_progress_bar = args.show_progress_bar
jsPsych.run(timeline)
