const path = require('path');
const fs = require('fs-extra');
const config = require('../config.js');

let runtimePath = config.runtime_path;
fs.ensureDirSync(runtimePath);
fs.ensureDirSync(path.join(runtimePath, 'log'));
let configPath;
if(process.env.NODE_ENV === 'production') {
  configPath = path.join(runtimePath, 'config.json');
} else {
  configPath = path.join(runtimePath, 'config_dev.json');
}
fs.writeFileSync(configPath,
  JSON.stringify(config, null, '\t'),
  { encoding: 'utf8' }
);
