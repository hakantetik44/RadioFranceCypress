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
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Running Cypress tests..."

                        // Run Cypress tests with mochawesome reporter
                        sh '''
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter mochawesome \
                            --reporter-options reportDir=${REPORT_DIR}/json,overwrite=false,html=false,json=true \
                            2>&1 | sed -r "s/\\x1b\\[[0-9;]*m//g" | tee cypress-output.txt
                        '''

                        // Merge mochawesome reports
                        sh """
                            npx mochawesome-merge "${REPORT_DIR}/json/*.json" > "${REPORT_DIR}/mochawesome.json"
                            npx marge "${REPORT_DIR}/mochawesome.json" --reportDir "${REPORT_DIR}/html" --inline
                        """

                        // Generate PDF report
                        writeFile file: 'createReport.js', text: """
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('${REPORT_DIR}/mochawesome.json', 'utf8'));
                                const testOutput = fs.readFileSync('cypress-output.txt', 'utf8');
                                const doc = new jsPDF();

                                // Title page
                                doc.setFontSize(28);
                                doc.setTextColor(44, 62, 80);
                                doc.text('Test Report', 20, 30);
                                doc.setFontSize(20);
                                doc.text('France Culture Test Suite', 20, 45);

                                // Info box
                                doc.setDrawColor(52, 152, 219);
                                doc.setFillColor(240, 248, 255);
                                doc.roundedRect(20, 60, 170, 50, 3, 3, 'FD');
                                doc.setFontSize(12);
                                doc.setTextColor(0, 0, 0);
                                const buildInfo = [
                                    'Date: ${TIMESTAMP}',
                                    'Commit: ${GIT_COMMIT_MSG}',
                                    'Author: ${GIT_AUTHOR}'
                                ];
                                doc.text(buildInfo, 25, 70);

                                // Test Summary
                                doc.setFontSize(20);
                                doc.setTextColor(41, 128, 185);
                                doc.text('Test Summary', 20, 130);

                                function drawStatBox(text, value, x, y, color) {
                                    doc.setDrawColor(color[0], color[1], color[2]);
                                    doc.setFillColor(255, 255, 255);
                                    doc.roundedRect(x, y, 80, 30, 3, 3, 'FD');
                                    doc.setTextColor(color[0], color[1], color[2]);
                                    doc.text(text, x + 5, y + 12);
                                    doc.setFontSize(16);
                                    doc.text(value.toString(), x + 5, y + 25);
                                    doc.setFontSize(14);
                                }

                                drawStatBox('Total Tests', report.stats.tests, 20, 140, [52, 73, 94]);
                                drawStatBox('Passed', report.stats.passes, 110, 140, [46, 204, 113]);
                                drawStatBox('Failed', report.stats.failures, 20, 180, [231, 76, 60]);
                                drawStatBox('Duration', Math.round(report.stats.duration/1000) + 's', 110, 180, [52, 152, 219]);

                                // Test Details
                                doc.addPage();
                                doc.setFontSize(20);
                                doc.setTextColor(41, 128, 185);
                                doc.text('Test Details', 20, 20);

                                let yPos = 40;
                                report.results.forEach(suite => {
                                    suite.suites.forEach(subSuite => {
                                        subSuite.tests.forEach(test => {
                                            if (yPos > 250) {
                                                doc.addPage();
                                                yPos = 20;
                                            }

                                            const isPassed = test.state === 'passed';
                                            const icon = isPassed ? '✓' : '✗';
                                            const color = isPassed ? [46, 204, 113] : [231, 76, 60];
                                            
                                            doc.setTextColor(...color);
                                            doc.text(icon, 20, yPos);

                                            doc.setTextColor(0, 0, 0);
                                            doc.setFontSize(12);
                                            doc.text(test.title, 35, yPos);
                                            doc.text((test.duration/1000).toFixed(2) + 's', 160, yPos);

                                            if (!isPassed && test.err) {
                                                yPos += 7;
                                                doc.setFontSize(10);
                                                doc.setTextColor(231, 76, 60);
                                                const errorLines = doc.splitTextToSize(test.err.message, 150);
                                                errorLines.forEach(line => {
                                                    doc.text(line, 35, yPos);
                                                    yPos += 5;
                                                });
                                            }

                                            yPos += 10;
                                        });
                                    });
                                });

                                doc.save('${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf');
                            } catch (err) {
                                console.error(err);
                                process.exit(1);
                            }
                        """

                        // Generate reports
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

            junit "${REPORT_DIR}/junit/*.xml"
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