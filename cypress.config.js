const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      // Raporlayıcıyı ayarlayın
      on('after:run', (results) => {
        const mochaJunitReporter = require('mocha-junit-reporter');
        mochaJunitReporter(results);
      });
    },
  },
  reporter: 'mocha-junit-reporter',
  reporterOptions: {
    mochaFile: 'cypress/results/junit-results.xml', // Sonuç dosyasının yolu
    toConsole: true, // Konsola da yazdır
  },
})
