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
      return config
    },
    baseUrl: 'https://www.franceculture.fr',
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    responseTimeout: 30000,
    requestTimeout: 10000,
    video: true,
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled: 'mochawesome, mocha-junit-reporter',
      mochawesomeReporterOptions: {
        reportDir: 'cypress/reports/json',
        overwrite: false,
        html: false,
        json: true
      },
      mochaJunitReporterReporterOptions: {
        mochaFile: 'cypress/reports/junit/results-[hash].xml'
      }
    },
    retries: {
      runMode: 2,
      openMode: 0
    }
  }
})