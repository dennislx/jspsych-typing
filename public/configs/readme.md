This folder holds various configuration files that can be modified to alter the overall settings of an experiment. 

To load a specific configuration file in your experiment, you simply need to change the corresponding code in `src/experiments.js`.

```js
// change the path of configuration file
const args = await readYaml('configs/default.yaml');
```