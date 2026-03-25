const fs = require('fs');
const filePath = 'c:/Users/USER/R.tournee/frontend/src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /<th>Client<\/th>[\s\S]*?<th>Penalit.*?<\/th>/g;

const newHeader = '<th>Client</th>\n                      <th>Région</th>\n                      <th>Nb. Palette</th>\n                      <th>Arrivée.Client</th>\n                      <th>Départ.Client</th>\n                      <th>Kms Arrivée</th>\n                      <th>Kms Théorique</th>\n                      <th>Livrée</th>';

const regexArr = /\{Array\(11\)\.fill\(0\)\.map/g;

let oldContent = content;
content = content.replace(regex, newHeader);
content = content.replace(regexArr, '{Array(8).fill(0).map');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Replaced! Check matches:");
console.log(content.match(regexArr));
