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
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter
                    npm install --save-dev jspdf
                '''
            }
        }

        stage('Prepare Test Environment') {
            steps {
                sh '''
                    mkdir -p $CYPRESS_CACHE_FOLDER
                    mkdir -p ${REPORT_DIR}/json
                    mkdir -p ${REPORT_DIR}/html
                    mkdir -p ${REPORT_DIR}/pdf
                    mkdir -p ${REPORT_DIR}/junit
                '''
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    try {
                        echo "Démarrage des Tests Cypress..."
                        
                        // Test çıktısını dosyaya yazıp okuma
                        sh '''
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --config video=true \
                            --reporter cypress-multi-reporters \
                            --reporter-options configFile=reporter-config.json \
                            2>&1 | tee cypress-output.log
                        '''

                        // Log dosyasından CYPRESS_LOG mesajlarını oku
                        def testOutput = sh(
                            script: "grep 'CYPRESS_LOG:' cypress-output.log || true",
                            returnStdout: true
                        ).trim()

                        // Log mesajlarını işle
                        def logMessages = testOutput.split('\n')
                            .findAll { it.length() > 0 }
                            .collect { it.replace('CYPRESS_LOG:', '').trim() }

                        // Test sonuçlarını yazdır
                        echo "=== Résultats des Tests ==="
                        logMessages.each { message ->
                            echo "→ ${message}"
                        }

                        // Rapor oluştur
                        sh """
                            if [ -f "${REPORT_DIR}/json/mochawesome.json" ]; then
                                # HTML rapor oluştur
                                npx marge "${REPORT_DIR}/json/mochawesome.json" \
                                    --reportDir "${REPORT_DIR}/html" \
                                    --inline \
                                    --charts \
                                    --reportTitle "Tests Cypress - France Culture" \
                                    --reportFilename "report_${TIMESTAMP}"
                                
                                # PDF rapor oluştur
                                node -e '
                                    const fs = require("fs");
                                    const { jsPDF } = require("jspdf");
                                    
                                    try {
                                        const report = JSON.parse(fs.readFileSync("${REPORT_DIR}/json/mochawesome.json", "utf8"));
                                        const doc = new jsPDF();
                                        
                                        doc.setFontSize(16);
                                        doc.text("Rapport de Tests Cypress", 20, 20);
                                        
                                        doc.setFontSize(12);
                                        doc.text([
                                            "Date: ${TIMESTAMP}",
                                            "Total Tests: " + report.stats.tests,
                                            "Passed: " + report.stats.passes,
                                            "Failed: " + report.stats.failures,
                                            "Duration: " + report.stats.duration + "ms"
                                        ], 20, 40);
                                        
                                        doc.save("${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf");
                                    } catch (err) {
                                        console.error("Erreur lors de la création du PDF:", err);
                                    }
                                '
                            fi
                        """
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("Tests Cypress échoués: ${e.message}")
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
            
            junit allowEmptyResults: true, testResults: "${REPORT_DIR}/junit/results*.xml"
        }
        success {
            script {
                echo """
                ✅ Résumé des Tests:
                - Statut du Build: RÉUSSI
                - Heure de Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Rapports disponibles dans '${REPORT_DIR}'
                """
            }
        }
        failure {
            script {
                echo """
                ❌ Résumé des Tests:
                - Statut du Build: ÉCHOUÉ
                - Heure de Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Veuillez consulter les logs et les rapports
                """
            }
        }
        cleanup {
            cleanWs(
                cleanWhenSuccess: true,
                cleanWhenFailure: true,
                cleanWhenAborted: true
            )
        }
    }
}