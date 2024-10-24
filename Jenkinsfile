pipeline {
    agent any

    tools {
        nodejs 'Node.js 22.9'
    }

    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        REPORT_DIR = "cypress/reports"
        TIMESTAMP = new Date().format('yyyy-MM-dd_HH-mm-ss')
        GIT_COMMIT_MSG = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
        GIT_AUTHOR = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
    }

    stages {
        stage('Preparation') {
            steps {
                script {
                    echo """
                        ╔══════════════════════════════════╗
                        ║         Test Automation          ║
                        ╚══════════════════════════════════╝
                    """
                }

                checkout scm

                sh """
                    mkdir -p $CYPRESS_CACHE_FOLDER
                    mkdir -p ${REPORT_DIR}/{json,html,pdf,junit}
                    mkdir -p cypress/videos cypress/screenshots
                """
            }
        }

        stage('Installation') {
            steps {
                script {
                    echo "📦 Installing dependencies..."
                }

                sh '''
                    export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                    rm -rf node_modules
                    npm install
                    npx cypress install --force
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter jspdf
                '''

                writeFile file: 'cypress.config.js', text: '''
                    const { defineConfig } = require('cypress')

                    module.exports = defineConfig({
                        e2e: {
                            setupNodeEvents(on, config) {
                                on('task', {
                                    log(message) {
                                        console.log(`CYPRESS_LOG: ${message}`)
                                        return null
                                    }
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
                                configFile: 'reporter-config.json'
                            }
                        }
                    })
                '''

                writeFile file: 'reporter-config.json', text: '''
                    {
                        "reporterEnabled": "mochawesome, mocha-junit-reporter",
                        "mochawesomeReporterOptions": {
                            "reportDir": "cypress/reports/json",
                            "overwrite": false,
                            "html": false,
                            "json": true
                        },
                        "mochaJunitReporterReporterOptions": {
                            "mochaFile": "cypress/reports/junit/results-[hash].xml",
                            "toConsole": true
                        }
                    }
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "⚡ Running tests..."

                        sh '''
                            export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                            
                            CYPRESS_VERIFY_TIMEOUT=120000 \
                            NO_COLOR=1 \
                            npx cypress run \
                                --browser electron \
                                --headless \
                                --config-file cypress.config.js \
                                --spec "cypress/e2e/RadioFrance.cy.js" \
                                2>&1 | grep -E "Running:|✓|CYPRESS_LOG:|Passing|Tests|Duration|Fonctionnalités" \
                                | grep -v "DevTools" \
                                | grep -v "Module" \
                                | grep -v "Node" \
                                | grep -v "Searching" \
                                | grep -v "browser" \
                                | grep -v "device"

                            TEST_STATUS=$?
                            
                            if [ -d "cypress/reports/json" ]; then
                                npx mochawesome-merge "cypress/reports/json/*.json" > "cypress/reports/mochawesome.json"
                                npx marge "cypress/reports/mochawesome.json" --reportDir "cypress/reports/html" --inline
                            else
                                echo "❌ No test results found"
                                exit 1
                            fi

                            exit $TEST_STATUS
                        '''

                        writeFile file: 'createReport.js', text: '''
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('cypress/reports/mochawesome.json', 'utf8'));
                                const doc = new jsPDF({
                                    orientation: 'portrait',
                                    unit: 'mm',
                                    format: 'a4'
                                });

                                // Helper function for markdown-like headers
                                const addHeader = (text, level = 1, yPos) => {
                                    const fontSize = 24 - (level * 4);
                                    doc.setFontSize(fontSize);
                                    return doc.text('#'.repeat(level) + ' ' + text, 20, yPos);
                                };

                                const dateStr = new Date().toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                }).replace(':', 'h');

                                let yPos = 20;

                                addHeader("Rapport d'Exécution des Tests", 1, yPos);
                                doc.setFontSize(12);
                                doc.text(dateStr, 20, yPos + 10);

                                yPos += 30;
                                addHeader("Résumé", 2, yPos);
                                yPos += 15;

                                const stats = [
                                    `Tests Total: ${report.stats.tests}`,
                                    `Tests Passés: ${report.stats.passes}`,
                                    `Tests Échoués: ${report.stats.failures || 0}`,
                                    `Durée: ${(report.stats.duration / 1000).toFixed(2)}s`
                                ];

                                stats.forEach(stat => {
                                    doc.text('- ' + stat, 25, yPos);
                                    yPos += 10;
                                });

                                yPos += 10;
                                addHeader("Résultats Détaillés", 2, yPos);
                                yPos += 15;

                                const suiteName = report.results[0]?.suites[0]?.title || "Test Suite";
                                addHeader(suiteName, 3, yPos);
                                yPos += 15;

                                if (report.results && report.results[0]?.suites[0]?.tests) {
                                    report.results[0].suites[0].tests.forEach((test) => {
                                        addHeader(test.title, 4, yPos);
                                        yPos += 10;
                                        doc.setFontSize(12);
                                        doc.text(`- Status: ${test.state === 'passed' ? '✅ Passé' : '❌ Échoué'}`, 25, yPos);
                                        yPos += 10;
                                        doc.text(`- Durée: ${(test.duration / 1000).toFixed(2)}s`, 25, yPos);
                                        yPos += 20;

                                        if (yPos > 250) {
                                            doc.addPage();
                                            yPos = 20;
                                        }
                                    });
                                }

                                addHeader("Journal d'Exécution", 2, yPos);
                                yPos += 15;

                                const testLogs = [];
                                report.results[0]?.suites[0]?.tests.forEach(test => {
                                    if (test.commands) {
                                        test.commands.forEach(cmd => {
                                            if (cmd.name === 'task' && cmd.message.includes('CYPRESS_LOG')) {
                                                const logMessage = cmd.message.replace('CYPRESS_LOG: ', '');
                                                testLogs.push(logMessage);
                                            }
                                        });
                                    }
                                });

                                testLogs.forEach(log => {
                                    if (yPos > 250) {
                                        doc.addPage();
                                        yPos = 20;
                                    }
                                    doc.setFontSize(12);
                                    if (log.includes('SUCCESS') || log.includes('PASSED')) {
                                        doc.text(`✅ ${log}`, 20, yPos);
                                    } else if (log.includes('INFO')) {
                                        doc.text(`ℹ️ ${log}`, 20, yPos);
                                    } else {
                                        doc.text(log, 20, yPos);
                                    }
                                    yPos += 8;
                                });

                                doc.save(`${process.env.REPORT_DIR}/pdf/report_${process.env.TIMESTAMP}.pdf`);

                            } catch (err) {
                                console.error('Error generating PDF report:', err);
                                process.exit(1);
                            }
                        '''

                        sh 'node createReport.js'

                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
            post {
                always {
                    sh 'rm -f createReport.js'
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: """
                ${REPORT_DIR}/html/**/*,
                ${REPORT_DIR}/pdf/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*
            """, allowEmptyArchive: true

            junit testResults: "${REPORT_DIR}/junit/results-*.xml", allowEmptyResults: true
        }
        success {
            echo """
                ╔══════════════════════════════════╗
                ║         Test Execution           ║
                ╚══════════════════════════════════╝
                
                ✅ Status: SUCCESS
                ⏱️ Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                
                📊 Reports:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
            """
        }
        failure {
            echo """
                ╔══════════════════════════════════╗
                ║         Test Execution           ║
                ╚══════════════════════════════════╝
                
                ❌ Status: FAILED
                ⏱️ Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                
                📊 Reports:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
            """
        }
        cleanup {
            cleanWs()
        }
    }
}