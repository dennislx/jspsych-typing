import { ParameterType } from "jspsych";

const info = {
    name: 'survey-demo',
    description: '',
    parameters: {
        button_label: {
            type: ParameterType.STRING,
            pretty_name: 'Button label',
            default: 'Continue',
            description: 'The text that appears on the button to finish the trial.'
        },
    }
}

const css = `<style>

</style>`

const header = `
<div class=survey-demo-instructions>
    <h2>Survey</h2>
    <p>Please answer the questions below. <font color="#c87606">Your answers will not affect your payment or bonus.</font></p>
</div>
`

const gender = `
<div class="survey-demo-row">
    <div class="survey-demo-prompt">
        <label for="gender">Gender? </label>
    </div>
    <div class="survey-demo-response">
        <label><input type="radio" name="gender" value="Man" required>Man</label><br>
        <label><input type="radio" name="gender" value="Woman" required>Woman</label><br>
        <label><input type="radio" name="gender" value="Other" required>Other</label><br>
    </div>
</div>
`

const age = `
<div class="survey-demo-row">
    <div class="survey-demo-prompt">
        <label for="age">Age? </label>
    </div>
    <div class="survey-demo-response">
        <input type="number" name="age" min="14" max="100" style="width: 80px">
    </div>
</div>
`

const ethnicity = `
<div class="survey-demo-row">
    <div class="survey-demo-prompt">
        <label for="ethnicity">Ethnicity?<br><small>(Choose all that apply)</small> </label>
    </div>
    <div class="survey-demo-response">
        <label><input type="checkbox" name="ethnicity" value="White / Caucasian">White / Caucasian</label><br>
        <label><input type="checkbox" name="ethnicity" value="Black / African American">Black / African American</label><br>
        <label><input type="checkbox" name="ethnicity" value="Asian / Pacific Islander">Asian / Pacific Islander</label><br>
        <label><input type="checkbox" name="ethnicity" value="Hispanic">Hispanic</label><br>
        <label><input type="checkbox" name="ethnicity" value="Native American">Native American</label><br>
        <label><input type="checkbox" name="ethnicity" value="Other">Other</label><br>
    </div>
</div>
`

const lang = `
<div class="survey-demo-row">
    <div class="survey-demo-prompt">
        <label for="english">Is English your native language? </label>
    </div>
    <div class="survey-demo-response">
        <label><input type="radio" name="english" value="True" required>True</label><br>
        <label><input type="radio" name="english" value="False" required>False</label><br>
    </div>
</div>
`

const suggest = `
<div class="survey-demo-row">
    <div class="survey-demo-prompt">
        <label for="suggest">Questions? Comments? Complaints? Provide your feedback here! </label>
    </div>
    <div class="survey-demo-suggest">
    <textarea name="suggest" id="styled"></textarea>
    </div>
</div>
`

const submit = `
<div class="survey-demo-footer">
    <input type="submit" value="$button"></input>
</div>
`

/**
 * **An extension based on jspsych-demos**
 * 
 * @author Xiang Liu
 * @original_author nivlab/jspsych-demos
 */

class SurveyDemoPlugin {

    trial(display_element, trial) {
        var html = '';
        html += css;
        // Initialize survey.
        html += '<div class="survey-demo-wrap"><form id="jspsych-survey-demo">';

        // Add demoing header.
        html +=  header;

        // Begin demoing container.
        html += '<div class="survey-demo-container">';

        // Item 1: gender
        html += gender;
        // Item 2: age
        html += age;
        // Item 3: ethnicity
        html += ethnicity;
        // Item 4: 
        html += lang;
        // Item 5: suggestion
        html += suggest;

        // Close container.
        html += '</div>';

        // Add submit button.
        html += submit.replace('$button', trial.button_label);
 
        // End survey.
        html += '</form></div>';

        // Display HTML
        display_element.innerHTML = html;

        //---------------------------------------//
        // Define functions.
        //---------------------------------------//
        // Scroll to top of screen.
        window.onbeforeunload = function () {
            window.scrollTo(0, 0);
        };
        display_element.querySelector('#jspsych-survey-demo').addEventListener('submit', function(e){
            e.preventDefault(); //wait for response 

            // verify that at least one box has been checked for the race question
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            const checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);

            if (!checkedOne)
                alert("You did not enter a response for the question \"Ethnicity\". Please choose at least one option.");
            else {
                // Measure response time
                const endTime = performance.now();
                const response_time = endTime - startTime;

                let question_data = serializeArray(this);
                question_data = objectifyForm(question_data);

                // Store data
                var trialdata = {
                "rt": response_time,
                "responses": question_data
                };

                // Update screen
                display_element.innerHTML = '';

                // Move onto next trial
                jsPsych.finishTrial(trialdata);
            }
        });

        var startTime = performance.now()

        /*!
        * Serialize all form data into an array
        * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
        * @param  {Node}   form The form to serialize
        * @return {String}      The serialized form data
        */
        var serializeArray = function (form) {
        // Setup our serialized data
        var serialized = [];

        // Loop through each field in the form
        for (var i = 0; i < form.elements.length; i++) {
            var field = form.elements[i];

            // Don't serialize fields without a name, submits, buttons, file and reset inputs, and disabled fields
            if (!field.name || field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') continue;

            // If a multi-select, get all selections
            if (field.type === 'select-multiple') {
                for (var n = 0; n < field.options.length; n++) {
                    if (!field.options[n].selected) continue;
                    serialized.push({
                    name: field.name,
                    value: field.options[n].value
                    });
                }
            }

            // Convert field data to a query string
            else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
                serialized.push({
                    name: field.name,
                    value: field.value
                });
            }
        }

        // add checkbox responses
        var checkbox_types = document.querySelectorAll('input[type=checkbox]');
        var checkbox_names = [];
        for (var i = 0; i < checkbox_types.length; i++) {
            if (! checkbox_names.includes(checkbox_types[i].name) ){
                checkbox_names.push(checkbox_types[i].name)
            }
        }

        for (var i = 0; i < checkbox_names.length; i++ ){
            var checkboxes = document.querySelectorAll(`input[name=${checkbox_names[i]}]:checked`)
            var responses = [];

            for (var j = 0; j < checkboxes.length; j++) {
                responses.push(checkboxes[j].value)
            }
            serialized.push({
            name: checkbox_names[i],
            value: responses
            })
        }

        return serialized;
        };

        // from https://stackoverflow.com/questions/1184624/convert-form-data-to-javascript-object-with-jquery
        function objectifyForm(formArray) {//serialize data function
            var returnArray = {};
            for (var i = 0; i < formArray.length; i++){
                returnArray[formArray[i]['name']] = formArray[i]['value'];
            }
            return returnArray;
        }
    }
}
SurveyDemoPlugin.info = info;


export { SurveyDemoPlugin as default };