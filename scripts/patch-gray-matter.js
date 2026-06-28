const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../node_modules/gray-matter/lib/engines.js');

if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, 'utf8');
  content = content.replace('yaml.safeLoad.bind(yaml)', 'yaml.load.bind(yaml)');
  content = content.replace('yaml.safeDump.bind(yaml)', 'yaml.dump.bind(yaml)');
  fs.writeFileSync(target, content, 'utf8');
  console.log('Successfully patched gray-matter for js-yaml v4+ compatibility.');
} else {
  console.warn('gray-matter/lib/engines.js not found, skipping patch.');
}
