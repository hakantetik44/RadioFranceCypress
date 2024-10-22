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
                sh '''
                    mkdir -p $CYPRESS_CACHE_FOLDER
                    mkdir -p ${REPORT_DIR}/{json,html,pdf,junit}
                '''
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    try {
                        echo "🚀 Démarrage des Tests Cypress..."
                        
                        // Testleri çalıştır
                        sh '''
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --config video=true \
                            --reporter cypress-multi-reporters \
                            --reporter-options configFile=reporter-config.json | grep "CYPRESS_LOG:" > cypress-output.log
                        '''

                        // Log mesajlarını oku ve göster
                        def logMessages = readFile('cypress-output.log').split('\n')
                            .findAll { it.length() > 0 }
                            .collect { it.replace('CYPRESS_LOG:', '').trim() }

                        echo "\n📋 Résultats des Tests:"
                        logMessages.each { message ->
                            echo "  ➜ ${message}"
                        }

                        // Raporları oluştur
                        sh """
                            if [ -f "${REPORT_DIR}/json/mochawesome.json" ]; then
                                npx marge "${REPORT_DIR}/json/mochawesome.json" \
                                    --reportDir "${REPORT_DIR}/html" \
                                    --inline \
                                    --charts \
                                    --reportTitle "Tests Cypress - France Culture" \
                                    --reportFilename "report_${TIMESTAMP}"
                                
                                node -e '
                                    const fs = require("fs");
                                    const { jsPDF } = require("jspdf");
                                    const report = JSON.parse(fs.readFileSync("${REPORT_DIR}/json/mochawesome.json", "utf8"));
                                    
                                    const doc = new jsPDF();
                                    doc.setFontSize(16);
                                    doc.text("Rapport de Tests Cypress - France Culture", 20, 20);
                                    
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
                        error("❌ Tests Cypress échoués: ${e.message}")
                    }
                }
            }
            post {
                always {
                    sh 'rm -f cypress-output.log || true'
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: """
                ${REPORT_DIR}/**/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*
            """, allowEmptyArchive: true
        }
        success {
            script {
                echo """
                ✅ Bilan des Tests:
                - Statut: RÉUSSI
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Rapports disponibles dans: ${REPORT_DIR}
                """
            }
        }
        failure {
            script {
                echo """
                ❌ Bilan des Tests:
                - Statut: ÉCHOUÉ
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                """
            }
        }
        cleanup {
            cleanWs(cleanWhenSuccess: true, cleanWhenFailure: true, cleanWhenAborted: true)
        }
    }
}