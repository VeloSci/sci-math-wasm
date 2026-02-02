import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PKG_WEB = path.join(ROOT_DIR, 'pkg/web');
const PKG_NODE = path.join(ROOT_DIR, 'pkg/node');

// Ensure dist directory exists and is empty
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);
console.log(`Created dist directory: ${DIST_DIR}`);

// Copy pkg/web -> dist/pkg/web
if (fs.existsSync(PKG_WEB)) {
    fs.cpSync(PKG_WEB, path.join(DIST_DIR, 'pkg/web'), { recursive: true });
    console.log('Copied pkg/web');
} else {
    console.error('Error: pkg/web does not exist. Run "pnpm wasm:build" first.');
    process.exit(1);
}

// Copy pkg/node -> dist/pkg/node
if (fs.existsSync(PKG_NODE)) {
    fs.cpSync(PKG_NODE, path.join(DIST_DIR, 'pkg/node'), { recursive: true });
    console.log('Copied pkg/node');
} else {
    console.error('Error: pkg/node does not exist. Run "pnpm wasm:build" first.');
    process.exit(1);
}

// Remove nested package.json and .gitignore files as they confuse npm pack
[
    path.join(DIST_DIR, 'pkg/web/package.json'),
    path.join(DIST_DIR, 'pkg/node/package.json'),
    path.join(DIST_DIR, 'pkg/web/.gitignore'),
    path.join(DIST_DIR, 'pkg/node/.gitignore')
].forEach(f => {
    if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.log(`Removed nested file: ${f}`);
    }
});


// Copy README, LICENSE
['README.md', 'LICENSE'].forEach(file => {
    const src = path.join(ROOT_DIR, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(DIST_DIR, file));
        console.log(`Copied ${file}`);
    }
});

// Process package.json
const pkgJsonPath = path.join(ROOT_DIR, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

// Set files explicitly to include pkg
pkg.files = ['pkg', 'README.md', 'LICENSE'];

// Ensure main/module/types point to the correct location relative to root (already correct in src package.json)
// but since we are publishing 'dist' as root, the paths './pkg/web/...' are still valid inside 'dist'
// because we constructed 'dist/pkg/web/...'.

// Remove scripts and devDependencies to clean up
delete pkg.scripts;
delete pkg.devDependencies;

fs.writeFileSync(path.join(DIST_DIR, 'package.json'), JSON.stringify(pkg, null, 2));
console.log('Created dist/package.json');

// Create .npmignore to prevent npm from using .gitignore (which acts on 'dist' folder)
// We write a comment to ensure file is not empty
fs.writeFileSync(path.join(DIST_DIR, '.npmignore'), '# Include everything\n\n!pkg\n!README.md\n!LICENSE\n!package.json');
console.log('Created dist/.npmignore with whitelist');

console.log('✅ Dist package prepared successfully.');
