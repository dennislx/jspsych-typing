import "jspsych/css/jspsych.css";
import "./style.css";
import jsPsych from "./prepare"
import * as intro from "./trials/intro"
import * as task from "./trials/task"


const timeline = [
  // intro.preMessage, intro.r1start, intro.r1loop, intro.r1end, task.round1Intro, 
  task.round1Task
]
jsPsych.run(timeline)
