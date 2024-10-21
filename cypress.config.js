const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    video: true,  // Video kaydını etkinleştir
    videoCompression: 32, 
    videosFolder: 'cypress/videos', 
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      
    },
  },
  reporter: 'mocha',
  reporterOptions: {
    reportDir: 'cypress/results',
    overwrite: false,
    html: false,
    json: true,
    toConsole: true, // Konsola rapor yazdır
  },
  
  defaultCommandTimeout: 60000, 
  pageLoadTimeout: 60000, 
})
