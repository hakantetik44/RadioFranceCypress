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
                        
                        🚀 Starting test execution...
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
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo """
                            ╔══════════════════════════════════╗
                            ║         Test Execution           ║
                            ╚══════════════════════════════════╝
                        """

                        sh '''
                            export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                            
                            echo "🚀 Starting Tests..."
                            
                            CYPRESS_VERIFY_TIMEOUT=120000 \
                            NO_COLOR=1 \
                            npx cypress run \
                                --browser electron \
                                --headless \
                                --config-file cypress.config.js \
                                --spec "cypress/e2e/RadioFrance.cy.js" \
                            | grep -v "DevTools" \
                            | grep -v "tput" \
                            | grep -v "=" \
                            | grep -v "Opening" \
                            | grep -v "\\[" \
                            | grep -v "Module" \
                            | grep -v "browser" \
                            | grep -v "npm" \
                            | grep -v "Node" \
                            | grep -v "Searching" \
                            | grep -v "^$" \
                            | grep -E "Running:|✓|CYPRESS_LOG:|Passing|Tests|Duration|Fonctionnalités"

                            TEST_STATUS=$?
                            
                            echo "📊 Generating Reports..."
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

                                // Başlık bölümü (Mavi)
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

                                // Resume Section
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

                                // Resultats Detailles Section
                                doc.setFontSize(18);
                                doc.text("Resultats Detailles", 15, 140);

                                doc.setFontSize(16);
                                doc.text("Fonctionnalites de base de France Culture", 15, 160);

                                // Test Results
                                let yPos = 180;
                                if (report.results && report.results.length > 0) {
                                    report.results[0].tests.forEach((test) => {
                                        doc.setFillColor(255, 255, 255);
                                        doc.rect(15, yPos - 5, 180, 25, 'F');
                                        doc.setDrawColor(220, 220, 220);
                                        doc.rect(15, yPos - 5, 180, 25, 'D');

                                        doc.setTextColor(46, 184, 46);
                                        doc.setFontSize(12);
                                        doc.text("✓", 20, yPos + 8);

                                        doc.setTextColor(0, 0, 0);
                                        doc.text(test.title, 35, yPos + 8);
                                        doc.text(`Durée: ${(test.duration / 1000).toFixed(2)}s`, 35, yPos + 18);

                                        yPos += 35;
                                        if (yPos > 250) {
                                            doc.addPage();
                                            yPos = 30;
                                        }
                                    });
                                }

                                // Save PDF
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
                
                📊 Reports Available:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
                - Videos: cypress/videos
            """
        }
        failure {
            echo """
                ╔══════════════════════════════════╗
                ║         Test Execution           ║
                ╚══════════════════════════════════╝
                
                ❌ Status: FAILED
                ⏱️ Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                
                📊 Reports Available:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
                - Videos: cypress/videos
            """
        }
        cleanup {
            cleanWs()
        }
    }
}