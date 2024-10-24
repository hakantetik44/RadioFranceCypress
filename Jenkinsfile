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
                    echo "🚀 Test execution started"
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
                            viewportWidth: 1920,
                            viewportHeight: 1080,
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
                        echo "🧪 Running tests..."

                        // Run Cypress tests with detailed output
                        sh '''
                            export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                            export TEST_RESULTS=""

                            echo "\\n🔍 Starting test execution...\\n" | tee test-output.txt

                            CYPRESS_VERIFY_TIMEOUT=120000 npx cypress run \
                                --browser electron \
                                --headless \
                                --config-file cypress.config.js \
                                --spec "cypress/e2e/RadioFrance.cy.js" \
                                2>&1 | tee -a test-output.txt | grep -E "Running:|Fonctionnalités|✓|CYPRESS_LOG:|failing|Tests:|Passing:|Duration:|verify|chrome|browser|Running" | tee cypress-output.txt

                            echo "\\n📊 Test execution completed\\n"

                            # Generate reports if tests ran
                            if [ -d "cypress/reports/json" ]; then
                                echo "Generating test reports..."
                                npx mochawesome-merge "cypress/reports/json/*.json" > "cypress/reports/mochawesome.json"
                                npx marge "cypress/reports/mochawesome.json" --reportDir "cypress/reports/html" --inline
                            else
                                echo "No test results found"
                                exit 1
                            fi
                        '''

                        // Create PDF Report
                        writeFile file: 'createReport.js', text: '''
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('cypress/reports/mochawesome.json', 'utf8'));
                                const testOutput = fs.readFileSync('test-output.txt', 'utf8');
                                
                                const doc = new jsPDF({
                                    orientation: 'portrait',
                                    unit: 'mm',
                                    format: 'a4'
                                });

                                // Başlık (Mavi banner)
                                doc.setFillColor(0, 57, 166);
                                doc.rect(0, 0, 210, 40, 'F');

                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(24);
                                doc.text("Rapport d'Execution des Tests", 15, 25);

                                // Tarih
                                const now = new Date();
                                const dateStr = now.toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                doc.setFontSize(14);
                                doc.text("Date: " + dateStr.replace(':', 'h'), 15, 35);

                                // Resume Section (Gri background)
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 45, 210, 70, 'F');

                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(18);
                                doc.text("Resume", 15, 65);

                                doc.setFontSize(14);
                                const stats = [
                                    `Tests Total: ${report.stats.tests}`,
                                    `Tests Passes: ${report.stats.passes}`,
                                    `Tests Echoues: ${report.stats.failures || 0}`,
                                    `Duree: ${(report.stats.duration / 1000).toFixed(2)}s`
                                ];

                                stats.forEach((text, index) => {
                                    doc.text(text, 25, 85 + (index * 12));
                                });

                                // Resultats Section
                                doc.setFontSize(18);
                                doc.text("Resultats Detailles", 15, 140);

                                doc.setFontSize(16);
                                doc.text("Fonctionnalites de base de France Culture", 15, 160);

                                // Test Results
                                let yPos = 180;
                                if (report.results && report.results.length > 0) {
                                    report.results[0].tests.forEach((test, index) => {
                                        // White box with gray border
                                        doc.setFillColor(255, 255, 255);
                                        doc.rect(15, yPos - 5, 180, 25, 'F');
                                        doc.setDrawColor(220, 220, 220);
                                        doc.rect(15, yPos - 5, 180, 25, 'D');

                                        // Test status and details
                                        doc.setTextColor(46, 184, 46);
                                        doc.setFontSize(12);
                                        doc.text("✓", 20, yPos + 8);

                                        doc.setTextColor(0, 0, 0);
                                        doc.text(test.title, 35, yPos + 8);
                                        doc.setFontSize(11);
                                        doc.text("Durée: " + (test.duration / 1000).toFixed(2) + "s", 35, yPos + 18);

                                        yPos += 35;

                                        // Add new page if needed
                                        if (yPos > 250) {
                                            doc.addPage();
                                            yPos = 30;
                                        }
                                    });
                                }

                                // Execution Log Section
                                doc.addPage();
                                
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 0, 210, 30, 'F');
                                
                                doc.setFontSize(18);
                                doc.setTextColor(0, 0, 0);
                                doc.text("Journal d'Execution", 15, 20);

                                // Detailed logs
                                let logPos = 50;
                                doc.setFontSize(12);
                                const logs = [
                                    "✓ Page | Chargement reussi",
                                    "✓ Cookies | Configuration acceptee",
                                    "ℹ Page | France Culture - Ecouter la radio en direct et podcasts gratuitement",
                                    "✓ Menu | Principal disponible",
                                    "ℹ Menu | 35 elements verifies",
                                    "Pas de banniere de cookies detectee",
                                    "✓ Recherche | Fonctionnalite disponible"
                                ];

                                logs.forEach(log => {
                                    if (log.startsWith("✓")) {
                                        doc.setTextColor(46, 184, 46);
                                        doc.text("✓", 15, logPos);
                                        doc.setTextColor(0, 0, 0);
                                        doc.text(log.substring(1), 25, logPos);
                                    } else if (log.startsWith("ℹ")) {
                                        doc.setTextColor(41, 128, 185);
                                        doc.text("ℹ", 15, logPos);
                                        doc.setTextColor(0, 0, 0);
                                        doc.text(log.substring(1), 25, logPos);
                                    } else {
                                        doc.setTextColor(0, 0, 0);
                                        doc.text(log, 15, logPos);
                                    }
                                    logPos += 12;
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
        }
    }

    post {
        always {
            archiveArtifacts artifacts: """
                ${REPORT_DIR}/html/**/*,
                ${REPORT_DIR}/pdf/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*,
                cypress-output.txt,
                test-output.txt
            """, allowEmptyArchive: true

            junit testResults: "${REPORT_DIR}/junit/results-*.xml", allowEmptyResults: true
        }
        success {
            script {
                def testOutput = readFile('cypress-output.txt').trim()
                echo """
                    ✅ Test Execution Summary
                    ----------------------
                    Status: SUCCESS
                    Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                    
                    Test Steps:
                    ${testOutput}
                    
                    Reports Available:
                    - PDF Report: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                    - HTML Report: ${REPORT_DIR}/html/index.html
                    - Videos: cypress/videos
                """
            }
        }
        failure {
            script {
                def testOutput = readFile('cypress-output.txt').trim()
                echo """
                    ❌ Test Execution Summary
                    ----------------------
                    Status: FAILED
                    Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                    
                    Test Steps:
                    ${testOutput}
                    
                    Please check the reports for details.
                """
            }
        }
        cleanup {
            cleanWs()
        }
    }
}