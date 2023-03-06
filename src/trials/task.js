import keyboardResponse from "@jspsych/plugin-html-keyboard-response"
import jsPsych, { settings, stimulus } from "../prepare"
import jsypchKeyboardDisplay from "../parts/jsypch-keyboard-display"

function makeRoundIntro(round){
    return {
        type: keyboardResponse,
        data: {trial_type: `firstRoundIntro_${round}`},
        stimulus: () => {
            if (round == 'R1'){
                return settings.gameTypeOrder == 0  ? `<div style='font-size:35px'><p>Get ready for the first round!</p></div>` : `<div style='font-size:35px'><p>Get ready for the first tile!</p></div>`
            }
            else {
                return settings.gameTypeOrder == 0  ? `<div style='font-size:35px'><p>Get ready for the first tile!</p></div>` : `<div style='font-size:35px'><p>Get ready for the first round!</p></div>`;
            }
        },
        choices: "NO_KEYS",
        trial_duration: 2000
    }
}

export const round1Intro = {
    timeline: [makeRoundIntro('R1')]
}

function makeDelay(round){
    return {
        type: jsypchKeyboardDisplay,
        stimulus: "type d and then k as many as you can",
        choices: ["d","k"],
        remain_time_display: true,
        num_keypress_display: 4,
        response_ends_trial: false,
        trial_duration: () => 250000,
        on_finish: (data) => {
            jsPsych.pluginAPI.compareKeys(data.response, ' ') ? data.TooFast = 1 : data.TooFast = 0;
            data.trial_type = `ITI_${round}`
        },
    }
}



function makeTooFast(round){
    var toofast
    return {
        type: keyboardResponse,
        choices: "NO_KEYS",
        stimulus: function(){
            toofast = jsPsych.data.getLastTrialData().select('TooFast').sum() == 1;
            let msg = `<div style='font-size: 20px'><p>Too Fast!</p><p>Please wait for the tile to appear 
            before pressing your SPACEBAR</p></div>`;
            return toofast? msg : ''
        },
        trial_duration: () => {
            return toofast? 2500 : 0
        },
        post_trial_gap: () => {
            return toofast? 1000 : 0
        },
        on_finish: (data) => {
            data.trial_type = `tooFastMessage_${round}`
        }
    }
}

export const round1Task = (() => {
    const delay = makeDelay('R1');
    return {
        timeline: [
            delay, 
            // toofast, probe, response, feedback
        ]
    }
})()