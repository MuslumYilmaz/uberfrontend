// Make a stable global symbol for the current question id
export function toGlobalName(id: string) {
    return `__UF_${id.replace(/[^a-zA-Z0-9_]/g, '_')}__default`;
}

/**
 * Wrap user code so the default export ends up on globalThis[globalName].
 * Handles:
 *   - export default <expr>
 *   - export default function name() {}
 *   - export default async function name() {}
 * Leaves named function declarations in place so tests can still see the name.
 */
export function wrapExportDefault(source: string, id: string): string {
    const g = toGlobalName(id);
    let code = source;

    // export default function name() { .. }
    if (/\bexport\s+default\s+async?\s*function\s+[\w$]+\s*\(/.test(code)) {
        code = code
            .replace(/\bexport\s+default\s+async?\s*function\s+([\w$]+)\s*\(/, (m, name) =>
                m.replace(/export\s+default\s+/, '') // keep `function name(` as-is
            )
            + `\n;globalThis["${g}"] = typeof ${RegExp.$1} !== "undefined" ? ${RegExp.$1} : globalThis["${g}"];`;
        return code;
    }

    // export default <expr>
    if (/\bexport\s+default\b/.test(code)) {
        return code.replace(/\bexport\s+default\b/, `globalThis["${g}"] =`);
    }

    // Fallback: if the user didn't use export default, just leave code and don't crash
    return `${code}\n;globalThis["${g}"] = globalThis["${g}"] ?? (typeof __UF_DEFAULT__!=="undefined" ? __UF_DEFAULT__ : undefined);`;
}

/**
 * Transform tests:
 *  - strip default import lines that reference the SUT file
 *  - remember the default identifier(s)
 *  - prepend: const SUT = globalThis["<global>"]; const <alias> = SUT; (for each alias)
 * Works for lines like:
 *   import deepClone from './solution';
 *   import fn from "user";
 *   import answer from "./index";
 */
export function transformTestCode(raw: string, id: string): string {
    const g = toGlobalName(id);
    const aliases: string[] = [];

    // capture and remove default imports
    const defaultImport = /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm;
    let code = raw.replace(defaultImport, (_m, ident: string, path: string) => {
        // treat common paths as SUT; keep it generic (we’re sandboxed anyway)
        if (/^\.\//.test(path) || /^(user|SUT|solution|index|main)$/.test(path)) {
            aliases.push(ident);
            return '';
        }
        return _m; // leave unrelated imports alone (rare in your setup, but safe)
    });

    // also strip cases like: import {something} from './solution' (not used usually)
    code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"](SUT|user|\.\/solution|\.\/index|\.\/main)['"]\s*;?\s*$/gm, '');

    let header = `const SUT = globalThis["${g}"];`;
    if (aliases.length) {
        header += '\n' + aliases.map(a => `const ${a} = SUT;`).join('\n');
    }

    return `${header}\n${code}`;
}