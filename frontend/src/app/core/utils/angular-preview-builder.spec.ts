import { makeAngularPreviewHtmlV1 } from './angular-preview-builder';
import { ANGULAR_PREVIEW_LABEL, ANGULAR_PREVIEW_VERSION } from './angular-preview-version';

describe('makeAngularPreviewHtmlV1', () => {
  const files = (main: string) => ({
    'src/main.ts': main,
    'src/app/app.component.ts': "import { Component } from '@angular/core';\n@Component({ selector: 'app-root', template: '' })\nexport class AppComponent {}\n",
  });
  const starter = "import { bootstrapApplication } from '@angular/platform-browser';\nimport { AppComponent } from './app/app.component';\nbootstrapApplication(AppComponent).catch(console.error);\n";

  function importMap(html: string): Record<string, string> {
    const json = html.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1] ?? '{}';
    return JSON.parse(json).imports;
  }

  it('runs this app’s Angular release, with every entry its bundles import', () => {
    const imports = importMap(makeAngularPreviewHtmlV1(files(starter), 'https://frontendatlas.com'));
    const angular = Object.entries(imports).filter(([name]) => name.startsWith('@angular/'));
    expect(angular.length).toBeGreaterThan(0);
    for (const [name, url] of angular) {
      expect(url).withContext(name).toContain(`@${ANGULAR_PREVIEW_VERSION}/fesm2022/`);
    }
    // Angular 21's core imports these by name; a missing entry fails the whole preview.
    expect(imports['@angular/core/primitives/di']).toContain('primitives-di.mjs');
    expect(imports['@angular/core/primitives/signals']).toContain('primitives-signals.mjs');
    expect(ANGULAR_PREVIEW_LABEL).toBe(`Angular ${ANGULAR_PREVIEW_VERSION.split('.')[0]} · zone.js`);
  });

  it('asks for zone change detection unless the app chooses its own', () => {
    const zoneDefault = makeAngularPreviewHtmlV1(files(starter), 'https://frontendatlas.com');
    expect(zoneDefault).toContain('if (provide && !false)');

    const zoneless = makeAngularPreviewHtmlV1(files(
      "import { provideZonelessChangeDetection } from '@angular/core';\n" + starter.replace(
        'bootstrapApplication(AppComponent)',
        'bootstrapApplication(AppComponent, { providers: [provideZonelessChangeDetection()] })',
      ),
    ), 'https://frontendatlas.com');
    expect(zoneless).toContain('if (provide && !true)');
  });

  it('keeps the bootstrap promise itself, so a starter’s .catch cannot hide a failed bootstrap', () => {
    const html = makeAngularPreviewHtmlV1(files(starter), 'https://frontendatlas.com');
    expect(html).toContain("'globalThis.__FA_bootstrap(bootstrapApplication, '");
    expect(html).toContain('globalThis.__FA_BOOTSTRAP_PROMISE = promise;');
    expect(html).toContain('var faSignalJitTransformer = (');
  });
});
