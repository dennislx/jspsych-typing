import { twoLetterPair } from "../utils";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import jspsychKeyboardDisplay from "./jspsych-keyboard-display";


function getVariable(lst){
    const result = [];
    lst.forEach((pair) => {
        let [first, second] = pair.split(',');
        result.push({ choices: [first, second] })
    })
    return result
}

/**
 * description
 */
export class practicePhase {
    constructor({numOfTrial=1, trial_duration=5, fixation_duration=3, num_keypress_display=5, list=[], data={}} = {}) {
        this.numOfTrial = numOfTrial;
        this.num_keypress_display = num_keypress_display;
        this.list = list;
        this.data = data;
        if (list.length == 0){
            // randomly generate ${numOfTrial} two-letter pairs
            this.list = [].concat.apply([], letters.map(a => alphabet.map(b => a + b)));
            this.list = twoLetterPair(numOfTrial);
        } else if (list.length !== numOfTrial){
            throw new Error("Number of elements in defined list should be equal to numOfTrial")
        }
        this.trial_duration = trial_duration * 1000
        this.fixation_duration = fixation_duration * 1000
    }

    getTrial() {
        const timeline = []
        // push fixation
        timeline.push({
            on_start: (trial) => {
                let [a,b] = trial.stimulus;
                trial.stimulus = `<p>type ${a} and then ${b} as many as you can</p>`;
            },
            type: HtmlKeyboardResponsePlugin,
            stimulus: jsPsych.timelineVariable("choices"),
            choices: "NO_KEYS",
            trial_duration: this.fixation_duration,
            data: {phase: "practice_fixation"}
        })
        // push practice
        timeline.push({
            on_start: (trial) => {
                let [a,b] = trial.choices;
                trial.prompt = `<p>type ${a} and then ${b} as many as you can</p>`;
            },
            type: jspsychKeyboardDisplay,
            stimulus: "",
            choices: jsPsych.timelineVariable("choices"),
            remain_time_display: true,
            num_keypress_display: this.num_keypress_display,
            response_ends_trial: false,
            data: this.data,
            trial_duration: () => this.trial_duration,
        })
        return {
            timeline: timeline,
            timeline_variables: getVariable(this.list),
            randomize_order: true
        }
    }
}