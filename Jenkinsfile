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

                        // Generate Simple PDF Report
                        writeFile file: 'createReport.js', text: '''
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('cypress/reports/mochawesome.json', 'utf8'));
                                const doc = new jsPDF();

                                // Header - Blue background
                                doc.setFillColor(18, 60, 150);
                                doc.rect(0, 0, 220, 40, 'F');

                                // Title - White text
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(24);
                                doc.text('Rapport de Tests', 20, 28);

                                // Subtitle - Black text
                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(18);
                                doc.text('France Culture - Suite de Tests', 20, 55);

                                // Build Information Box - Light gray background
                                doc.setFillColor(245, 245, 245);
                                doc.rect(15, 70, 180, 50, 'F');

                                // Build Information - Black text
                                doc.setFontSize(12);
                                doc.text('Informations de Build:', 20, 85);
                                
                                const timestamp = process.env.TIMESTAMP.replace(/_/g, ' ').replace(/-/g, '/');
                                doc.text([
                                    `Date d'exécution: ${timestamp}`,
                                    `Message de Commit: ${process.env.GIT_COMMIT_MSG}`,
                                    `Auteur: ${process.env.GIT_AUTHOR}`
                                ], 20, 100);

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