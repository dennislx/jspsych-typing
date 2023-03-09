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

const letters = 'abcdefghijklmnopqrstuvwxyz';

export function twoLetterPair(num){
  let rtn_list = []; 
  letters.split('').forEach(function(first) {
    letters.split('').forEach(function(second) {
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
    if (seconds < 0) {
      clearInterval(timer);
    } else {
      input.innerHTML = `${seconds} sec`
    }
    seconds--;
  }, 1000);
};

export let keysPressed = [];

export function displayKeysList(tag, n_hist) {
  const func = function(event) {
    let color
    if (keysPressed.at(-1) === true) {
      keysPressed.pop(); color = 'green'
    } else {
      color = 'red'
    }
    keysPressed.push({key: event.key, color: color})
    console.log(keysPressed.length);
    if (keysPressed.length > n_hist) {
        keysPressed.shift();
    }
    let keysList = document.getElementById(tag);
    keysList.innerHTML = '';
    keysPressed.forEach(function(obj) {
      let li = document.createElement('li');
      li.textContent = obj.key
      li.style.color = obj.color
      keysList.appendChild(li);
    })
  }
  keysPressed = [];
  document.addEventListener('keydown', func, true);
  return func
};

export function renderPlugin(obj, dict, group, func){
  obj.type = dict[obj.type];
  if (group){
    obj.pages = ["".concat(obj.pages[0], obj.groups[group], obj.pages[1])]
    delete obj[group];
  }
  if (func) {
    obj.on_start = func
  }
  return obj
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

  return table;
}


export function fullScreenHandler(){
  if (!document.fullscreenElement){
    alert("You leave the fullscreen mode, please go to full screen");
  }
}