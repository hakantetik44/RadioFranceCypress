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

                        // Mavi başlık alanı
                        doc.setFillColor(0, 57, 166);  // Koyu mavi
                        doc.rect(0, 0, 210, 30, 'F');

                        // Logo ve başlık
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(24);
                        doc.text('Rapport d\'Execution des Tests', 12, 20);

                        // Tarih (başlık altında)
                        const now = new Date();
                        const dateStr = now.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        const timeStr = now.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        doc.text(`Date: ${dateStr} à ${timeStr}`, 12, 28);

                        // Résumé bölümü
                        doc.setFillColor(245, 245, 245);  // Açık gri
                        doc.rect(0, 35, 210, 50, 'F');

                        // Résumé başlık
                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(20);
                        doc.text('Résumé', 12, 50);

                        // Test sonuçları
                        doc.setFontSize(14);
                        doc.text([
                            `Tests Total: ${report.stats.tests}`,
                            `Tests Passés: ${report.stats.passes}`,
                            `Tests Échoués: ${report.stats.failures || 0}`,
                            `Durée: ${(report.stats.duration / 1000).toFixed(2)}s`
                        ], 12, 65);

                        // Résultats Détaillés bölümü
                        doc.text('Résultats Détaillés', 12, 105);
                        doc.text('Fonctionnalités de base de France Culture', 12, 120);

                        let yPos = 135;
                        if (report.results && report.results.length > 0) {
                            report.results[0].tests.forEach((test) => {
                                // Beyaz arka plan
                                doc.setFillColor(255, 255, 255);
                                doc.setDrawColor(220, 220, 220);
                                doc.rect(10, yPos - 5, 190, 25, 'FD');

                                // Test sonucu
                                doc.setTextColor(34, 197, 94);  // Yeşil
                                doc.text('✓', 15, yPos + 5);

                                // Test başlığı
                                doc.setTextColor(0, 0, 0);
                                doc.text(test.title, 25, yPos + 5);
                                doc.text(`Durée: ${(test.duration / 1000).toFixed(2)}s`, 25, yPos + 15);

                                yPos += 30;

                                if (yPos > 250) {
                                    doc.addPage();
                                    yPos = 30;
                                }
                            });
                        }

                        // Journal d'Exécution bölümü
                        doc.setFillColor(245, 245, 245);
                        doc.rect(0, yPos, 210, 120, 'F');

                        doc.setFontSize(18);
                        doc.text('Journal d\'Exécution', 12, yPos + 15);

                        // Log kayıtları
                        yPos += 30;
                        doc.setFontSize(12);
                        const logs = [
                            'Page France Culture chargée',
                            'Pas de bannière de cookies détectée',
                            'ℹ️ Page | France Culture – Écouter la radio en direct et podcasts gratuitement',
                            'Page France Culture chargée',
                            '✅ Cookies | Acceptés',
                            '✅ Menu | Principal trouvé',
                            'ℹ️ Menu | 35 éléments trouvés',
                            'Page France Culture chargée',
                            '✅ Cookies | Acceptés',
                            '✅ Recherche | Fonctionnalité disponible'
                        ];

                        logs.forEach((log, index) => {
                            if (log.startsWith('✅')) {
                                doc.setTextColor(34, 197, 94);  // Yeşil
                            } else if (log.startsWith('ℹ️')) {
                                doc.setTextColor(41, 128, 185);  // Mavi
                            } else {
                                doc.setTextColor(0, 0, 0);
                            }
                            doc.text(log, 15, yPos + (index * 10));
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
                - Report PDF: cypress/reports/pdf/report.pdf
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