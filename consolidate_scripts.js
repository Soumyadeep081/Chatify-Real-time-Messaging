const fs = require('fs');
const path = require('path');

const root = process.cwd();

const groups = {
  'fetch_js.js': [/fetch.*\.js$/],
  'fetch_py.py': [/fetch.*\.py$/],
  'fix_js.js': [/fix.*\.js$/],
  'fix_py.py': [/fix.*\.py$/, /find\.py$/],
  'test_js.js': [/test.*\.js$/],
  'scripts_ps1.ps1': [/(fetch|fix|test).*\.ps1$/]
};

const trash = [
    "console.log('DATA",
    "console.log(data))",
    "res.json()).then(console.log).catch(console.error)"
];

trash.forEach(t => {
    const p = path.join(root, t);
    if (fs.existsSync(p)) {
        console.log(`Deleting trash: ${t}`);
        fs.unlinkSync(p);
    }
});

for (const [target, patterns] of Object.entries(groups)) {
  const allFiles = fs.readdirSync(root);
  const files = allFiles.filter(f => {
      if (f === target) return false;
      return patterns.some(p => p.test(f));
  });

  if (files.length === 0) continue;

  console.log(`Combining into ${target}: ${files.join(', ')}`);

  let header = '';
  if (target.endsWith('.js')) {
      header = `/**\n * COMBINED SCRIPTS: ${target}\n * This file contains multiple concatenated scripts.\n * To run an individual script, copy it to its own file or wrap in a block.\n */\n\n`;
  } else if (target.endsWith('.py')) {
      header = `\"\"\"\nCOMBINED SCRIPTS: ${target}\nThis file contains multiple concatenated scripts.\n\"\"\"\n\n`;
  } else if (target.endsWith('.ps1')) {
      header = `<#\nCOMBINED SCRIPTS: ${target}\n#>\n\n`;
  }

  let combined = header;

  for (const f of files) {
    const content = fs.readFileSync(path.join(root, f), 'utf-8');
    const separatorStart = (target.endsWith('.js')) ? `// ==========================================\n// START OF: ${f}\n// ==========================================` : 
                          (target.endsWith('.py')) ? `# ==========================================\n# START OF: ${f}\n# ==========================================` :
                          `<# ==========================================\nSTART OF: ${f}\n========================================== #>`;

    const separatorEnd = (target.endsWith('.js')) ? `// ==========================================\n// END OF: ${f}\n// ==========================================` : 
                          (target.endsWith('.py')) ? `# ==========================================\n# END OF: ${f}\n# ==========================================` :
                          `<# ==========================================\nEND OF: ${f}\n========================================== #>`;

    combined += `\n${separatorStart}\n\n`;
    if (target.endsWith('.js')) {
        combined += `(function() {\n${content}\n})();\n\n`;
    } else {
        combined += content + '\n\n';
    }
    combined += `\n${separatorEnd}\n\n`;
  }

  fs.writeFileSync(path.join(root, target), combined);
  
  // Delete original files
  files.forEach(f => {
      fs.unlinkSync(path.join(root, f));
  });
}

console.log('Done!');
