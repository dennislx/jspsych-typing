import keyboardResponse from "@jspsych/plugin-html-keyboard-response"
import { ParameterType } from "jspsych";
import { countDownTimer, displayKeysList, keysPressed, checkEmpty } from "../utils";

const info = {
    name: "html-display-response",
    parameters: {
        /**
         * The HTML string to be displayed.
         */
        stimulus: {
            type: ParameterType.HTML_STRING,
            pretty_name: "Stimulus",
            default: undefined,
        },
        /**
         * Array containing the key(s) the subject is allowed to press to respond to the stimulus.
         */
        choices: {
            type: ParameterType.KEYS,
            pretty_name: "Choices",
            default: "ALL_KEYS",
        },
        /**
         * Any content here will be displayed below the stimulus.
         */
        prompt: {
            type: ParameterType.HTML_STRING,
            pretty_name: "Prompt",
            default: null,
        },
        /**
         * How long to show the stimulus.
         */
        stimulus_duration: {
            type: ParameterType.INT,
            pretty_name: "Stimulus duration",
            default: null,
        },
        /**
         * How long to show trial before it ends.
         */
        trial_duration: {
            type: ParameterType.INT,
            pretty_name: "Trial duration",
            default: null,
        },
        /**
         * If true, trial will end when subject makes a response.
         */
        response_ends_trial: {
            type: ParameterType.BOOL,
            pretty_name: "Response ends trial",
            default: true,
        },
        /**
         * How many recent keyboard presses are displayed
         *      by default, no history is displayed
         */
        num_keypress_display: {
            type: ParameterType.INT,
            pretty_name: "Keyboard presses number",
            default: 0,
        },
        /**
         * The correct order of keyboard presses
         */
        remain_time_display: {
            type: ParameterType.BOOL,
            pretty_name: "Buttom right will display the remaining time from trial duration",
            default: false,
        }
    }
};



/**
 * **An extension of keyboard response plugin**
 *
 * the purposes of this plugin are two folds:
 * 1) allow to collect multiple responses during one trial
 * 2) allow to display the last n keyboard presses
 * 
 * @author Xiang Liu
 * @email dennisl@udel.edu
 */
class HtmlKeyboardDisplayResponsePlugin extends keyboardResponse {
    /**
     * 
     * @param {HTML string} stimulus    The html elements to be displayed.
     * @param {string[]} choices        The array contains keys to respond to stimulus
     * @param {HTML string} prompt           The content displayed below the stimulus (e.g., reminder)
     * @param {numeric} stimulus_duration    How long to display the stimulus in milliseconds
     * @param {numeric} trial_duration       How long will the trial wait for a keyboard response (inf if set to null)
     * @param {boolean} response_ends_trial  Whether the trial ends immediately when a response is made
     * @param {numeric} num_keypress_display How many recent keyboard presses are displayed
     * @param {boolean} remain_time_display  Whether the remaining trial duration will be displayed in seconds
     */

    trial(display_element, trial) {
        var new_html = `
        <div id="jspsych-html-keyboard-response-stimulus" style="display: flex; flex-direction: column"> 
            <h1 id="keypress-count"></h2>
            <table class="response-display-wrapper">
            <tr class="row-time"> <td>time left: </td> <td><span id="keypress-timer">${trial.trial_duration/1000} sec</span></td></tr>
            <tr class="row-hist"> <td>you typed: </td> <td> <ul id="keypress-hist"> </ul></td></tr>
            </table>
        </div>`;
        // add prompt
        new_html += trial.prompt || "";
        // draw
        display_element.innerHTML = new_html;
        // data saving
        var response = {
            rt_valid: null, rt_typed: null, typed: 0, score: 0,
        };
        // function to end trial when it is time
        const end_trial = () => {
            // kill any remaining setTimeout handlers
            this.jsPsych.pluginAPI.clearAllTimeouts();
            // kill keyboard listeners
            if (typeof validKeyListener !== "undefined") {
                this.jsPsych.pluginAPI.cancelKeyboardResponse(validKeyListener);
            }
            if (typeof typedKeyListener !== "undefined") {
                this.jsPsych.pluginAPI.cancelKeyboardResponse(typedKeyListener);
            }
            // kill keydown listener to detect keyboard press
            if (typeof keyboardHistory !== "undefined"){
                document.removeEventListener('keydown', keyboardHistory, true)
            }
            // gather the data to store for the trial
            var trial_data = {
                rt_valid: response.rt_valid,
                rt_typed: response.rt_typed,
                typed: response.typed,
                score: response.score
            };
            // clear the display
            display_element.innerHTML = "";
            // move on to the next trial
            this.jsPsych.finishTrial(trial_data);
        };
        // function to handle responses by the subject
        let i = 0, n = trial.choices.length;
        var after_valid_response = (info) => {
            // after a valid response, the stimulus will have the CSS class 'responded'
            // which can be used to provide visual feedback that a response was recorded
            display_element.querySelector("#jspsych-html-keyboard-response-stimulus").className +=
                " responded";
            if (response.score === 0) { //only record the first reaction time to start valid typing
                response.rt_valid = info.rt 
            }
            // if we have the right typing in order, we score a point
            if (jsPsych.pluginAPI.compareKeys(info.key, trial.choices[i])) {
                response.score++;
                $("#keypress-count").html(response.score.toString());
                keysPressed.push(true);
                i = (i+1)%n;
            }
            if (trial.response_ends_trial) { 
                end_trial(); 
            }
        };
        
        var after_typed_response = (info) => {
            /* Here I am counting all keyboard press behaviors
            */
           if (response.typed === 0){ //only record the first raction time to start typing, valid or invalid
            response.rt_typed = info.rt;
           };
           response.typed++;
        };

        // start a timer if necesary
        if (trial.remain_time_display){
            $('tr.row-time').css('visibility', 'visible');
            countDownTimer('keypress-timer')
        }
        
        // start a listener that display keyboard press history
        if (trial.num_keypress_display > 0){
            $('tr.row-hist').css('visibility', 'visible');
            var keyboardHistory = displayKeysList("keypress-hist", trial.num_keypress_display)
        }
        // start the response listener
        if (trial.choices != "NO_KEYS") {
            $('.row-count').css('visibility', 'visible');
            var validKeyListener = this.jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: after_valid_response,
                valid_responses: trial.choices,
                rt_method: "performance",
                persist: !trial.response_ends_trial,
                allow_held_key: false,
            });
            var typedKeyListener = this.jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: after_typed_response,
                rt_method: "performance",
                persist: !trial.response_ends_trial,
                allow_held_key: false,
            })
        }

        // hide stimulus if stimulus_duration is set
        if (trial.stimulus_duration !== null) {
            this.jsPsych.pluginAPI.setTimeout(() => {
                $('#jspsych-html-keyboard-response-stimulus').css('visibility', 'hidden')
            }, trial.stimulus_duration);
        };

        // end trial if trial_duration is set
        if (trial.trial_duration !== null) {
            this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
        }

    }
}
HtmlKeyboardDisplayResponsePlugin.info = info;


export { HtmlKeyboardDisplayResponsePlugin as default };