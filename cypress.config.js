const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(`CYPRESS_LOG: ${message}`)
          return null
        },
      })
    },
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled: 'mochawesome, mocha-junit-reporter',
      mochawesomeReporterOptions: {
        reportDir: 'cypress/reports/mocha',
        overwrite: false,
        html: true,
        json: true,
        timestamp: true,
        charts: true,
        embeddedScreenshots: true,
        inlineAssets: true,
        saveAllAttempts: false,
        code: true
      },
      mochaJunitReporterReporterOptions: {
        mochaFile: 'cypress/reports/junit/results-[hash].xml'
      }
    }
  },
  defaultCommandTimeout: 60000,
  pageLoadTimeout: 60000,
  retries: {
    runMode: 2,
    openMode: 0
  }
})