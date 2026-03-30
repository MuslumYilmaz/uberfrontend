import { Observable, defer, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AssetReader } from './asset-reader';

export class ServerAssetReader implements AssetReader {
  readJson(relativePath: string): Observable<any | null> {
    return defer(() => from(this.readJsonFile(relativePath))).pipe(
      catchError(() => of(null))
    );
  }

  private async readJsonFile(relativePath: string): Promise<any | null> {
    const normalized = String(relativePath || '').replace(/^\/+/, '');
    const cwd = process.cwd();
    const serverDir = path.dirname(fileURLToPath(import.meta.url));
    const repoContentPaths = this.resolveRepoContentPaths(normalized, cwd);
    const candidates = [
      path.resolve(cwd, normalized),
      path.resolve(cwd, 'src', normalized),
      path.resolve(cwd, 'frontend', normalized),
      path.resolve(cwd, 'frontend', 'src', normalized),
      path.resolve(cwd, 'dist', 'frontendatlas', 'browser', normalized),
      path.resolve(cwd, '..', 'dist', 'frontendatlas', 'browser', normalized),
      path.resolve(serverDir, '..', 'browser', normalized),
      path.resolve(serverDir, '../../browser', normalized),
      ...repoContentPaths,
    ];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue;
      const raw = await readFile(candidate, 'utf8');
      return JSON.parse(raw);
    }

    return null;
  }

  private resolveRepoContentPaths(relativePath: string, cwd: string): string[] {
    const cdnRoots = [
      path.resolve(cwd, 'cdn'),
      path.resolve(cwd, '..', 'cdn'),
      path.resolve(cwd, 'frontend', '..', 'cdn'),
    ];

    const subPath = this.resolveContentSubPath(relativePath);
    if (!subPath) return [];

    return cdnRoots.map((cdnRoot) => path.join(cdnRoot, subPath));
  }

  private resolveContentSubPath(relativePath: string): string | null {
    if (relativePath.startsWith('assets/questions/')) {
      return path.join('questions', relativePath.slice('assets/questions/'.length));
    }
    if (relativePath.startsWith('assets/incidents/')) {
      return path.join('incidents', relativePath.slice('assets/incidents/'.length));
    }
    if (relativePath.startsWith('assets/tradeoff-battles/')) {
      return path.join('tradeoff-battles', relativePath.slice('assets/tradeoff-battles/'.length));
    }
    if (relativePath.startsWith('assets/practice/')) {
      return path.join('practice', relativePath.slice('assets/practice/'.length));
    }
    if (relativePath === 'assets/data-version.json') {
      return 'data-version.json';
    }
    return null;
  }
}
