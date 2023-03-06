/**
 * Comment to be added
 */

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
}

export function convertToCSV(arr) {
  const array = [Object.keys(arr[0])].concat(arr)

  return array.map(it => {
    return Object.values(it).toString()
  }).join('\n')
}

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
}

export let keysPressed = [];

export function displayKeysList(tag, n_hist) {
  document.addEventListener('keydown', function(event) {
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
  })
};