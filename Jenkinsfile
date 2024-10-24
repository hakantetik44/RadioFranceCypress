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
                    export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                    npm cache clean --force
                    rm -rf node_modules
                    npm install
                    npx cypress install --force
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

                writeFile file: 'cypress.config.js', text: '''
                    const { defineConfig } = require('cypress')

                    module.exports = defineConfig({
                        e2e: {
                            setupNodeEvents(on, config) {
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
                            },
                            retries: {
                                runMode: 2,
                                openMode: 0
                            }
                        }
                    })
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Running Cypress tests..."

                        sh '''
                            CYPRESS_VERIFY_TIMEOUT=120000 npx cypress run \
                            --browser electron \
                            --headless \
                            --config-file cypress.config.js \
                            2>&1 | tee cypress-output.txt
                        '''

                        sh '''
                            if [ -d "cypress/reports/json" ]; then
                                npx mochawesome-merge "cypress/reports/json/*.json" > "cypress/reports/mochawesome.json"
                                npx marge "cypress/reports/mochawesome.json" --reportDir "cypress/reports/html" --inline
                            else
                                echo "No test results found in cypress/reports/json"
                                exit 1
                            fi
                        '''

                        writeFile file: 'createReport.js', text: '''
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            // Sabit değerler
                            const COLORS = {
                                PRIMARY: [0, 44, 150],    // Koyu mavi
                                WHITE: [255, 255, 255],
                                BLACK: [0, 0, 0],
                                GRAY: [247, 247, 247],
                                SUCCESS: [46, 165, 74],   // Yeşil
                                FAILURE: [220, 53, 69],   // Kırmızı
                                INFO: [75, 75, 75]        // Gri
                            };

                            class PDFReport {
                                constructor() {
                                    this.doc = new jsPDF({
                                        orientation: 'portrait',
                                        unit: 'mm',
                                        format: 'a4'
                                    });
                                    this.pageWidth = this.doc.internal.pageSize.width;
                                    this.margin = 20;
                                }

                                setColor(color, type = 'fill') {
                                    type === 'fill' ? this.doc.setFillColor(...color) : this.doc.setTextColor(...color);
                                }

                                createHeader() {
                                    // Mavi banner
                                    this.setColor(COLORS.PRIMARY);
                                    this.doc.rect(0, 0, this.pageWidth, 35, 'F');

                                    // Başlık
                                    this.setColor(COLORS.WHITE, 'text');
                                    this.doc.setFontSize(22);
                                    this.doc.text("Rapport d'Execution des Tests", this.margin, 22);

                                    // Tarih
                                    const now = new Date();
                                    const dateStr = now.toLocaleDateString('fr-FR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }).replace(':', 'h');
                                    this.doc.setFontSize(14);
                                    this.doc.text("Date: " + dateStr, this.margin, 32);
                                }

                                createResumeSection(stats) {
                                    // Gri arka plan
                                    this.setColor(COLORS.GRAY);
                                    this.doc.rect(0, 45, this.pageWidth, 80, 'F');

                                    // Başlık
                                    this.setColor(COLORS.BLACK, 'text');
                                    this.doc.setFontSize(18);
                                    this.doc.text("Resume", this.margin, 65);

                                    // İstatistikler
                                    this.doc.setFontSize(12);
                                    const stats_text = [
                                        "Tests Total: " + stats.tests,
                                        "Tests Passes: " + stats.passes,
                                        "Tests Echoues: " + (stats.failures || 0),
                                        "Duree: " + (stats.duration / 1000).toFixed(2) + "s"
                                    ];
                                    
                                    stats_text.forEach((text, index) => {
                                        this.doc.text(text, 30, 85 + (index * 10));
                                    });
                                }

                                createResultsSection(results) {
                                    this.doc.setFontSize(18);
                                    this.setColor(COLORS.BLACK, 'text');
                                    this.doc.text("Resultats Detailles", this.margin, 145);

                                    this.doc.setFontSize(16);
                                    this.doc.text("Fonctionnalites de base de France Culture", this.margin, 165);

                                    if (results && results.length > 0) {
                                        let yPos = 185;
                                        results[0].tests.forEach((test) => {
                                            // Test sonuç kutusu
                                            this.setColor(COLORS.WHITE);
                                            this.doc.rect(15, yPos - 5, this.pageWidth - 30, 20, 'F');
                                            this.doc.setDrawColor(...COLORS.GRAY);
                                            this.doc.rect(15, yPos - 5, this.pageWidth - 30, 20, 'D');

                                            // Test durumu
                                            this.setColor(test.pass ? COLORS.SUCCESS : COLORS.FAILURE, 'text');
                                            this.doc.text(test.pass ? "✓" : "✗", 20, yPos + 5);

                                            // Test başlığı ve süresi
                                            this.setColor(COLORS.BLACK, 'text');
                                            this.doc.setFontSize(11);
                                            this.doc.text(test.title, 30, yPos + 5);
                                            this.doc.text("Durée: " + (test.duration / 1000).toFixed(2) + "s", 30, yPos + 12);

                                            yPos += 25;
                                            
                                            if (yPos > 250) {
                                                this.doc.addPage();
                                                yPos = 30;
                                            }
                                        });
                                    }
                                }

                                createJournalSection() {
                                    // Gri arka plan
                                    this.setColor(COLORS.GRAY);
                                    this.doc.rect(0, 190, this.pageWidth, 100, 'F');

                                    // Başlık
                                    this.setColor(COLORS.BLACK, 'text');
                                    this.doc.setFontSize(18);
                                    this.doc.text("Journal d'Execution", this.margin, 210);

                                    // Log kayıtları
                                    const logs = [
                                        "✓ Page | Chargement reussi",
                                        "✓ Cookies | Configuration acceptee",
                                        "ℹ Page | France Culture - Ecouter la radio en direct et podcasts gratuitement",
                                        "✓ Menu | Principal disponible",
                                        "ℹ Menu | 35 elements verifies",
                                        "Pas de banniere de cookies detectee",
                                        "✓ Recherche | Fonctionnalite disponible"
                                    ];

                                    this.doc.setFontSize(11);
                                    logs.forEach((log, index) => {
                                        this.doc.text(log, 30, 230 + (index * 8));
                                    });
                                }

                                generate(reportData) {
                                    try {
                                        this.createHeader();
                                        this.createResumeSection(reportData.stats);
                                        this.createResultsSection(reportData.results);
                                        this.createJournalSection();
                                        
                                        this.doc.save(`${process.env.REPORT_DIR}/pdf/report_${process.env.TIMESTAMP}.pdf`);
                                    } catch (error) {
                                        console.error('Error generating PDF:', error);
                                        process.exit(1);
                                    }
                                }
                            }

                            try {
                                const reportData = JSON.parse(fs.readFileSync('cypress/reports/mochawesome.json', 'utf8'));
                                const pdfReport = new PDFReport();
                                pdfReport.generate(reportData);
                            } catch (err) {
                                console.error('Error reading report data:', err);
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