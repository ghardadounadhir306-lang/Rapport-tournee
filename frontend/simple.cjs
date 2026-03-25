const fs = require('fs');
const filePath = 'c:/Users/USER/R.tournee/frontend/src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const simpleList = "              {filteredList.length > 0 ? filteredList.map((item) => (\n                <tr\n                  key={item.id}\n                  className={item?.id === selectedTmsId ? 'active-row' : ''}\n                  onClick={() => {\n                    setSelectedTmsId(item?.id ?? null)\n                    setSelectedTmsItem(item ?? null)\n                  }}\n                  style={{ cursor: 'pointer' }}\n                >\n                  <td>{item.wms || '---'}</td>\n                  <td>{String(item.id ?? '').replace('tms-', '') || '---'}</td>\n                  <td>{item.date || '---'}</td>\n                  <td>{item.site || '---'}</td>\n                  <td>{item.truck || '---'}</td>\n                  <td>{(item.driver ? String(item.driver).split(' ')[0] : '---')}</td>\n                  <td>{item.dep || '120'}</td>\n                  <td>{item.prestation || 'STK'}</td>\n                </tr>\n              )) : (";

const accordionList = /\{\s*filteredList\.length > 0 \? filteredList\.map\(\(item\) => \(\s*<React\.Fragment key=\{item\.id\}>[\s\S]*?<\/React\.Fragment>\s*\)\) : \(/;

content = content.replace(accordionList, simpleList);
content = content.replace("import React, { useEffect", "import { useEffect");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Simple list restored!");
