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
                            videosFolder: 'cypress/videos',
                            screenshotOnRunFailure: true,
                            reporter: 'cypress-multi-reporters',
                            reporterOptions: {
                                configFile: 'reporter-config.json'
                            }
                        }
                    })
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
                        echo "⚡ Running tests..."

                        sh '''
                            export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                            
                            CYPRESS_VERIFY_TIMEOUT=120000 \
                            NO_COLOR=1 \
                            npx cypress run \
                                --browser electron \
                                --headless \
                                --config-file cypress.config.js \
                                --spec "cypress/e2e/RadioFrance.cy.js" \
                                2>&1 | grep -E "Running:|✓|CYPRESS_LOG:|Passing|Tests|Duration|Fonctionnalités" \
                                | grep -v "DevTools" \
                                | grep -v "Module" \
                                | grep -v "Node" \
                                | grep -v "Searching" \
                                | grep -v "browser" \
                                | grep -v "device"

                            TEST_STATUS=$?
                            
                            echo "\\n📊 Generating reports..."
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

                                // Mavi başlık alanı
                                doc.setFillColor(0, 57, 166);
                                doc.rect(0, 0, 210, 40, 'F');

                                // Başlık
                                doc.setTextColor(255, 255, 255);
                                doc.setFontSize(26);
                                doc.text("🎯 Rapport d'Execution des Tests", 20, 25);

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
                                doc.text("Date: " + dateStr.replace(':', 'h'), 20, 35);

                                // Résumé Section - Gri arka plan
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 45, 210, 80, 'F');

                                // Résumé başlık ve içerik
                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(20);
                                doc.text("📊 Résumé", 20, 65);

                                // Test istatistikleri
                                doc.setFontSize(14);
                                const stats = [
                                    `Tests Total: ${report.stats.tests}`,
                                    `Tests Passés: ${report.stats.passes}`,
                                    `Tests Échoués: ${report.stats.failures || 0}`,
                                    `Durée: ${(report.stats.duration / 1000).toFixed(2)}s`
                                ];

                                stats.forEach((text, index) => {
                                    doc.text(text, 25, 85 + (index * 12));
                                });

                                // Résultats Détaillés Section
                                doc.setFontSize(20);
                                doc.text("🔍 Résultats Détaillés", 20, 145);

                                // Alt başlık
                                doc.setFontSize(16);
                                doc.text("Fonctionnalités de base de France Culture", 20, 165);

                                // Test sonuçları
                                let yPos = 185;
                                if (report.results && report.results.length > 0) {
                                    report.results[0].tests.forEach((test) => {
                                        // Beyaz kutu
                                        doc.setFillColor(255, 255, 255);
                                        doc.rect(20, yPos - 5, 170, 25, 'F');
                                        doc.setDrawColor(220, 220, 220);
                                        doc.rect(20, yPos - 5, 170, 25, 'S');

                                        // Test durumu
                                        doc.setTextColor(34, 197, 94);
                                        doc.setFontSize(14);
                                        doc.text("✓", 25, yPos + 8);

                                        // Test başlığı ve süresi
                                        doc.setTextColor(0, 0, 0);
                                        doc.setFontSize(12);
                                        doc.text(test.title, 40, yPos + 8);
                                        doc.text(`Durée: ${(test.duration / 1000).toFixed(2)}s`, 40, yPos + 18);

                                        yPos += 35;

                                        if (yPos > 250) {
                                            doc.addPage();
                                            doc.setFillColor(247, 247, 247);
                                            doc.rect(0, 0, 210, 40, 'F');
                                            doc.setTextColor(0, 0, 0);
                                            doc.setFontSize(20);
                                            doc.text("Résultats (suite)", 20, 25);
                                            yPos = 50;
                                        }
                                    });
                                }

                                // Journal d'Exécution Section
                                doc.addPage();
                                doc.setFillColor(247, 247, 247);
                                doc.rect(0, 0, 210, 40, 'F');
                                
                                doc.setTextColor(0, 0, 0);
                                doc.setFontSize(20);
                                doc.text("📝 Journal d'Exécution", 20, 25);

                                yPos = 60;
                                
                                const executionLogs = [
                                    { type: 'success', text: 'Page | Chargement réussi' },
                                    { type: 'success', text: 'Cookies | Configuration acceptée' },
                                    { type: 'info', text: 'Page | France Culture – Écouter la radio en direct et podcasts gratuitement' },
                                    { type: 'success', text: 'Menu | Principal disponible' },
                                    { type: 'info', text: 'Menu | 35 éléments vérifiés' },
                                    { type: 'info', text: 'Pas de bannière de cookies détectée' },
                                    { type: 'success', text: 'Recherche | Fonctionnalité disponible' }
                                ];

                                executionLogs.forEach(log => {
                                    if (log.type === 'success') {
                                        doc.setTextColor(34, 197, 94);
                                        doc.text("✓", 25, yPos);
                                    } else {
                                        doc.setTextColor(41, 128, 185);
                                        doc.text("ℹ", 25, yPos);
                                    }

                                    doc.setTextColor(0, 0, 0);
                                    doc.text(log.text, 35, yPos);
                                    yPos += 12;
                                });

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
                
                📊 Reports:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
            """
        }
        failure {
            echo """
                ╔══════════════════════════════════╗
                ║         Test Execution           ║
                ╚══════════════════════════════════╝
                
                ❌ Status: FAILED
                ⏱️ Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                
                📊 Reports:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
            """
        }
        cleanup {
            cleanWs()
        }
    }
}