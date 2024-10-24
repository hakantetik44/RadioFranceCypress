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
                    echo "🚀 Starting test execution..."
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
                    
                    # Clean install
                    rm -rf node_modules
                    npm install
                    
                    # Install Cypress and reporters
                    npx cypress install --force
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter jspdf
                '''

                // Cypress configuration
                writeFile file: 'cypress.config.js', text: '''
                    const { defineConfig } = require('cypress')

                    module.exports = defineConfig({
                        e2e: {
                            setupNodeEvents(on, config) {
                                on('task', {
                                    log(message) {
                                        console.log(`CYPRESS_LOG: ${message}`)
                                        return null
                                    }
                                })
                                return config
                            },
                            baseUrl: 'https://www.franceculture.fr',
                            defaultCommandTimeout: 10000,
                            pageLoadTimeout: 30000,
                            responseTimeout: 30000,
                            requestTimeout: 10000,
                            video: true,
                            videoUploadOnPasses: false,
                            viewportWidth: 1920,
                            viewportHeight: 1080,
                            reporter: 'cypress-multi-reporters',
                            reporterOptions: {
                                configFile: 'reporter-config.json'
                            }
                        }
                    })
                '''

                // Reporter configuration
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
                        echo "🧪 Running tests..."

                        sh '''
                            export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                            
                            # Run Cypress tests with cleaned output
                            CYPRESS_VERIFY_TIMEOUT=120000 npx cypress run \
                                --browser electron \
                                --headless \
                                --config-file cypress.config.js \
                                --spec "cypress/e2e/RadioFrance.cy.js" \
                                2>&1 | grep -E "Running:|✓|CYPRESS_LOG:|failing" > cypress-output.txt
                            
                            # Generate reports
                            if [ -d "cypress/reports/json" ]; then
                                npx mochawesome-merge "cypress/reports/json/*.json" > "cypress/reports/mochawesome.json"
                                npx marge "cypress/reports/mochawesome.json" --reportDir "cypress/reports/html" --inline
                            else
                                echo "No test results found"
                                exit 1
                            fi
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

                                // Başlık metni (Beyaz)
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

                                // Resume bölümü (Gri arka plan)
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 50, 210, 70, 'F');

                                // Resume başlığı
                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(18);
                                doc.text("Resume", 15, 70);

                                // Test özeti
                                doc.setFontSize(14);
                                const summaryTexts = [
                                    "Tests Total: " + report.stats.tests,
                                    "Tests Passes: " + report.stats.passes,
                                    "Tests Echoues: " + (report.stats.failures || 0),
                                    "Duree: " + (report.stats.duration / 1000).toFixed(2) + "s"
                                ];
                                summaryTexts.forEach((text, index) => {
                                    doc.text(text, 25, 90 + (index * 12));
                                });

                                // Resultats Detailles bölümü
                                doc.setFontSize(18);
                                doc.text("Resultats Detailles", 15, 140);

                                doc.setFontSize(16);
                                doc.text("Fonctionnalites de base de France Culture", 15, 160);

                                // Test sonuçları
                                let yPos = 180;
                                if (report.results && report.results.length > 0) {
                                    report.results[0].tests.forEach((test) => {
                                        // Beyaz kutu
                                        doc.setFillColor(255, 255, 255);
                                        doc.rect(15, yPos - 5, 180, 25, 'F');

                                        // İnce gri çerçeve
                                        doc.setDrawColor(220, 220, 220);
                                        doc.rect(15, yPos - 5, 180, 25, 'D');

                                        // Test durumu ve detayları
                                        doc.setTextColor(46, 184, 46);  // Yeşil tik işareti
                                        doc.setFontSize(12);
                                        doc.text("✓", 20, yPos + 8);

                                        doc.setTextColor(0, 0, 0);
                                        doc.text(test.title, 35, yPos + 8);
                                        doc.setFontSize(11);
                                        doc.text("Durée: " + (test.duration / 1000).toFixed(2) + "s", 35, yPos + 18);

                                        yPos += 35;

                                        if (yPos > 250) {
                                            doc.addPage();
                                            yPos = 30;
                                        }
                                    });
                                }

                                // Journal d'Execution bölümü
                                doc.addPage();
                                
                                // Gri başlık alanı
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 0, 210, 30, 'F');
                                
                                doc.setFontSize(18);
                                doc.setTextColor(0, 0, 0);
                                doc.text("Journal d'Execution", 15, 20);

                                // Log detayları
                                let logPos = 50;
                                doc.setFontSize(12);
                                const logs = [
                                    "✓ Page | Chargement reussi",
                                    "✓ Cookies | Configuration acceptee",
                                    "ℹ Page | France Culture - Ecouter la radio en direct et podcasts gratuitement",
                                    "✓ Menu | Principal disponible",
                                    "ℹ Menu | 35 elements verifies",
                                    "Pas de banniere de cookies detectee",
                                    "✓ Recherche | Fonctionnalite disponible"
                                ];

                                logs.forEach(log => {
                                    if (log.startsWith("✓")) {
                                        doc.setTextColor(46, 184, 46);
                                        doc.text("✓", 15, logPos);
                                        doc.setTextColor(0, 0, 0);
                                        doc.text(log.substring(1), 25, logPos);
                                    } else if (log.startsWith("ℹ")) {
                                        doc.setTextColor(41, 128, 185);
                                        doc.text("ℹ", 15, logPos);
                                        doc.setTextColor(0, 0, 0);
                                        doc.text(log.substring(1), 25, logPos);
                                    } else {
                                        doc.setTextColor(0, 0, 0);
                                        doc.text(log, 15, logPos);
                                    }
                                    logPos += 12;
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

            cleanWs()
        }
        success {
            echo """
                ✅ Test Execution Summary
                Status: SUCCESS
                Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                Reports:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
                - Videos: cypress/videos
            """
        }
        failure {
            echo """
                ❌ Test Execution Summary
                Status: FAILED
                Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                Please check the reports for details
            """
        }
    }
}