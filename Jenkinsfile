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

                    touch "${TEST_HISTORY_DIR}/history.csv"
                    if [ ! -s "${TEST_HISTORY_DIR}/history.csv" ]; then
                        echo "BuildNumber,Timestamp,TotalTests,PassedTests,Duration" > "${TEST_HISTORY_DIR}/history.csv"
                    fi
                '''
            }
        }

        stage('Installation') {
            steps {
                script {
                    echo "📦 Installing dependencies..."
                }

                sh '''
                    npm cache clean --force
                    npm ci
                    npm install --save-dev cypress-multi-reporters mocha-junit-reporter mochawesome mochawesome-merge mochawesome-report-generator jspdf
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

        // Başlık
        doc.setFontSize(24);
        doc.text("# Rapport d'Exécution des Tests", 20, 20);

        // Tarih
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).replace(':', 'h');

        doc.setFontSize(14);
        doc.text(dateStr, 20, 30);

        // Résumé
        doc.setFontSize(18);
        doc.text("## Résumé", 20, 50);
        doc.setFontSize(12);
        doc.text([
            "- Tests Total: " + report.stats.tests,
            "- Tests Passés: " + report.stats.passes,
            "- Tests Échoués: " + (report.stats.failures || 0),
            "- Durée: " + (report.stats.duration / 1000).toFixed(2) + "s"
        ], 20, 65);

        // Résultats Détaillés
        doc.setFontSize(18);
        doc.text("## Résultats Détaillés", 20, 95);
        doc.text("### Fonctionnalités de base de France Culture", 20, 105);

        let yPos = 120;

        if (report.results && report.results.length > 0) {
            report.results[0].tests.forEach(test => {
                doc.setFontSize(14);
                doc.text("#### " + test.title, 20, yPos);
                yPos += 10;

                doc.setFontSize(12);
                doc.text([
                    "- Status: " + (test.state === 'passed' ? '✅ Passé' : '❌ Échoué'),
                    "- Durée: " + (test.duration / 1000).toFixed(2) + "s"
                ], 20, yPos);
                yPos += 20;

                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
            });
        }

        // Journal d'Exécution
        doc.addPage();
        doc.setFontSize(18);
        doc.text("## Journal d'Exécution", 20, 20);
        yPos = 40;

        // Logları test sonuçlarından al
        const logs = [];
        report.results[0].tests.forEach(test => {
            if (test.context) {
                try {
                    const testContext = JSON.parse(test.context);
                    if (testContext.CYPRESS_LOG) {
                        logs.push(...testContext.CYPRESS_LOG.split('\\n'));
                    }
                } catch(e) {}
            }
        });

        // Unique logları filtrele ve sırala
        const uniqueLogs = [...new Set(logs)];
        uniqueLogs.forEach(log => {
            if (log.startsWith('SUCCESS') || log.includes('✅')) {
                doc.setTextColor(0, 150, 0);
                doc.text("✅ " + log.replace('SUCCESS', '').trim(), 20, yPos);
            } else if (log.startsWith('INFO') || log.includes('ℹ️')) {
                doc.setTextColor(0, 100, 200);
                doc.text("ℹ️ " + log.replace('INFO', '').trim(), 20, yPos);
            } else {
                doc.setTextColor(0, 0, 0);
                doc.text(log, 20, yPos);
            }
            yPos += 8;

            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
        });

        doc.save(`${process.env.REPORT_DIR}/pdf/report_${process.env.TIMESTAMP}.pdf`);

    } catch (err) {
        console.error('Error generating PDF report:', err);
        process.exit(1);
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
                            export LANG=en_US.UTF-8
                            export LC_ALL=en_US.UTF-8
                            
                            VERIFY_TIMEOUT=120000 npx cypress verify
                            
                            CYPRESS_VERIFY_TIMEOUT=120000 \\
                            npx cypress run \\
                                --browser electron \\
                                --headless \\
                                --config video=true \\
                                --reporter cypress-multi-reporters \\
                                --reporter-options configFile=reporter-config.json

                            # Generate reports
                            npx mochawesome-merge "${REPORT_DIR}/json/*.json" > "${REPORT_DIR}/mochawesome.json"
                            npx marge \\
                                "${REPORT_DIR}/mochawesome.json" \\
                                --reportDir "${REPORT_DIR}/html" \\
                                --inline \\
                                --charts \\
                                --title "France Culture Test Results"

                            # Generate PDF report
                            node createReport.js
                        '''
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
            archiveArtifacts artifacts: '''
                cypress/reports/html/**/*,
                cypress/reports/pdf/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*
            ''', allowEmptyArchive: true

            junit allowEmptyResults: true, testResults: 'cypress/reports/junit/*.xml'
        }
        success {
            echo """
                ✅ Test Summary:
                - Status: SUCCESS
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Report PDF: cypress/reports/pdf/report_${TIMESTAMP}.pdf
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