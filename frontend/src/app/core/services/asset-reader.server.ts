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
    const candidates = [
      path.resolve(cwd, normalized),
      path.resolve(cwd, 'src', normalized),
      path.resolve(cwd, 'frontend', normalized),
      path.resolve(cwd, 'frontend', 'src', normalized),
      path.resolve(cwd, 'dist', 'frontendatlas', 'browser', normalized),
      path.resolve(cwd, '..', 'dist', 'frontendatlas', 'browser', normalized),
      path.resolve(serverDir, '..', 'browser', normalized),
      path.resolve(serverDir, '../../browser', normalized),
    ];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue;
      const raw = await readFile(candidate, 'utf8');
      return JSON.parse(raw);
    }

    return null;
  }
}
