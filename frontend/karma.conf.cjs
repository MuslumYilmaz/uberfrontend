const path = require('node:path');

module.exports = (config) => {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    jasmineHtmlReporter: { suppressAll: true },
    coverageReporter: {
      dir: path.join(__dirname, 'coverage/frontendatlas'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessUnit: {
        base: 'ChromeHeadless',
        // The suite shares one page. Chrome otherwise drops history updates after
        // 200 rapid calls, making URL-dependent tests depend on their run order.
        flags: ['--disable-ipc-flooding-protection'],
      },
    },
    restartOnFileChange: true,
  });
};
