const customLaunchers = {
  ChromeWithImportMapSupport: {
    base: 'ChromeHeadless',
    flags: [
      '--enable-experimental-web-platform-features'
    ],
  }
};

/**
 * Returns a preprocessor function for Karma to convert certain modules to ES6 modules
 *
 * This is by no means comprehensive, but just enough to let us run page.js in the browser as an ES Module
 */
function ConvertToEsmFactory(config) { // eslint-disable-line no-unused-vars
  return function(content, file, next) {
    let esmContent = content.replace(
        /(^|\s|;)((var|let|const)\s*([^=]+)=\s*)?require\(([^)]+)\)/g,
        (fullMatch, leadingChar, varSetup, varType, varName, url) => {
          let slashIndex = url.indexOf('/');
          if (slashIndex >= 0 && /^['"]@/.test(url))  {
            slashIndex = url.indexOf('/', slashIndex + 1);
          }
          if (slashIndex >= 0 && !/\.m?js['"]/.test(url)) {
            url = url.replace(/['"]$/, '.js$&');
          }
          if (varSetup.length > 0) {
            return `${leadingChar}import ${varName}from ${url}`;
          }
          return `${leadingChar}import ${url}`;
        });

    esmContent = `const module = {exports:{}};let exports = module.exports;let define;${esmContent}\nexport default module.exports;`;
    return next(null, esmContent);
  };
}

module.exports = function(config) {
  config.set({
    basePath: '..',
    customLaunchers,
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
        pattern: 'node_modules/?(isarray|path-to-regexp|page)/*.js',
        type: 'module',
        included: false
      },
      {
        pattern: 'node_modules/qs/**/*.js',
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
      'karma-spec-reporter',
      {'preprocessor:convertToEsm': ['factory', ConvertToEsmFactory]},
    ],
    preprocessors: {
      'node_modules/qs/lib/**/*.js': ['convertToEsm'],
      'node_modules/?(isarray|path-to-regexp|page)/*.js': ['convertToEsm'],
    },
    reporters: ['spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeWithImportMapSupport'],
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
