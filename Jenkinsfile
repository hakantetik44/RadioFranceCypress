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
        ALLURE_RESULTS_DIR = 'allure-results'
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
                    mkdir -p ${ALLURE_RESULTS_DIR}
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
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter jspdf @shelex/cypress-allure-plugin allure-commandline
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Running Cypress tests..."

                        // Cypress testlerini çalıştır ve logları temizle
                        sh '''
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter cypress-multi-reporters \
                            --reporter-options configFile=reporter-config.json \
                            2>&1 | sed -r "s/\\x1b\\[[0-9;]*m//g" | tee cypress-output.txt
                        '''

                        // PDF raporu oluştur
                        writeFile file: 'createReport.js', text: """
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
                                const testOutput = fs.readFileSync('cypress-output.txt', 'utf8');
                                const doc = new jsPDF();

                                // PDF içeriği oluşturma
                                doc.setFontSize(28);
                                doc.text('Test Report', 20, 30);

                                // PDF'i kaydet
                                doc.save('${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf');
                            } catch (err) {
                                console.error(err);
                                process.exit(1);
                            }
                        """

                        // Raporu çalıştır
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
                    '''
                }
            }
        }

        stage('Generate Allure Report') {
            steps {
                script {
                    echo "📊 Generating Allure Report..."
                    sh '''
                        npx allure generate ${ALLURE_RESULTS_DIR} --clean -o allure-report
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: """
                cypress/reports/pdf/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*,
                allure-report/**/*
            """, allowEmptyArchive: true

            // Publish Allure Report
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'allure-report',
                reportFiles: 'index.html',
                reportName: 'Allure Report',
                reportTitles: 'Allure Report'
            ])
        }
        success {
            echo """
                ✅ Test Summary:
                - Status: SUCCESS
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - PDF Report: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - Allure Report: allure-report/index.html
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