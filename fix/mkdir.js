const fs = require('fs');
if (!fs.existsSync('scripts')) {
    fs.mkdirSync('scripts');
    console.log('scripts directory created');
} else {
    console.log('scripts directory already exists');
}
