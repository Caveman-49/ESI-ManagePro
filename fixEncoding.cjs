const fs = require('fs');

const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'Ã©': 'é',
  'Ã¨': 'è',
  'Ã‰': 'É',
  'Ã ': 'à',
  'Ã§': 'ç',
  'Ã»': 'û',
  'Ãª': 'ê',
  'Ã®': 'î',
  'Ã´': 'ô',
  'Ã¢': 'â',
  'Ã¯': 'ï',
  'Ã«': 'ë',
  'Ã¤': 'ä',
  'Ã¶': 'ö',
  'Ã¼': 'ü',
  'Ã‹': 'Ë',
  'Ã”': 'Ô',
  'Ã€': 'À'
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync(file, content);
console.log('Encoding fixed.');
