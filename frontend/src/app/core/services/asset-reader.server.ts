import { Observable, defer, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { AssetReader } from './asset-reader';

export class ServerAssetReader implements AssetReader {
  readJson(relativePath: string): Observable<any | null> {
    return defer(() => from(this.readJsonFile(relativePath))).pipe(
      catchError(() => of(null))
    );
  }

  private async readJsonFile(relativePath: string): Promise<any | null> {
    const normalized = String(relativePath || '').replace(/^\/+/, '');
    const candidates = [
      path.resolve(process.cwd(), normalized),
      path.resolve(process.cwd(), 'src', normalized),
      path.resolve(process.cwd(), 'dist', 'frontendatlas', 'browser', normalized),
      path.resolve(process.cwd(), '..', 'browser', normalized),
    ];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue;
      const raw = await readFile(candidate, 'utf8');
      return JSON.parse(raw);
    }

    return null;
  }
}
