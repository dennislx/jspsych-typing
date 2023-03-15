## Mar 15

A couple of updates here

1. two parameters are added during bonus phase, `feedback_duration` and `stop_when_pass_target`

```yaml
feedback_duration:      controls how long the feedback window lasts before the start of next trial
stop_when_pass_target:  controls whether or not end this trial immediately after the number of pressing surpasses the target threshold
```

2. add a timeline in the end of the experiment to save data on OSF platform

```js
// specify your exp_id (from DataPipe) in the yaml file
exp_id: eUraQJoXlcw8

// obtain subject id and assign their group condition 
const subject_id = jsPsych.randomization.randomID(10); 
const condition = await jsPsychPipe.getCondition(args.exp_id);

// save data
timeline.push({
    type: jsPsychPipe,
    action: 'save',
    experiment_id: args.exp_id,    //specified in yaml
    filename: `${subject_id}.csv`, //filename shown in your osf page
    data_string: () => {
        // post-process your data here
        return data
    }
})
```

3. target number is rounded down and always non-negative

4. avoid `i, o, l` keys as they may confuse participants (e.g., `i` looks like `l`)

## Mar 11

The game's initial version has been completed and is available on [Github](https://dennislx.github.io/jspsych-typing/). The experiment can be effortlessly modified through the YAML file located at `public/configs/default.yaml`. The following key parameters are crucial in determining the game:

```yaml
# ========= global settings ===================================================
is_fullscreen:          whether or not allow the experiment to enter fullscreen
show_progress_bar:      whether or not display a progress bar on top of the experiment
screenwidth:            the width of the display element, e.g., 960 px
fontsize:               the font size of the display element
remove_prompt_below:    whether or not remove a prompt to remind particiapnts of which keys to press

# ========= practice settings ===================================================
practice_trial_rounds:  the number of practice rounds
practice_trial_time:    the duration of each practice round
show_practice_result:   whether or not display the statsistics about behaviors during the practice phase

# ========= bonus settings ======================================================
bonus_trial_rounds:     the number of bonus rounds
bonus_trial_time:       the duration of each bonus round
target_number_dist:     the standard deviation or range parameter of target number distribution
  choice: uniform
  normal: {std: 5}
  uniform: {range: 5}

# ========= stimulus simulation =================================================
: Here, you can specify a list of keys that participants must press in each round. 
: If the number of rounds specified above exceeds the length of the list below
: a set of random key pairs will be generated to make up for the shortfall.
list_of_available_pair_keys: ['d,k', 'f,j', 's,l', .....]
```

Main structure of the experiment is defined in `src/experiment.js`. It features a list of timelines each of which is detailed in `public/configs/default.yaml` and `src/jspsych-typing.js`

```
1. preload images if images specified in YAML is not empty
2. enter fullscreen if fullscreen mode is set TRUE
3. consent page 
4. practice instruction
5. practice rounds
6. bonus rounds
7. debrief page
```

Two timeline classes (`practicePhase` and `bonusPhase`) and three bonus classes (`Binary`, `ContinuousStreak` and `BinaryStreak`) are defined in `src/jspsych-typing.js`. The keyboard listening events are defined in the `keypressCallback` function. 


```js
/*
* @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
* @param {object} info          - response time and keyboard behavior of participants responding to this stimulus
* @param {object} response      - statistics to record and update at each round, e.g., rt_valid for response time of valid pressing
* @param {object} trail         - timeline object containing all nececessary components to run this trial
* @param {Array} response_history       - an array of history keyboard pressings
* @param {object} counter       - a counter used to determine the expected keyboard behaviors
* @param {html-element} display_html    - html element, i.e., the content of displayed stimulus
* @param {function} end_trial   - a function to call before the end of this trial
*/
function keypressCallback(info, response, trial, response_history, counter, display_html, end_trial) {
    // 1. check whether participants have pressed correct keys in the correct order
    // 2. display past ${num_keypress_display} keys in the screen if required
    // 3. record the response time to first valid and invalid keyboard pressing
    // 4. the number of valid pressing and remining time are also displayed and updated
}
```

The `practicePhase` consists of `${numOfTrial}` practices and ONE "feedback" that helps to calculate the average amount of valid keyboard pressings in the end of practice phase. 

|  ![](public/img/practice.png) |   ![](public/img/practice-result.png) |
| ------------- | ------------- |

The `bonusPhase` consists of `${numOfTrial}` bonus rounds, each of which is followed by a feedback that is customized based on its condition group. The keyboad listener not only record all necesary statistics but early terminate this round if the number of valid pressing has bypassed the randomly generated target threshold. 

|  ![](public/img/bonus.png) |   ![](public/img/bonus-result.png) |
| ------------- | ------------- |

Three bonus classes are created to update bonus score and streak numbers. 

## Mar 09

Two things are done: 

1. These statistics will be recorded

```yaml
# the stage of each trial (instruction, fixation, practice, bonus) will be labeled to help data clean
rt_valid:  this is the reaction time to start making first valid keyboard pressing
rt_typed:  this is the reaction time to start making first keyboard pressing, valid or invalid
score:     how many valid keyboard pressings there is
typed:     how many keyboard pressings participants have tried before the trial times out
```
|  stats 	| rt_valid 	| rt_typed 	| typed 	| score 	|
|:------:	|:--------:	|:--------:	|:-----:	|:-----:	|
| mean   	| 124.00   	| 94.00    	| 1.60  	| 1.20  	|
| stdDev 	| 0.00     	| 0.00     	| 2.44  	| 1.83  	|
| min    	| 124.00   	| 94.00    	| 0.00  	| 0.00  	|
| max    	| 124.00   	| 94.00    	| 8.00  	| 6.00  	|

2. I have finished setups for trials during the practice phase. 

```js
class practicePhase
    /**
     * 
     * @param {numeric} numOfTrial           The number of total trials during the practice stage
     * @param {numeric} trial_duration       An integer indicates the time (in seconds) before time out
     * @param {numeric} num_keypress_display The number of past keyboard pressings to be displayed, hide if set to zero
     * @param {string[]} list                A list of two-letter pairs be serve as correct responses (in sequential order) at each practice trial
     * @param {object} data                  What additional data should the trial store
     */
```

## Mar 06

I am still working on the very first version. The features that have been implemented are:

- a `jspsych plugin` that displays a countdown timer, a score counter and a history of past keyboard pressings. This plugin has basically all we need for trials in the practice phase.

```js

import jspsychKeyboardDisplay from "jspsych-keyboard-display";

const trial = {
    type: jspsychKeyboardDisplay,
    stimus:                         //  The html elements to be displayed.
    choices:                        //  The array contains keys to respond to stimulus
    prompt:                         //  The content displayed below the stimulus (e.g., reminder)
    stimulus_duration:              //  How long to display the stimulus in milliseconds
    trial_duration:                 //  How long will the trial wait for a keyboard response
    response_ends_trial:            //  Whether the trial ends immediately when a response is made
    num_keypress_display:           //  How many recent keyboard presses are displayed
    remain_time_display:            //  Whether the remaining trial duration is displayed in sec
    response_callbacks:             //  Some keyboard callbacks that are activated in each trial
}
```
