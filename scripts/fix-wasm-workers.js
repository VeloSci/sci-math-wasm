import fs from 'fs';
import path from 'path';

const PKG_WEB_SNIPPETS = 'pkg/web/snippets';

if (fs.existsSync(PKG_WEB_SNIPPETS)) {
    const rayonDirs = fs.readdirSync(PKG_WEB_SNIPPETS).filter(d => d.startsWith('wasm-bindgen-rayon'));
    
    if (rayonDirs.length === 0) {
        console.error('❌ ERROR: No rayon snippets found in pkg/web/snippets. WASM build might be incomplete.');
        process.exit(1);
    }
    
    console.log(`🔍 Found rayon snippets: ${rayonDirs.join(', ')}`);
    
    for (const dir of rayonDirs) {
        const rayonDirPath = path.join(PKG_WEB_SNIPPETS, dir);
        
        // Recursive function to find the worker file
        const findWorkerFile = (dirPath) => {
             const files = fs.readdirSync(dirPath);
             for (const file of files) {
                 const fullPath = path.join(dirPath, file);
                 const stat = fs.statSync(fullPath);
                 if (stat.isDirectory()) {
                     const found = findWorkerFile(fullPath);
                     if (found) return found;
                 } else if (file === 'workerHelpers.worker.js') {
                     return fullPath;
                 }
             }
             return null;
        };

        const workerFile = findWorkerFile(rayonDirPath);
        
        if (workerFile) {
            let content = fs.readFileSync(workerFile, 'utf8');
            
            // Fix deprecation: initWbg(module, memory) -> initWbg({ module_or_path: module, memory })
            const oldCall = 'await initWbg(module, memory);';
            const newCall = 'await initWbg({ module_or_path: module, memory });';
            
            if (content.includes(oldCall)) {
                content = content.replace(oldCall, newCall);
                fs.writeFileSync(workerFile, content);
                console.log(`✅ Patched: ${workerFile} (Deprecation fixed)`);
            } else {
                console.log(`ℹ️ Already patched or pattern not found: ${workerFile}`);
            }
        } else {
            console.error(`❌ ERROR: workerHelpers.worker.js not found in ${rayonDirPath}`);
            process.exit(1);
        }
    }
} else {
    console.error(`❌ ERROR: Web snippets directory not found: ${PKG_WEB_SNIPPETS}`);
    console.error('Make sure "wasm:build:web" was run successfully.');
    process.exit(1);
}
