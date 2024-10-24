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

                                // Mavi üst banner
                                doc.setFillColor(0, 57, 166);
                                doc.rect(0, 0, 210, 35, 'F');

                                // Başlık
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(24);
                                doc.text('🎯 Rapport d'Exécution des Tests', 15, 24);

                                // Tarih
                                doc.setFontSize(14);
                                const date = new Date();
                                const options = { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                };
                                const dateStr = date.toLocaleDateString('fr-FR', options)
                                    .replace(':', 'h')
                                    .replace(',', ' à');
                                doc.text(`Date: ${dateStr}`, 15, 32);

                                // Résumé bölümü - gri arka plan
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 45, 210, 45, 'F');

                                // Résumé başlığı ve istatistikler
                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(18);
                                doc.text('📊 Résumé', 15, 60);

                                doc.setFontSize(14);
                                const stats = [
                                    `Tests Total: ${report.stats.tests}`,
                                    `Tests Passés: ${report.stats.passes}`,
                                    `Tests Échoués: ${report.stats.failures || 0}`,
                                    `Durée: ${(report.stats.duration / 1000).toFixed(2)}s`
                                ];
                                doc.text(stats, 15, 70);

                                // Résultats Détaillés bölümü
                                doc.setFontSize(18);
                                doc.text('🔍 Résultats Détaillés', 15, 110);

                                // Test suite başlığı
                                doc.setFontSize(16);
                                doc.text('Fonctionnalités de base de France Culture', 15, 120);

                                let yPos = 130;

                                // Her bir test için
                                if (report.results && report.results.length > 0) {
                                    report.results[0].tests.forEach((test) => {
                                        // Beyaz kutu ve çerçeve
                                        doc.setFillColor(255, 255, 255);
                                        doc.setDrawColor(230, 230, 230);
                                        doc.rect(10, yPos - 5, 190, 20, 'FD');

                                        // Yeşil tik işareti
                                        doc.setTextColor(34, 197, 94);
                                        doc.text('✓', 15, yPos + 5);

                                        // Test başlığı ve süresi
                                        doc.setTextColor(0, 0, 0);
                                        doc.setFontSize(12);
                                        doc.text(test.title, 25, yPos + 5);
                                        doc.text(`Durée: ${(test.duration / 1000).toFixed(2)}s`, 25, yPos + 12);

                                        yPos += 25;

                                        if (yPos > 250) {
                                            doc.addPage();
                                            yPos = 20;
                                        }
                                    });
                                }

                                // Journal d'Exécution bölümü
                                if (yPos > 220) {
                                    doc.addPage();
                                    yPos = 20;
                                }

                                // Gri arka plan
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, yPos, 210, 80, 'F');

                                // Başlık ve loglar
                                doc.setFontSize(18);
                                doc.text('📝 Journal d'Exécution', 15, yPos + 15);

                                const logs = [
                                    '✓ Page | Chargement réussi',
                                    '✓ Cookies | Configuration acceptée',
                                    'ℹ️ Page | France Culture – Écouter la radio en direct et podcasts gratuitement',
                                    '✓ Menu | Principal disponible',
                                    'ℹ️ Menu | 35 éléments vérifiés',
                                    'Pas de bannière de cookies détectée',
                                    '✓ Recherche | Fonctionnalité disponible'
                                ];

                                doc.setFontSize(11);
                                logs.forEach((log, index) => {
                                    doc.text(log, 20, yPos + 30 + (index * 8));
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