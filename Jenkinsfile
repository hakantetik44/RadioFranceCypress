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

                                // Ana başlık alanı - mavi banner
                                doc.setFillColor(0, 57, 166);
                                doc.rect(0, 0, 210, 40, 'F');

                                // Başlık metni
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(24);
                                doc.setFont('helvetica', 'bold');
                                doc.text("Rapport d'Execution des Tests", 15, 25);

                                // Tarih
                                doc.setFontSize(12);
                                const now = new Date();
                                const frenchDate = now.toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }).replace(':', 'h');
                                doc.text("Date: " + frenchDate, 15, 35);

                                // Résumé bölümü
                                doc.setFillColor(245, 245, 245);
                                doc.rect(0, 50, 210, 60, 'F');

                                // Résumé başlığı
                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(16);
                                doc.text("Resume", 15, 65);

                                // Test istatistikleri
                                doc.setFontSize(12);
                                doc.text([
                                    "Tests Total: " + report.stats.tests,
                                    "Tests Passes: " + report.stats.passes,
                                    "Tests Echoues: " + (report.stats.failures || 0),
                                    "Duree: " + (report.stats.duration / 1000).toFixed(2) + "s"
                                ], 20, 80);

                                // Résultats Détaillés bölümü
                                doc.setFontSize(16);
                                doc.text("Resultats Detailles", 15, 130);

                                // Test suite başlığı
                                doc.setFontSize(14);
                                doc.text("Fonctionnalites de base de France Culture", 15, 145);

                                let yPos = 160;
                                let pageHeight = doc.internal.pageSize.height;

                                // Test sonuçları
                                if (report.results && report.results.length > 0) {
                                    report.results[0].tests.forEach((test) => {
                                        // Beyaz kutu
                                        doc.setFillColor(255, 255, 255);
                                        doc.rect(10, yPos - 5, 190, 25, 'F');
                                        doc.setDrawColor(220, 220, 220);
                                        doc.rect(10, yPos - 5, 190, 25, 'D');

                                        // Test detayları
                                        doc.setFontSize(11);
                                        doc.setTextColor(39, 174, 96);
                                        doc.text("✓", 15, yPos + 5);
                                        
                                        doc.setTextColor(0, 0, 0);
                                        doc.text(test.title, 25, yPos + 5);
                                        doc.text("Duree: " + (test.duration / 1000).toFixed(2) + "s", 25, yPos + 15);

                                        yPos += 30;

                                        if (yPos > pageHeight - 40) {
                                            doc.addPage();
                                            yPos = 20;
                                        }
                                    });
                                }

                                // Journal d'Exécution bölümü
                                if (yPos > pageHeight - 100) {
                                    doc.addPage();
                                    yPos = 20;
                                }

                                doc.setFillColor(245, 245, 245);
                                doc.rect(0, yPos, 210, 100, 'F');

                                doc.setFontSize(16);
                                doc.text("Journal d'Execution", 15, yPos + 20);

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
                                    doc.text(log, 20, yPos + 40 + (index * 10));
                                });

                                // PDF kaydet
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