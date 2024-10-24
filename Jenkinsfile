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

                        // Generate Professional PDF Report
                        writeFile file: 'createReport.js', text: '''
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('cypress/reports/mochawesome.json', 'utf8'));
                                const doc = new jsPDF();

                                // Başlık bölümü - Koyu mavi arka plan
                                doc.setFillColor(25, 59, 150);  // Koyu mavi
                                doc.rect(0, 0, 220, 45, 'F');

                                // Logo ve başlık metni - beyaz renk
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(28);
                                doc.text('Rapport de Tests', 20, 30);

                                // Alt başlık - siyah renk
                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(20);
                                doc.text('France Culture - Suite de Tests', 20, 65);

                                // Build bilgileri kutusu - açık gri arka plan
                                doc.setFillColor(242, 242, 242);
                                doc.rect(15, 80, 180, 45, 'F');

                                doc.setFontSize(12);
                                doc.text('Informations de Build:', 20, 95);

                                // Build detayları
                                const timeStr = process.env.TIMESTAMP.replace(/_/g, ' ').replace(/-/g, '/');
                                doc.setFontSize(11);
                                doc.text([
                                    `Date d'exécution: ${timeStr}`,
                                    `Message de Commit: ${process.env.GIT_COMMIT_MSG}`,
                                    `Auteur: ${process.env.GIT_AUTHOR}`
                                ], 25, 110);

                                // Test özeti kutuları
                                doc.addPage();
                                
                                // Sayfa başlığı
                                doc.setFillColor(25, 59, 150);
                                doc.rect(0, 0, 220, 25, 'F');
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(18);
                                doc.text('Résumé', 20, 17);

                                // Test özet kutuları için fonksiyon
                                const createBox = (x, y, width, height, title, value, color) => {
                                    doc.setFillColor(...color);
                                    doc.rect(x, y, width, height, 'F');
                                    doc.setTextColor(255, 255, 255);
                                    doc.setFontSize(14);
                                    doc.text(title, x + 10, y + 20);
                                    doc.setFontSize(20);
                                    doc.text(value.toString(), x + 10, y + 45);
                                };

                                // Özet kutuları
                                const boxWidth = 85;
                                const boxHeight = 60;
                                const startY = 40;

                                createBox(20, startY, boxWidth, boxHeight, 'Tests Total', report.stats.tests, [25, 59, 150]);  // Mavi
                                createBox(115, startY, boxWidth, boxHeight, 'Tests Passés', report.stats.passes, [46, 165, 74]);  // Yeşil
                                createBox(20, startY + 70, boxWidth, boxHeight, 'Tests Échoués', report.stats.failures || 0, [220, 53, 69]);  // Kırmızı
                                createBox(115, startY + 70, boxWidth, boxHeight, 'Durée', `${Math.round(report.stats.duration/1000)}s`, [75, 75, 75]);  // Gri

                                // Sonuçlar sayfası
                                doc.addPage();
                                
                                // Sonuçlar başlığı
                                doc.setFillColor(25, 59, 150);
                                doc.rect(0, 0, 220, 25, 'F');
                                doc.setTextColor(255, 255, 255);
                                doc.text('Résultats Détaillés', 20, 17);

                                // Test detayları
                                let yPos = 40;
                                doc.setTextColor(0, 0, 0);

                                if (report.results && report.results.length > 0) {
                                    report.results.forEach((suite) => {
                                        // Test suite başlığı
                                        doc.setFontSize(14);
                                        doc.text(suite.title || 'Test Suite', 20, yPos);
                                        yPos += 10;

                                        if (suite.tests) {
                                            suite.tests.forEach((test) => {
                                                const icon = test.pass ? '✓' : '✕';
                                                const textColor = test.pass ? [46, 165, 74] : [220, 53, 69];

                                                doc.setTextColor(...textColor);
                                                doc.setFontSize(12);
                                                doc.text(icon, 25, yPos);

                                                doc.setTextColor(0, 0, 0);
                                                doc.text(test.title, 35, yPos);
                                                doc.text(`${test.duration}ms`, 160, yPos);

                                                yPos += 8;

                                                if (yPos > 270) {
                                                    doc.addPage();
                                                    yPos = 20;
                                                }
                                            });
                                        }
                                        yPos += 10;
                                    });
                                }

                                // PDF'i kaydet
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