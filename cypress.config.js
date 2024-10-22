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
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      configFile: 'reporter-config.json'
    }
  },
  defaultCommandTimeout: 60000,
  pageLoadTimeout: 60000
})