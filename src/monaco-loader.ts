// @ts-ignore
self.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: string, label: string) {
        if (label === 'json') {
            return './assets/monaco/json.worker.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return './assets/monaco/css.worker.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return './assets/monaco/html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return './assets/monaco/ts.worker.js';
        }
        return './assets/monaco/editor.worker.js';
    }
};
