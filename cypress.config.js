const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    video: true,  // Video kaydını etkinleştir
    videoCompression: 32, 
    videosFolder: 'cypress/videos', // Video dosyalarının kaydedileceği klasör
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      // Node olay dinleyicilerini burada uygulayın
      // Örneğin, özel raporlama veya loglama işlevleri ekleyebilirsiniz.
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
  // Cypress'ın hata mesajlarını daha görünür hale getirmek için bu seçenekleri ekleyin
  defaultCommandTimeout: 60000, // Komut zaman aşımını artırma
  pageLoadTimeout: 60000, // Sayfa yükleme zaman aşımını artırma
})
