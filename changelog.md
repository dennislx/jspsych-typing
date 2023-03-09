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
    trial_duration:                 //  How long will the trial wait for a keyboard response (inf if set to null)
    response_ends_trial:            //  Whether the trial ends immediately when a response is made
    num_keypress_display:           //  How many recent keyboard presses are displayed
    remain_time_display:            //  Whether the remaining trial duration will be displayed in seconds
}
```
