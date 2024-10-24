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

                        // Generate Enhanced PDF Report
                        writeFile file: 'createReport.js', text: '''
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('cypress/reports/mochawesome.json', 'utf8'));
                                const doc = new jsPDF();

                                // Add custom font for French characters
                                doc.addFont('Helvetica');
                                
                                // Title Page
                                doc.setFillColor(0, 51, 153);  // Dark blue background
                                doc.rect(0, 0, 220, 40, 'F');
                                
                                doc.setTextColor(255, 255, 255);  // White text
                                doc.setFontSize(28);
                                doc.setFont('Helvetica', 'bold');
                                doc.text('Rapport de Tests', 20, 30);
                                
                                // Subtitle
                                doc.setTextColor(0, 0, 0);  // Black text
                                doc.setFontSize(20);
                                doc.setFont('Helvetica', 'normal');
                                doc.text('France Culture - Suite de Tests', 20, 60);

                                // Build Information Section
                                doc.setFillColor(240, 240, 240);  // Light gray background
                                doc.rect(15, 70, 180, 40, 'F');
                                
                                doc.setFontSize(12);
                                doc.setFont('Helvetica', 'bold');
                                doc.text('Informations de Build:', 20, 80);
                                
                                doc.setFont('Helvetica', 'normal');
                                const buildInfo = [
                                    `Date d'exécution: ${process.env.TIMESTAMP}`,
                                    `Message de Commit: ${process.env.GIT_COMMIT_MSG}`,
                                    `Auteur: ${process.env.GIT_AUTHOR}`
                                ];
                                doc.text(buildInfo, 25, 90);

                                // Test Summary Section
                                doc.addPage();
                                
                                // Summary Header
                                doc.setFillColor(0, 51, 153);
                                doc.rect(0, 0, 220, 20, 'F');
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(18);
                                doc.setFont('Helvetica', 'bold');
                                doc.text('Résumé des Tests', 20, 15);

                                // Create status boxes
                                const createStatusBox = (x, y, width, height, label, value, color) => {
                                    doc.setFillColor(...color);
                                    doc.roundedRect(x, y, width, height, 3, 3, 'F');
                                    doc.setTextColor(255, 255, 255);
                                    doc.setFontSize(12);
                                    doc.setFont('Helvetica', 'bold');
                                    doc.text(label, x + 5, y + 15);
                                    doc.setFontSize(20);
                                    doc.text(value.toString(), x + 5, y + 35);
                                };

                                // Status boxes with metrics
                                createStatusBox(20, 30, 80, 50, 'Tests Totaux', report.stats.tests, [0, 102, 204]);
                                createStatusBox(110, 30, 80, 50, 'Tests Réussis', report.stats.passes, [46, 184, 46]);
                                createStatusBox(20, 90, 80, 50, 'Tests Échoués', report.stats.failures, [220, 53, 69]);
                                createStatusBox(110, 90, 80, 50, 'Durée (s)', Math.round(report.stats.duration/1000), [102, 102, 102]);

                                // Detailed Results Section
                                if (report.results && report.results.length > 0) {
                                    doc.addPage();
                                    
                                    // Results Header
                                    doc.setFillColor(0, 51, 153);
                                    doc.rect(0, 0, 220, 20, 'F');
                                    doc.setTextColor(255, 255, 255);
                                    doc.setFontSize(18);
                                    doc.text('Résultats Détaillés', 20, 15);

                                    let yPos = 40;
                                    report.results.forEach((suite) => {
                                        doc.setTextColor(0, 0, 0);
                                        doc.setFontSize(14);
                                        doc.setFont('Helvetica', 'bold');
                                        doc.text(suite.title, 20, yPos);
                                        yPos += 10;

                                        if (suite.tests) {
                                            suite.tests.forEach((test) => {
                                                const status = test.pass ? '✓' : '✕';
                                                const statusColor = test.pass ? [46, 184, 46] : [220, 53, 69];
                                                
                                                doc.setTextColor(...statusColor);
                                                doc.setFontSize(12);
                                                doc.text(status, 25, yPos);
                                                
                                                doc.setTextColor(0, 0, 0);
                                                doc.setFont('Helvetica', 'normal');
                                                doc.text(test.title, 35, yPos);
                                                doc.text(`${test.duration}ms`, 160, yPos);
                                                
                                                yPos += 8;
                                                
                                                if (yPos > 270) {  // Page break if near bottom
                                                    doc.addPage();
                                                    yPos = 20;
                                                }
                                            });
                                        }
                                        yPos += 10;
                                    });
                                }

                                // Save the PDF
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