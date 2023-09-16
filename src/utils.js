import yaml from "js-yaml";

export async function readYaml(url) {
  try {
    const response = await fetch(url);
    const yamlData = await response.text();
    const yamlObject = yaml.load(yamlData);
    window.arguments = yamlObject;
    return yamlObject;
  } catch (error) {
    console.error(error);
  }
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export function twoLetterPair(num){
  let rtn_list = []; 
  let letters = LETTERS.split('').filter(l => !'oil'.includes(l))
  letters.forEach(function(first) {
    letters.forEach(function(second) {
      const pair = `${first},${second}`;
      if (rtn_list.indexOf(pair) === -1 && first !== second){
        rtn_list.push(pair)
      }
    });
  });
  
  rtn_list = rtn_list.sort(() => 0.5 - Math.random())
  return rtn_list.slice(0, num)
}

export function checkEmpty(obj){
  if (obj === undefined) {
    return true
  } else if (obj.constructor.name === 'Array'){
    if (obj.length === 0) {
      return true
    } else {
      return obj.every(x => x === null)
    } 
  } else if (typeof obj === 'string') {
    return obj === ""
  }
}

export function downloadCSV({csv, filename}) {
  let csvFile, downloadLink;
  csvFile = new Blob([csv], {type: "text/csv"});
  downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
};

export function prettyPrint(obj) {
  console.log(JSON.stringify(obj,null,'\t'))
};

export function convertToCSV(arr) {
  const array = [Object.keys(arr[0])].concat(arr)

  return array.map(it => {
    return Object.values(it).toString()
  }).join('\n')
};

export function countDownTimer(tag) {
  let input = document.getElementById(tag);
  let seconds = parseInt(input.innerHTML || 5);
  let timer = setInterval(function() {
    seconds--;
    if (seconds < 0) {
      clearInterval(timer);
    } else {
      input.innerHTML = `${seconds} sec`;
    }
  }, 1000);
};


export function renderPlugin(obj, dict, group, func){
  obj.type = dict[obj.type];
  if (group){
    obj.pages = ["".concat(obj.pages[0], obj.groups[group], obj.pages[1])];
    delete obj[group];
  };
  if (func)
    obj.on_start = func;
  return obj
}

export const partialFunc = (func, ...args) => {
  return (...rest) => {
    if ((typeof func === "function") && (/^\s*class\s+/.test(func.toString()))) {
      return new func(...rest, ...args);
    }
    return func(...rest, ...args);
  };
};

function sortArr(arr){
  let ary = arr.slice();
  ary.sort(function(a,b){ return parseFloat(a) - parseFloat(b);});
  return ary;
}

export function calQuantile(data, q) {
  q = q==='max'? 100 : q;
  q = q==='min'? 0 : q;
  q = q/100;
  data = sortArr(data);
  const pos = ((data.length)-1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (data[base+1]!==undefined){
      return parseFloat(data[base]) + rest * (parseFloat(data[base+1]) - parseFloat(data[base]));
  } else{
      return parseFloat(data[base]);
  }
}

export function createTable(dataList, keyList) {
  // Calculate statistics for each column
  const stats = {};
  dataList.forEach(data => {
    Object.keys(data).forEach(key => {
      if (keyList.includes(key) && typeof data[key] === 'number') {
        if (!stats[key]) {
          stats[key] = {
            sum: 0,
            count: 0,
            mean: 0,
            variance: 0,
            stdDev: 0,
            min: data[key],
            max: data[key]
          };
        }
        const val = data[key];
        stats[key].sum += val;
        stats[key].count++;
        stats[key].mean = stats[key].sum / stats[key].count;
        stats[key].variance += (val - stats[key].mean) ** 2;
        stats[key].stdDev = Math.sqrt(stats[key].variance / stats[key].count);
        if (val < stats[key].min) {
          stats[key].min = val;
        }
        if (val > stats[key].max) {
          stats[key].max = val;
        }
      }
    });
  });

  // Create table element and header row
  const table = document.createElement('table');
  const headerRow = table.insertRow();
  const header = Object.keys(stats); header.unshift('stats')
  header.forEach(key => {
    const th = document.createElement('th'); th.textContent = key;
    headerRow.appendChild(th);
  });

  // Add statistsisc below
  const dataRows = [];
  ['mean','stdDev','min','max'].forEach(stat => {
    const tr = table.insertRow();
    Object.entries(stats).forEach(([col, data], index) => {
      if (index == 0){
        const td = tr.insertCell(); td.textContent=stat
      }
      const td = tr.insertCell();
      td.textContent = data[stat].toFixed(2);
    });
    dataRows.push(tr);
  });

  // We return only the mean to each recorded measures
  const mean = Object.entries(stats).reduce(
    (d, [k, stat]) => {
      d[k] = stat.mean;
      return d
    }, {}
  );

  return table;
}


export function fullScreenHandler(){
  if (!document.fullscreenElement){
    alert("You leave the fullscreen mode, please go to full screen");
  }
}

function getFlat(list_of_object){
  return list_of_object.reduce((acc, x) => {return {...acc, ...x}}, {});
}

function getDate(date) {
  return (new Date(date)).toISOString().slice(0, 10);
}

function getPrefix(prefix, i){
  const k_rt = `${prefix}${i+1}_rt`;
  const k_typed = `${prefix}${i+1}_typed`;
  const k_score = `${prefix}${i+1}_score`;
  const k_target = `${prefix}${i+1}_target`;
  return [k_rt, k_typed, k_score, k_target];
}

function getRecord(data, phase){
  const filter_data = data.filter({phase: phase}).values();
  const prefix = phase==='practice'? 'practice' : 'round';
  const list_scores = filter_data.map((x, i) => {
    const [k_rt, k_typed, k_score, k_target] = getPrefix(prefix, i)
    return (phase === 'practice' 
      ? {[k_rt]: x.rt_typed, [k_typed]: x.typed, [k_score]: x.score} 
      : {[k_rt]: x.rt_typed, [k_typed]: x.typed, [k_score]: x.score, [k_target]: x.target})
  });
  return getFlat(list_scores);
}

export function JSON2CSV(objArray) {
  const array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
  let line = "";
  let result = "";
  const columns = [];
  for (const row of array) {
    for (const key in row) {
      let keyString = key + "";
      keyString = '"' + keyString.replace(/"/g, '""') + '",';
      if (!columns.includes(key)) {
        columns.push(key);
        line += keyString;
      }
    }
  }
  line = line.slice(0, -1); // removes last comma
  result += line + "\r\n";
  for (const row of array) {
    line = "";
    for (const col of columns) {
      let value = typeof row[col] === "undefined" ? "" : row[col];
      if (typeof value == "object") {
        value = JSON.stringify(value);
      }
      const valueString = value + "";
      line += '"' + valueString.replace(/"/g, '""') + '",';
    }
    line = line.slice(0, -1);
    result += line + "\r\n";
  }
  return result;
}

export function exportData(data) {
  const r_prac = getRecord(data, 'practice', 'practice');
  const r_bonus = getRecord(data, 'bonus', 'round');
  const [{gender, age, suggest}] = data.filter({trial_type: 'survey-demo'}).select('responses').values;
  const [{date, subject_id: id, condition: cond, PROLIFIC_PID: PROLIFIC_PID, totalSuccess, totalSuccess_1, totalSuccess_2, totalBonus, game_1, game_2}] = data.last().values();
  console.log( data.last().values() );
  const {absorbed_first, immersed_first, engaged_first, engrossed_first} = data.filter({trial_type: 'survey-likert'}).select('response').values[0];
  const {enjoyable_first, like_first, dislike_first, fun_first, entertaining_first} = data.filter({trial_type: 'survey-likert'}).select('response').values[1];
  const {absorbed_second, immersed_second, engaged_second, engrossed_second} = data.filter({trial_type: 'survey-likert'}).select('response').values[2];
  const {enjoyable_second, like_second, dislike_second, fun_second, entertaining_second} = data.filter({trial_type: 'survey-likert'}).select('response').values[3];

  return {
    subject_id: id,
    PROLIFIC_PID: PROLIFIC_PID,
    date: getDate(date),
    game_1: game_1,
    game_2: game_2,
    ...r_prac,
    ...r_bonus,
    total_earned: totalBonus,
    total_success: totalSuccess,
    total_success_1: totalSuccess_1,
    total_success_2: totalSuccess_2,
    gender: gender,
    age: age,
    comment: suggest,
    absorbed_1: absorbed_first,
    immersed_1: immersed_first,
    engrossed_1: engrossed_first,
    engaged_1: engaged_first,
    enjoyable_1: enjoyable_first,
    like_1: like_first,
    dislike_1: dislike_first,
    fun_1: fun_first,
    entertaining_1: entertaining_first,
    absorbed_2: absorbed_second,
    immersed_2: immersed_second,
    engrossed_2: engrossed_second,
    engaged_2: engaged_second,
    enjoyable_2: enjoyable_second,
    like_2: like_second,
    dislike_2: dislike_second,
    fun_2: fun_second,
    entertaining_2: entertaining_second,
  }
};

export function makeMultipliers() {

  function shuffleArray(array) {

    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Create an array with 8 ones and 12 negative ones
  const ones = Array(7).fill(1); // Leave one 1 for the last position
  const negatives = Array(10).fill(-1);

  // Combine the arrays
  const resultArray = ones.concat(negatives);

  // Shuffle the combined array except for the last position
  let shuffledArray = shuffleArray(
    resultArray.slice(0, resultArray.length - 1)
  );

  // Add 1 as the last element
  shuffledArray.push(1);

  // Find a random index to insert a sequence of at least 3 -1s
  const randomIndex = Math.floor(Math.random() * (shuffledArray.length - 2));
  shuffledArray.splice(randomIndex, 0, -1, -1, -1);
  return shuffledArray;

}