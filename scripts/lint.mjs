import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const allowedExtensions = new Set(['.ts', '.mjs', '.json', '.md', '.sql']);
const ignoredDirectories = new Set(['node_modules', '.git', 'dist']);
const problems = [];

async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        if (ignoredDirectories.has(entry.name)) {
            continue;
        }
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            await walk(fullPath);
            continue;
        }
        const extension = path.extname(entry.name);
        if (allowedExtensions.has(extension)) {
            const fileStat = await stat(fullPath);
            if (fileStat.size === 0) {
                problems.push(`${path.relative(root, fullPath)} is empty`);
            }
        }
    }
}

await walk(root);

if (problems.length > 0) {
    console.error('Lint failed:');
    for (const problem of problems) {
        console.error(`- ${problem}`);
    }
    process.exitCode = 1;
} else {
    console.log('Lint passed');
}
