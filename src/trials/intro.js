import surveyMultiChoice from "@jspsych/plugin-survey-multi-choice";
import instrunctionType from "@jspsych/plugin-instructions";
import { settings, text } from "../prepare"




const preMessage = {
    type: surveyMultiChoice,
    preamble: `<div style='text-align: left; width: 950px'>
        <p>Welcome! Before you begin this survey, please note the following:</p>
        <p>Unlike some surveys on Prolific, we NEVER deny payment based on performance
        or answers to questions. We simply ask that you try your best, and answer 
        each question as honestly and accurately as possible. No matter what answers you give or how
        you perform, you will be fully compensated. That is a guarantee.</p>
        <p>To ensure that you understand this information, please answer the following question.</p>
        </div>`,
    questions: [
        {prompt: `Will you receive full payment regardless of how you perform and answer questions?`,
        name: `preMessageChk`, 
        options: [`Yes`, `No`]}
    ],
    scale_width: 500,
};

const instruct_fn = (...pages) => {
    let stimulus = []
    for (let page of pages) {
        stimulus.push(`<div class='parent'>${page}</div>`)
    }
    return {
        type: instrunctionType,
        pages: stimulus,
        show_clickable_nav: true,
        post_trial_gap: 500,
    }
}

const r1start = instruct_fn(`
<p>Thank you for playing the <span class='${text.span1}'>${text.game1}</span>!</p>
When you're ready, continue to learn about and play the <span class='${text.span2}'>${text.game2}</span>.</p>
`)

const r1end = instruct_fn(`
<p>You are now ready to play the <span class='${text.span1}'>${text.game1}</span>.</p>
<p>Once you proceed, the <span class='${text.span1}'>${text.game1}</span> will start immediately, 
so get ready to press your SPACEBAR.</p>
<p>Continue to the next screen to begin.</p>
`)

const r1chunk = [
    `<p>The <span class='${text.span1}'>${text.game1}</span> is played in multiple rounds.</p>`,
    `<p>In each round, you'll have five chances to "activate" tiles like this one.<br>
    If you activate a tile before your five chances are up, you'll win the round.</p>
    <div class='box' style='background-color:gray'></div>`,
]

const r1bern = [
    `<p>To earn money in the <span class='${text.span1}'>${text.game1}</span>, you must achieve wins.<br>
    The more wins you achieve, the more money you'll earn.</p>`,
    `<p>To achieve wins, you'll try to "activate" tiles like this one.<br>
    Activating a tile results in a win.</p>
    <div class='box' style='background-color:gray'></div>`
]

var compAns1

const choice_fn = (span, game, round) => {

    if (round == 'R1') {
        var attnChk1Ans = settings.gameTypeOrder == 0 ? `True` : `False`
        var instPage = (settings.gameTypeOrder == 0) ? r1chunk : r1bern;
    } else {
        var attnChk1Ans = settings.gameTypeOrder == 0 ? `False` : `True`
        var instPage = (settings.gameTypeOrder == 0) ? r1bern : r1chunk;
    }
    const info = instruct_fn(...instPage)
    const attnChk1Name = `attnChk1_${round}`

    const compChk1 = {
        type: surveyMultiChoice,
        preamble: `<div style="font-size:16px"><p>To make sure you understand the <span class='${span}'>${game}</span>, please indicate whether the following statement is true or false:</p></div>`,
        questions: [{
            prompt: `The <span class='${span}'>${game}</span> is played in multiple rounds, and you have five chances to activate a tile per round.`, 
            name: attnChk1Name, 
            options: ['True', 'False']
        }],
        scale_width: 500,
        on_finish: function(data){
            compAns1 = data.response[attnChk1Name];
        }
    }

    const loop_fn = function() {return compAns1 != attnChk1Ans}
    const error = {
        timeline: [instruct_fn(`<p>You provided a wrong answer.<br>To make sure you understand the game, please continue to re-read the instructions.</p>`)],
        conditional_function: loop_fn
    }

    return {
        timeline: [info, compChk1, error],
        loop_function: loop_fn
    }

}

const r1loop = choice_fn(text.span1, text.game1, 'R1')
export {preMessage, r1start, r1end, r1loop}