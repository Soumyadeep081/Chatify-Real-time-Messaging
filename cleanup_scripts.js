const fs = require('fs');
const path = require('path');

const root = '.';
const scriptsDir = './scripts';

if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir);
}

const files = fs.readdirSync(root);

const trash = [
    "console.log('DATA",
    "console.log(data))",
    "res.json()).then(console.log).catch(console.error)",
    "mkdir.js",
    "test.txt"
];

const patterns = [
    /^fetch.*\.js$/,
    /^fetch.*\.py$/,
    /^fetch.*\.ps1$/,
    /^fix.*\.js$/,
    /^fix.*\.py$/,
    /^fix.*\.ps1$/,
    /^test.*\.js$/,
    /^test.*\.py$/,
    /^test.*\.ps1$/,
    /^consolidate_scripts\.js$/,
    /^scripts_ps1\.ps1$/
];

files.forEach(file => {
    if (trash.includes(file)) {
        console.log(`Deleting trash: ${file}`);
        try { fs.unlinkSync(path.join(root, file)); } catch (e) { console.error(e.message); }
        return;
    }

    const isMatch = patterns.some(p => p.test(file));
    if (isMatch && file !== 'cleanup_scripts.js') {
        const src = path.join(root, file);
        const dest = path.join(scriptsDir, file);
        console.log(`Moving ${file} to scripts/`);
        try {
            fs.copyFileSync(src, dest);
            fs.unlinkSync(src);
        } catch (e) {
            console.error(e.message);
        }
    }
});

console.log('Done!');
