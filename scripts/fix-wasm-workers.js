import fs from 'fs';
import path from 'path';

const PKG_WEB_SNIPPETS = 'pkg/web/snippets';

if (fs.existsSync(PKG_WEB_SNIPPETS)) {
    const rayonDirs = fs.readdirSync(PKG_WEB_SNIPPETS).filter(d => d.startsWith('wasm-bindgen-rayon'));
    console.log(`🔍 Found rayon snippets: ${rayonDirs.join(', ')}`);
    
    for (const dir of rayonDirs) {
        const workerFile = path.join(PKG_WEB_SNIPPETS, dir, 'src', 'workerHelpers.worker.js');
        
        if (fs.existsSync(workerFile)) {
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
        }
    }
} else {
    console.log('No web snippets directory found. Skipping worker helper fix.');
}
