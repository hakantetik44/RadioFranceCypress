pipeline {
    agent any

    tools {
        nodejs 'Node.js 22.9'
    }

    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}\\.cypress-cache"
        REPORT_DIR = "cypress\\reports"
        TIMESTAMP = new Date().format('yyyy-MM-dd_HH-mm-ss')
        GIT_COMMIT_MSG = bat(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
        GIT_AUTHOR = bat(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
        TEST_HISTORY_DIR = "${WORKSPACE}\\test-history"
    }

    stages {
        stage('Preparation') {
            steps {
                script {
                    echo "🚀 Starting the test pipeline"
                }

                checkout scm

                bat """
                    if not exist "${CYPRESS_CACHE_FOLDER}" mkdir "${CYPRESS_CACHE_FOLDER}"
                    if not exist "${REPORT_DIR}\\json" mkdir "${REPORT_DIR}\\json"
                    if not exist "${REPORT_DIR}\\html" mkdir "${REPORT_DIR}\\html"
                    if not exist "${REPORT_DIR}\\pdf" mkdir "${REPORT_DIR}\\pdf"
                    if not exist "cypress\\videos" mkdir "cypress\\videos"
                    if not exist "cypress\\screenshots" mkdir "cypress\\screenshots"
                    if not exist "cypress\\logs" mkdir "cypress\\logs"
                    if not exist "${TEST_HISTORY_DIR}" mkdir "${TEST_HISTORY_DIR}"

                    if not exist "${TEST_HISTORY_DIR}\\history.csv" (
                        echo BuildNumber,Timestamp,TotalTests,PassedTests,Duration > "${TEST_HISTORY_DIR}\\history.csv"
                    )
                """
            }
        }

        stage('Installation') {
            steps {
                script {
                    echo "📦 Installing dependencies..."
                }

                bat """
                    npm cache clean --force
                    npm ci
                    npm install --save-dev cypress-multi-reporters mocha-junit-reporter mochawesome mochawesome-merge mochawesome-report-generator puppeteer markdown-pdf
                """

                writeFile file: 'reporter-config.json', text: '''
                    {
                        "reporterEnabled": "spec, mocha-junit-reporter, mochawesome",
                        "mochaJunitReporterReporterOptions": {
                            "mochaFile": "cypress/reports/junit/results-[hash].xml"
                        },
                        "mochawesomeReporterOptions": {
                            "reportDir": "cypress/reports/json",
                            "overwrite": false,
                            "html": true,
                            "json": true,
                            "timestamp": true,
                            "reportTitle": "France Culture Test Results"
                        }
                    }
                '''

                // generateReport.js dosyası aynı kalabilir çünkü Node.js cross-platform çalışır
                writeFile file: 'generateReport.js', text: '''
                    // Önceki generateReport.js içeriği aynen kalacak
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Running Cypress tests..."

                        bat """
                            set VERIFY_TIMEOUT=120000
                            npx cypress verify

                            set CYPRESS_VERIFY_TIMEOUT=120000
                            npx cypress run ^
                                --browser chrome ^
                                --headless ^
                                --config video=true ^
                                --reporter cypress-multi-reporters ^
                                --reporter-options configFile=reporter-config.json

                            :: Generate reports
                            npx mochawesome-merge "%REPORT_DIR%\\json\\*.json" > "%REPORT_DIR%\\mochawesome.json"
                            npx marge "%REPORT_DIR%\\mochawesome.json" ^
                                --reportDir "%REPORT_DIR%\\html" ^
                                --inline ^
                                --charts ^
                                --title "France Culture Test Results"

                            :: Generate PDF report
                            node generateReport.js
                        """
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        echo "Tests encountered an error: ${e.getMessage()}"
                        throw e
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '''
                cypress\\reports\\html\\*,
                cypress\\reports\\pdf\\*,
                cypress\\videos\\*,
                cypress\\screenshots\\**\\*
            ''', allowEmptyArchive: true

            junit allowEmptyResults: true, testResults: 'cypress\\reports\\junit\\*.xml'
        }
        success {
            echo """
                ✅ Test Summary:
                - Status: SUCCESS
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Report PDF: cypress\\reports\\pdf\\report.pdf
                """
        }
        failure {
            echo """
                ❌ Test Summary:
                - Status: FAILED
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Check the reports for details
                """
        }

        cleanup {
            cleanWs()
        }
    }
}