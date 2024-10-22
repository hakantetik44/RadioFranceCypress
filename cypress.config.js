const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(`CYPRESS_LOG: ${message}`);
          return null;
        },
      });

      const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');
      addMatchImageSnapshotPlugin(on, config);
    },
    baseUrl: 'https://www.franceculture.fr',
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    responseTimeout: 30000,
    requestTimeout: 10000,
    video: true,
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    reporter: 'mocha-multi-reporters',
    reporterOptions: {
      config: {
        "mochaFile": "cypress/reports/test-output.xml",
        "toConsole": true
      }
    }
  }
});
