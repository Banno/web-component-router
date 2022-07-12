module.exports = function(config) {
  config.set({
    basePath: '..',
    files: [
      {
        pattern:'*.js',
        type: 'module',
        included: false
      },
      {
        pattern:'lib/**/*.js',
        type: 'module',
        included: false
      },
      {
        pattern:'test/**/*spec.js',
        type: 'module',
        included: false
      },
      {
        pattern:'test/?(fixtures|utils)/**/*.js',
        type: 'module',
        included: false
      },
      {
        pattern: 'node_modules/?(@webcomponents|@polymer)/**/*.js',
        type: 'module',
        included: false
      },
      {
        pattern: 'node_modules/path-to-regexp/dist.es2015/index.js',
        type: 'module',
        included: false
      },
      'test/karma-init-pre.js',
      'test/karma-init.js'
    ],
    frameworks: ['jasmine'],
    exclude: [],
    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-spec-reporter'
    ],
    reporters: ['spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadless'],
    singleRun: false,
    concurrency: Infinity,
    browserConsoleLogOptions: {
      terminal: true,
      level: ''
    },
    client: {
      jasmine: {
        random: false,
        oneFailurePerSpec: true,
        failFast: true
      }
    }
  })
};
