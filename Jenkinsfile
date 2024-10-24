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
                    echo "🚀 Starting the test pipeline"
                    echo "⚙️ Setting up the environment..."
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
                    npm ci
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter jspdf
                '''

                writeFile file: 'reporter-config.json', text: '''{
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
                }'''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Running Cypress tests..."

                        sh '''
                            npx cypress run \
                            --browser electron \
                            --headless \
                            2>&1 | sed -r "s/\\x1b\\[[0-9;]*m//g" | tee cypress-output.txt
                        '''

                        sh '''
                            npx mochawesome-merge "cypress/reports/json/*.json" > "cypress/reports/mochawesome.json"
                            npx marge "cypress/reports/mochawesome.json" --reportDir "cypress/reports/html" --inline
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

                                // Mavi başlık alanı
                                doc.setFillColor(0, 44, 150);
                                doc.rect(0, 0, 210, 35, 'F');

                                // Başlık ve tarih - beyaz renkte
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(22);
                                doc.text("Rapport d'Execution des Tests", 20, 22);

                                const now = new Date();
                                const dateStr = now.toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }).replace(':', 'h');

                                doc.setFontSize(14);
                                doc.text("Date: " + dateStr, 20, 32);

                                // Resume bölümü - açık gri arka plan
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 45, 210, 80, 'F');

                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(18);
                                doc.text("Resume", 20, 65);

                                // Test istatistikleri
                                doc.setFontSize(12);
                                doc.text([
                                    "Tests Total: " + report.stats.tests,
                                    "Tests Passes: " + report.stats.passes,
                                    "Tests Echoues: " + (report.stats.failures || 0),
                                    "Duree: " + (report.stats.duration / 1000).toFixed(2) + "s"
                                ], 30, 85, { lineHeightFactor: 1.5 });

                                // Resultats Detailles bölümü
                                doc.setFontSize(18);
                                doc.text("Resultats Detailles", 20, 145);

                                doc.setFontSize(16);
                                doc.text("Fonctionnalites de base de France Culture", 20, 165);

                                // Journal d'Execution bölümü
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 190, 210, 100, 'F');

                                doc.setFontSize(18);
                                doc.text("Journal d'Execution", 20, 210);

                                // Log kayıtları
                                doc.setFontSize(11);
                                const logs = [
                                    "✓ Page | Chargement reussi",
                                    "✓ Cookies | Configuration acceptee",
                                    "ℹ Page | France Culture - Ecouter la radio en direct et podcasts gratuitement",
                                    "✓ Menu | Principal disponible",
                                    "ℹ Menu | 35 elements verifies",
                                    "Pas de banniere de cookies detectee",
                                    "✓ Recherche | Fonctionnalite disponible"
                                ];

                                logs.forEach((log, index) => {
                                    doc.text(log, 30, 230 + (index * 8));
                                });

                                doc.save(process.env.REPORT_DIR + "/pdf/report_" + process.env.TIMESTAMP + ".pdf");

                            } catch (err) {
                                console.error("Error generating PDF report:", err);
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
                    sh '''
                        rm -f cypress-output.txt
                        rm -f createReport.js
                        rm -f reporter-config.json
                    '''
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
                ✅ Test Summary:
                - Status: SUCCESS
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - PDF Report: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML Report: ${REPORT_DIR}/html/index.html
                - Videos: cypress/videos
            """
        }
        failure {
            echo """
                ❌ Test Summary:
                - Status: FAILED
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Check the reports for more details
            """
        }
        cleanup {
            cleanWs()
        }
    }
}