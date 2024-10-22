const { defineConfig } = require('cypress')
const allureWriter = require('@shelex/cypress-allure-plugin/writer')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Allure reporter setup
      allureWriter(on, config)
      
      // Existing task configuration
      on('task', {
        log(message) {
          console.log(`CYPRESS_LOG: ${message}`)
          return null
        },
      })
      
      return config
    },
    // Existing configurations
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
    }
  }
})