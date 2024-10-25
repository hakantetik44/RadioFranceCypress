pipeline {
    agent any

    tools {
        // Node.js versiyonunu burada belirtiyoruz
        nodejs 'Node.js 22.9'
    }

    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        REPORT_DIR = "cypress/reports"
        TIMESTAMP = "${new Date().format('yyyy-MM-dd_HH-mm-ss')}"
        GIT_COMMIT_MSG = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
        GIT_AUTHOR = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
        TEST_HISTORY_DIR = "${WORKSPACE}/test-history"
    }

    stages {
        stage('Preparation') {
            steps {
                script {
                    echo "🚀 Starting the test pipeline"
                }

                checkout scm

                sh '''
                    mkdir -p ${CYPRESS_CACHE_FOLDER}
                    mkdir -p ${REPORT_DIR}/{json,html,pdf}
                    mkdir -p cypress/{videos,screenshots,logs}
                    mkdir -p ${TEST_HISTORY_DIR}

                    # Initialize history file if it doesn't exist
                    if [ ! -f "${TEST_HISTORY_DIR}/history.csv" ]; then
                        echo "BuildNumber,Timestamp,TotalTests,PassedTests,Duration" > "${TEST_HISTORY_DIR}/history.csv"
                    fi
                '''
            }
        }

        stage('Installation') {
            steps {
                script {
                    echo "📦 Installing Node.js..."

                    // Install NVM and Node.js
                    sh '''
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                        nvm install 22.9
                        nvm use 22.9
                    '''

                    // Install project dependencies
                    sh '''
                        npm cache clean --force
                        npm ci
                        npm install --save-dev cypress-multi-reporters mocha-junit-reporter mochawesome mochawesome-merge mochawesome-report-generator puppeteer markdown-pdf
                    '''

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

                    writeFile file: 'generateReport.js', text: '''
                        const fs = require('fs');
                        const puppeteer = require('puppeteer');

                        async function generatePDF() {
                            try {
                                const testResults = JSON.parse(fs.readFileSync('cypress/reports/mochawesome.json', 'utf8'));
                                const logFilePath = 'cypress/logs/test-execution.log';
                                const logs = fs.existsSync(logFilePath) ? fs.readFileSync(logFilePath, 'utf8').split('\\n').filter(line => line.trim()) : [];
                                const uniqueLogs = [...new Set(logs)];
                                const report = createReport(testResults);
                                const htmlContent = generateHTMLContent(report, uniqueLogs);
                                await savePDF(htmlContent);
                            } catch (error) {
                                console.error('Error generating report:', error.message);
                                process.exit(1);
                            }
                        }

                        function createReport(testResults) {
                            return {
                                title: "🎯 Test Execution Report",
                                date: new Date().toLocaleString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }),
                                summary: {
                                    total: testResults.stats.tests,
                                    passed: testResults.stats.passes,
                                    failed: testResults.stats.failures,
                                    duration: (testResults.stats.duration / 1000).toFixed(2)
                                },
                                results: testResults.results[0].suites.map(suite => ({
                                    title: suite.title,
                                    tests: suite.tests.map(test => ({
                                        title: test.title,
                                        status: test.state === 'passed' ? '✅' : '❌',
                                        duration: (test.duration / 1000).toFixed(2),
                                        error: test.err ? test.err.message : null
                                    }))
                                }))
                            };
                        }

                        function generateHTMLContent(report, uniqueLogs) {
                            return `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta charset="UTF-8">
                                    <style>
                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                        .header { background: #0047AB; color: white; padding: 20px; border-radius: 5px; }
                                        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                                        .results { margin: 20px 0; }
                                        .test { margin: 10px 0; padding: 10px; background: #fff; border: 1px solid #eee; }
                                        .logs { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                                    </style>
                                </head>
                                <body>
                                    <div class="header">
                                        <h1>${report.title}</h1>
                                        <p>Date: ${report.date}</p>
                                    </div>
                                    <div class="summary">
                                        <h2>📊 Summary</h2>
                                        <p>Total Tests: ${report.summary.total}</p>
                                        <p>Passed Tests: ${report.summary.passed}</p>
                                        <p>Failed Tests: ${report.summary.failed}</p>
                                        <p>Duration: ${report.summary.duration}s</p>
                                    </div>
                                    <div class="results">
                                        <h2>🔍 Detailed Results</h2>
                                        ${report.results.map(suite => `
                                            <div class="suite">
                                                <h3>${suite.title}</h3>
                                                ${suite.tests.map(test => `
                                                    <div class="test">
                                                        <p>${test.status} ${test.title}</p>
                                                        <p>Duration: ${test.duration}s</p>
                                                        ${test.error ? `<p style="color: red">Error: ${test.error}</p>` : ''}
                                                    </div>`).join('')}
                                            </div>`
                                        ).join('')}
                                    </div>
                                    <div class="logs">
                                        <h2>📝 Execution Log</h2>
                                        ${uniqueLogs.map(log => `<p>${log}</p>`).join('')}
                                    </div>
                                </body>
                                </html>
                            `;
                        }

                        async function savePDF(htmlContent) {
                            const browser = await puppeteer.launch({
                                args: ['--no-sandbox', '--disable-setuid-sandbox']
                            });
                            const page = await browser.newPage();
                            await page.setContent(htmlContent);
                            await page.pdf({
                                path: 'cypress/reports/pdf/report.pdf',
                                format: 'A4',
                                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
                                printBackground: true
                            });
                            await browser.close();
                        }

                        generatePDF();
                    '''
                }
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Running Cypress tests..."

                        sh '''
                            export LANG=en_US.UTF-8
                            export LC_ALL=en_US.UTF-8

                            # Verify Cypress installation
                            VERIFY_TIMEOUT=120000 npx cypress verify

                            # Run Cypress tests
                            CYPRESS_VERIFY_TIMEOUT=120000 npx cypress run \
                                --browser chrome \
                                --headless \
                                --config video=true \
                                --reporter cypress-multi-reporters \
                                --reporter-options configFile=reporter-config.json

                            # Generate reports
                            npx mochawesome-merge "${REPORT_DIR}/json/*.json" > "${REPORT_DIR}/mochawesome.json"
                            npx marge "${REPORT_DIR}/mochawesome.json" \
                                --reportDir "${REPORT_DIR}/html" \
                                --inline \
                                --charts \
                                --title "France Culture Test Results"

                            # Generate PDF report
                            node generateReport.js
                        '''
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
                cypress/reports/html/*,
                cypress/reports/pdf/*,
                cypress/videos/*,
                cypress/screenshots/**/*
            ''', allowEmptyArchive: true

            junit allowEmptyResults: true, testResults: 'cypress/reports/junit/*.xml'
        }
        success {
            echo """
                ✅ Test Summary:
                - Status: SUCCESS
                - End: ${env.BUILD_TIMESTAMP}
            """
        }
        failure {
            echo """
                ❌ Test Summary:
                - Status: FAILED
                - End: ${env.BUILD_TIMESTAMP}
            """
        }
    }
}
