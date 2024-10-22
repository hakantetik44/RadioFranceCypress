pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        REPORT_DIR = "cypress/reports"
        TIMESTAMP = new Date().format('yyyy-MM-dd_HH-mm-ss')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter jspdf
                '''
            }
        }

        stage('Prepare Test Environment') {
            steps {
                sh """
                    mkdir -p $CYPRESS_CACHE_FOLDER
                    mkdir -p ${REPORT_DIR}/{json,html,pdf,junit}
                    mkdir -p cypress/videos cypress/screenshots
                """
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    try {
                        echo "🚀 Démarrage des Tests Cypress..."
                        
                        // Testleri çalıştır ve logları kaydet
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --config video=true \
                            --reporter cypress-multi-reporters \
                            --reporter-options configFile=reporter-config.json \
                            2>&1 | tee cypress-output.txt
                        """

                        // Test loglarını oku ve göster
                        def testOutput = sh(
                            script: "cat cypress-output.txt | grep 'CYPRESS_LOG:' || true",
                            returnStdout: true
                        ).trim()

                        echo "\n📋 Résultats des Tests:"
                        testOutput.split('\n').each { line ->
                            if (line) {
                                echo "  ➜ ${line.replace('CYPRESS_LOG:', '').trim()}"
                            }
                        }

                        // HTML raporu oluştur
                        sh """
                            if [ -f "${REPORT_DIR}/json/mochawesome.json" ]; then
                                npx marge \
                                    "${REPORT_DIR}/json/mochawesome.json" \
                                    --reportDir "${REPORT_DIR}/html" \
                                    --inline \
                                    --charts \
                                    --reportTitle "Tests Cypress - France Culture" \
                                    --reportFilename "report_${TIMESTAMP}"
                                
                                # PDF rapor oluştur
                                node -e '
                                    const fs = require("fs");
                                    const { jsPDF } = require("jspdf");
                                    
                                    const report = JSON.parse(fs.readFileSync("${REPORT_DIR}/json/mochawesome.json", "utf8"));
                                    const doc = new jsPDF();
                                    
                                    doc.setFontSize(16);
                                    doc.text("Rapport de Tests Cypress", 20, 20);
                                    
                                    doc.setFontSize(12);
                                    doc.text([
                                        "Date: ${TIMESTAMP}",
                                        "Tests total: " + report.stats.tests,
                                        "Tests réussis: " + report.stats.passes,
                                        "Tests échoués: " + report.stats.failures,
                                        "Durée: " + Math.round(report.stats.duration/1000) + " secondes"
                                    ], 20, 40);
                                    
                                    doc.save("${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf");
                                '
                            fi
                        """
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
            post {
                always {
                    sh 'rm -f cypress-output.txt'
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: """
                cypress/reports/**/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*
            """, allowEmptyArchive: true
        }
        success {
            echo """
            ✅ Bilan des Tests:
            - Statut: RÉUSSI
            - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
            - Rapports disponibles dans:
              * HTML: ${REPORT_DIR}/html
              * PDF: ${REPORT_DIR}/pdf
              * Vidéos: cypress/videos
            """
        }
        failure {
            echo """
            ❌ Bilan des Tests:
            - Statut: ÉCHOUÉ
            - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
            """
        }
        cleanup {
            cleanWs()
        }
    }
}