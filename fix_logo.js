const fs = require('fs');
const path = require('path');

function findFile(dir, pattern) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                if (!file.startsWith('.') && file !== 'node_modules') {
                    results = results.concat(findFile(filePath, pattern));
                }
            } else if (file.includes(pattern)) {
                results.push(filePath);
            }
        }
    } catch (e) { }
    return results;
}

const searchDirs = [
    'C:/Users/Utilisateur/Downloads',
    'C:/Users/Utilisateur/Desktop',
    'C:/Users/Utilisateur/OneDrive - IA Private Wealth/IA PublicQuébec/NICOLAS PERRON/Projet de Nicolas Perron/geaimonvol'
];

let candidates = [];
for (const dir of searchDirs) {
    candidates = candidates.concat(findFile(dir, 'removebg'));
}

console.log('Candidates found:', candidates);

if (candidates.length > 0) {
    // Pick the most recent one or the most likely one
    const target = candidates[0];
    const dest = path.join('c:/Users/Utilisateur/OneDrive - IA Private Wealth/IA PublicQuébec/NICOLAS PERRON/Projet de Nicolas Perron/geaimonvol/public', 'logo_geai.png');
    console.log(`Copying ${target} to ${dest}`);
    fs.copyFileSync(target, dest);
    console.log('Done!');
} else {
    console.log('No logo found!');
}
