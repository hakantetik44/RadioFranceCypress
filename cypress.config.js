{
  "reporterEnabled": "spec, mocha-junit-reporter, mochawesome",
  "mochaJunitReporterReporterOptions": {
      "mochaFile": "cypress/reports/junit/results-[hash].xml"
  },
  "mochawesomeReporterOptions": {
      "reportDir": "cypress/reports/json",
      "overwrite": false,
      "html": false,
      "json": true
  }
}