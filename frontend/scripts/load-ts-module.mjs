import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * Evaluates a data module from src/app in Node, for generators that need its values rather than its syntax.
 * Relative imports load the same way and imports used only as types disappear, so an import of anything
 * else fails loudly instead of pulling Angular into a script.
 */
export function loadTsModule(filePath, cache = new Map()) {
  const cached = cache.get(filePath);
  if (cached) return cached.exports;
  const { outputText } = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  cache.set(filePath, module);
  const require = (specifier) => {
    if (!specifier.startsWith('.')) throw new Error(`[load-ts-module] ${filePath} imports ${specifier}, which a data module must not need.`);
    return loadTsModule(path.resolve(path.dirname(filePath), `${specifier}.ts`), cache);
  };
  new Function('require', 'module', 'exports', outputText)(require, module, module.exports);
  return module.exports;
}
