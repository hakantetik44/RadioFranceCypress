const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    video: true,  // Video kaydını etkinleştir
    videoCompression: 32, 
    videosFolder: 'cypress/videos', // Video dosyalarının kaydedileceği klasör
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      // Node olay dinleyicilerini burada uygulayın
    },
  },
  reporter: 'mocha',
  reporterOptions: {
    reportDir: 'cypress/results',
    overwrite: false,
    html: false,
    json: true,
  },
})
