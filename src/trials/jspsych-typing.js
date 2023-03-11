import { twoLetterPair, checkEmpty, createTable } from "../utils";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import SurveyMultiSelectPlugin from "@jspsych/plugin-survey-multi-select";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import InstructionsPlugin from "@jspsych/plugin-instructions";
import jspsychKeyboardDisplay from "./jspsych-keyboard-display";
import SurveyMultiChoicePlugin from "@jspsych/plugin-survey-multi-choice";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";

export const DICT = {
    'preload': PreloadPlugin,
    'checkbox': SurveyMultiSelectPlugin,
    'choice': SurveyMultiChoicePlugin,
    'fullscreen': FullscreenPlugin,
    'instruct': InstructionsPlugin,
    'response': HtmlKeyboardResponsePlugin,
    'display': jspsychKeyboardDisplay,
    'button': HtmlButtonResponsePlugin,
}

function getVariable(lst) {
    const result = [];
    lst.forEach((pair) => {
        let [first, second] = pair.split(',');
        result.push({ choices: [first, second] })
    })
    return result
}

function keypressCallback(info, record, trial, response_history, counter, webpage, end_trial) {
    /**
     * 
     * After a response, update score and history keyboard presses, also judge by whether keyboard press is valid
     * 
     * First we change the class to stimulus so that we can edit css to style its change if necessary
     * 
     * Here we only record time lapses before making the first responses, we assign ${info.rt} to ${response.rt_valid}
     * 
     * In the end, we compare typed key with the expected key from ${trial.choices[i]} (i for alternatiing purpose) to update score
     */
    webpage.querySelector("#jspsych-html-keyboard-response-stimulus").className += " responded";
    if (record.score === 0) {
        record.rt_valid = info.rt;
    }
    if (record.typed === 0) {
        record.rt_typed = info.rt;
    }
    let i = counter.i % trial.choices.length;
    if (jsPsych.pluginAPI.compareKeys(info.key, trial.choices[i])) {
        // if participants press the correct key in correct order
        record.score++;
        counter.i++;
        // update html to show improved score
        $("#keypress-count").html(record.score.toString());
        // add a node to help display this choice
        response_history.push({key: info.key, color: 'green'})
    } else {
        // if participants press the wrong key or in wrong order
        // add a node to help display this choice
        response_history.push({key: info.key, color: 'red'})
    }
    /**
     * if trial.num_keypress_display > 0, display histories of keyboard pressings
     */
    if (trial.num_keypress_display > 0) {
        if (response_history.length > trial.num_keypress_display) {
            response_history.shift(); //remove first (oldestl) element from array
        }
        let keysList = document.getElementById("keypress-hist");
        keysList.innerHTML = '';
        response_history.forEach(function(hist){
            let li = document.createElement('li');
            li.textContent = hist.key;
            li.style.color = hist.color;
            keysList.appendChild(li);
        });
    }
    record.typed++;
    /**
     * end the trial if 
     */
    if (trial.response_ends_trial) { 
        end_trial()
    }
};


/**
 * This function helps to render jspsych compatiple plugins from yaml configurations
 * 
 * @param
 */
export function renderPlugin({
    args = {}, on_start = undefined, on_load = undefined, on_finish = undefined,
    conditional_function = undefined, loop_function = undefined
} = {}) {
    args.type = DICT[args.type]
    args = {
        on_start: on_start, on_finish: on_finish, on_load: on_load, ...args
    }
    if ([conditional_function, loop_function].some(x => typeof x !== "undefined")) {
        return {
            timeline: args, conditional_function: conditional_function, loop_function: loop_function
        }
    }
    return args
}


export function bonusInstruction({
    instruction = "", instruction_by_groups = {}, questions = [], condition = "",
    randomize_order = true, data = {}, feedback_success = "success", feedback_failure = "failure",
} = {}) {

    let correct = false;

    const welcome = {
        type: InstructionsPlugin,
        pages: ["".concat(
            "<div class='instruction'>", instruction, instruction_by_groups[condition], "</div>"
        )],
        show_clickable_nav: true
    };

    const comprehension = {
        type: SurveyMultiChoicePlugin,
        questions: questions.map(x => ({ ...x, required: true })),
        randomize_question_order: randomize_order,
        on_finish: function (data) {
            let { Q0, Q1, Q2 } = data.response;
            data.pass = correct = [
                Q0.includes("At least"),
                Q1.endsWith(condition === "binary streak" ? "0.00" : "0.20"),
                Q2.endsWith("0.30")
            ].every(Boolean)
        },
    };

    const feedback = {
        type: HtmlButtonResponsePlugin,
        stimulus: "",
        on_start: (trial) => {
            trial.stimulus = correct ? feedback_success : feedback_failure
        },
        choices: ["Continue"]
    };

    return {
        timeline: [welcome, comprehension, feedback],
        loop_function: (data) => {
            return !data.select('pass').values[0]; //or simple correct!
        },
        data: data
    }
}


/**
 * This class defines contents of practice phase
 * 
 * @param {numeric} numOfTrial           The number of total trials during the practice stage
 * @param {numeric} trial_duration       An integer indicates the time (in seconds) before time out
 * @param {numeric} num_keypress_display The number of past keyboard pressings to be displayed, hide if set to zero
 * @param {string[]} list                A list of two-letter pairs be serve as correct responses (in sequential order) at each practice trial
 * @param {object} data                  What additional data should the trial store
 * @param {numeric} fontsize             Fontsize of displayed stimulus
 */
export class practicePhase {
    constructor({ numOfTrial = 1, trial_duration = 5, fixation_duration = 3, num_keypress_display = 0, fontsize = "", no_prompt = false, show_stat = false, list = [], data = {} } = {}) {
        this.numOfTrial = numOfTrial;
        this.num_keypress_display = num_keypress_display;
        this.data = data;
        this.fontsize = fontsize;
        this.no_prompt = no_prompt;
        this.show_stat = show_stat;
        if (list.length < numOfTrial) {
            // randomly generate ${numOfTrial} two-letter pairs
            const n = list.length;
            this.list = list.concat(twoLetterPair(numOfTrial-n));
        };
        this.list = list.slice(0, numOfTrial);
        this.trial_duration = trial_duration * 1000;
        this.fixation_duration = fixation_duration * 1000;
        this.phase = 'practice';
    }

    getFixation(timeline) {
        timeline.push({
            on_start: (trial) => {
                let [a, b] = trial.stimulus;
                trial.stimulus = `<p>type ${a} and then ${b} as many times as possible</p>`;
            },
            type: HtmlKeyboardResponsePlugin,
            stimulus: jsPsych.timelineVariable("choices"),
            choices: "NO_KEYS",
            trial_duration: this.fixation_duration,
            data: { phase: `${this.phase}_fixation` },
        });
        timeline.push({
            type: HtmlKeyboardResponsePlugin,
            stimulus: "<div style='font-size: 72px'>+</div>",
            choices: "NO_KEYS",
            trial_duration: 1000,
            data: { phase: `${this.phase}_fixation` },
        });
    }

    getFeedback(timeline) {
        const on_load = () => {
            const data = [...Object.values(jsPsych.data.get().filter({ phrase: 'practice' }))][0];
            if (!checkEmpty(data)) {
                const selected_column = ['rt_valid', 'rt_typed', 'typed', 'score'];
                const table = createTable(data, selected_column);
                const stats = jsPsych.data.get().filter({ phrase: 'practice' }).select('score').mean()
                if (this.show_stat) {
                    $("div.jspsych-content").prepend(table);
                    jsPsych.getCurrentTrial().data.avg_score = stats;
                } else {
                    jsPsych.finishTrial({ avg_score: stats });
                };
            };
        };
        timeline.push({
            type: HtmlButtonResponsePlugin,
            on_load: on_load,
            stimulus: "",
            data: { phase: "statistics" },
            choices: ["Continue"],
        });
    }

    getStimulusOnStart(trial){
        let [a, b] = trial.choices;
        trial.prompt = this.no_prompt ? "" : `<p id="display-prompt">type ${a} and then ${b} as many times as possible</p>`;
    }

    getStimulusCallback(){
        const cb = [];
        cb.push({
            callback_function: keypressCallback, 
            accept_allkeys: true, 
        });
        return cb
    }

    getStimulus(timeline) {
        timeline.push({
            on_start: (trial) => this.getStimulusOnStart(trial),
            type: jspsychKeyboardDisplay,
            stimulus: "",
            choices: jsPsych.timelineVariable("choices"),
            remain_time_display: true,
            num_keypress_display: this.num_keypress_display,
            response_ends_trial: false,
            data: this.data,
            trial_duration: () => this.trial_duration,
            response_callbacks: this.getStimulusCallback(),
        })
    }

    getTrial() {
        const timeline = [];
        // push fixation
        this.getFixation(timeline);
        // push practice
        this.getStimulus(timeline);
        // push feedback
        this.getFeedback(timeline);
        return {
            timeline: timeline,
            timeline_variables: getVariable(this.list),
            randomize_order: true,
            on_timeline_start: () => {
                $('div#jspsych-content').css({ "font-size": this.fontsize });
            },
            on_timeline_finish: () => {
                $('div#jspsych-content').css({ "font-size": "" });
            },
            conditional_function: () => this.numOfTrial > 0
        }
    }
}

export class bonusPhase extends practicePhase {
    constructor({ numOfTrial = 1, trial_duration = 5, fixation_duration = 3, fontsize = "", no_prompt = false, list = [], data = {}, target_dist = {} } = {}) {
        super({ numOfTrial: numOfTrial, trial_duration: trial_duration, fixation_duration: fixation_duration, fontsize: fontsize, no_prompt: no_prompt, list: list, data: data });
        this.dist = target_dist[target_dist.choice];
        this.phase = "bonus";
        this.bonus = 0;
    }

    getStimulusOnStart(trial){
        /**
         * we also need to instantiate the target score threshold at the beginning of exp.
         */
        super.getStimulusOnStart(trial);
        

    }

    getStimulusCallback(){
        /**
         * we need to tell if valid press has surpassed target threshold
         */
    }
}