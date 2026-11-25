import { freezeHardenedPrototypes } from './user-code-sandbox-hardening';

// The hardening runs in its own realm (an iframe), as it does in the sandbox worker: freezing this window's
// built-ins would freeze the test runner's too.
describe('freezeHardenedPrototypes', () => {
  let frame: HTMLIFrameElement;
  let realm: any;

  const run = (body: string): unknown => new realm.Function(`'use strict';\n${body}`)();
  const errorOf = (body: string): string => {
    try {
      run(body);
      return 'no error';
    } catch (error) {
      return `${(error as Error).name}: ${(error as Error).message}`;
    }
  };

  beforeEach(() => {
    frame = document.createElement('iframe');
    document.body.appendChild(frame);
    realm = frame.contentWindow;
    freezeHardenedPrototypes([
      realm.Object, realm.Map, realm.Set, realm.Date, realm.RegExp, realm.Error, realm.Math, realm.JSON,
      realm.Promise, realm.URL, realm.URLSearchParams,
    ]);
  });

  afterEach(() => frame.remove());

  it('keeps ordinary assignments to inherited names working, as they do without the freeze', () => {
    expect(run(`const err = new Error('Timeout'); err.name = 'AbortError'; return String(err);`))
      .toBe('AbortError: Timeout');
    expect(run(`
      class TimeoutError extends Error {
        constructor(message) { super(message); this.name = 'TimeoutError'; }
      }
      const err = new TimeoutError('late');
      return [err.name, err instanceof Error, String(err)].join('|');
    `)).toBe('TimeoutError|true|TimeoutError: late');
    expect(run(`const err = new Error(); err.message = 'set later'; return err.message;`)).toBe('set later');
    expect(run(`const money = { cents: 250 }; money.toString = () => '$2.50'; return String(money);`)).toBe('$2.50');
    expect(run(`
      function Shape() {}
      Shape.prototype = { area() { return 0; } };
      Shape.prototype.constructor = Shape;
      return new Shape().constructor === Shape;
    `)).toBe(true);
    expect(run(`const counts = {}; counts['constructor'] = 1; counts['toString'] = 2; return counts.constructor + counts.toString;`))
      .toBe(3);
    expect(run(`
      function Cache() {}
      Cache.prototype = Object.create(Map.prototype);
      Cache.prototype.get = function (key) { return 'cached ' + key; };
      return Cache.prototype.get('a');
    `)).toBe('cached a');
  });

  it('defines the assigned property on the instance like a plain assignment would', () => {
    expect(run(`const err = new Error('x'); err.name = 'AbortError'; return JSON.stringify(err);`))
      .toBe('{"name":"AbortError"}');
    expect(run(`
      const err = new Error('x');
      err.name = 'AbortError';
      const d = Object.getOwnPropertyDescriptor(err, 'name');
      return [d.value, d.writable, d.enumerable, d.configurable].join('|');
    `)).toBe('AbortError|true|true|true');
    expect(run(`return [new Error('x').name, ({}).toString(), new Map([[1, 2]]).get(1)].join('|');`))
      .toBe('Error|[object Object]|2');
  });

  it('still refuses changes to the built-in prototypes themselves', () => {
    expect(errorOf(`Error.prototype.name = 'Hijacked';`)).toContain('TypeError');
    expect(errorOf(`Promise.prototype.then = function () {};`)).toContain('TypeError');
    expect(errorOf(`Object.prototype.toString = function () { return 'pwned'; };`)).toContain('TypeError');
    expect(errorOf(`Object.prototype.polluted = true;`)).toContain('TypeError');
    expect(errorOf(`Error.prototype.valueOf = function () {};`)).toContain('TypeError');
    expect(errorOf(`Object.defineProperty(Map.prototype, 'get', { value: () => 'fake' });`)).toContain('TypeError');
    expect(run(`
      return [
        Object.isFrozen(Object.prototype), Object.isFrozen(Error.prototype), Object.isFrozen(Promise.prototype),
        new Error('x').name, ({}).toString(), 'polluted' in {},
      ].join('|');
    `)).toBe('true|true|true|Error|[object Object]|false');
  });

  it('leaves prototypes outside the list open for polyfill drills', () => {
    expect(run(`
      Array.prototype.myMap = function (fn) { const out = []; for (let i = 0; i < this.length; i++) out.push(fn(this[i])); return out; };
      return [1, 2].myMap((x) => x * 2).join(',');
    `)).toBe('2,4');
  });
});
