const fs = require('fs');
let b = fs.readFileSync('frontend/src/App.jsx', 'utf8');
b = b.replace(/ENREGISTRER LA TOURNÉE</g, 'ENREGISTRER LA TOURNÉE');
b = b.split('<button className="btn-primary px-8 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all">ENREGISTRER LA TOURNÉE</button>')
     .join('<button className="btn-primary px-8 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all" onClick={handleSave}>ENREGISTRER LA TOURNÉE</button>');
fs.writeFileSync('frontend/src/App.jsx', b);
