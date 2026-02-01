const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../pkg/node/package.json');
if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = '@velo-sci/sci-math-wasm';
    pkg.type = 'module';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('Set pkg/node/package.json name to @velo-sci/sci-math-wasm and type to module');
} else {
    console.warn('pkg/node/package.json not found');
}

// Convert require() to import and exports to ESM in entry point
const entryPath = path.join(__dirname, '../pkg/node/sci_math_wasm.js');
if (fs.existsSync(entryPath)) {
    let content = fs.readFileSync(entryPath, 'utf8');
    
    // Add ESM imports at top
    const esmImports = `import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

`;
    content = esmImports + content;
    
    // Replace require() with ESM import
    content = content.replace(
        /const\s+{\s*startWorkers\s*}\s*=\s*require\(String\.raw`(.+?)`\);/,
        'import { startWorkers } from "$1";'
    );
    
    // Replace require('fs').readFileSync with readFileSync (already imported)
    content = content.replace(
        /require\('fs'\)\.readFileSync/g,
        'readFileSync'
    );
    
    // Collect all exports
    const exportNames = [];
    const exportRegex = /exports\.(\w+)\s*=/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
        exportNames.push(match[1]);
    }
    
    // Remove all exports.X = statements
    content = content.replace(/exports\.(\w+)\s*=\s*(\w+);/g, '');
    
    // Add ESM export block at the end
    if (exportNames.length > 0) {
        const exportBlock = `\nexport { ${exportNames.join(', ')} };\n`;
        content += exportBlock;
    }
    
    fs.writeFileSync(entryPath, content);
    console.log('Converted pkg/node/sci_math_wasm.js to ESM format');
}
