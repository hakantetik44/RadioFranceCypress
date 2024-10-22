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
                        
                        // Test çıktısını al ve işle
                        def testOutput = sh(
                            script: '''
                                npx cypress run \
                                --browser electron \
                                --headless \
                                --config defaultCommandTimeout=60000 \
                                --reporter cypress-multi-reporters \
                                --reporter-options configFile=reporter-config.json | grep "CYPRESS_LOG:"
                            ''',
                            returnStdout: true
                        ).trim()

                        // Log mesajlarını topla
                        def logMessages = testOutput.split('\n')
                            .findAll { it.contains('CYPRESS_LOG:') }
                            .collect { it.replace('CYPRESS_LOG:', '').trim() }

                        // Test sonuçlarını yazdır
                        echo "=== Résultats des Tests ==="
                        logMessages.each { message ->
                            echo "→ ${message}"
                        }

                        // Raporları birleştir ve dönüştür
                        sh '''
                            npx mochawesome-merge ${REPORT_DIR}/json/*.json > ${REPORT_DIR}/mochawesome.json
                            npx marge ${REPORT_DIR}/mochawesome.json --reportDir ${REPORT_DIR}/html --inline --charts --reportTitle "Tests Cypress - France Culture" --reportFilename report_${TIMESTAMP}
                            
                            # PDF oluştur
                            node -e '
                                const fs = require("fs");
                                const { jsPDF } = require("jspdf");
                                const report = JSON.parse(fs.readFileSync("${REPORT_DIR}/mochawesome.json", "utf8"));
                                
                                const doc = new jsPDF();
                                let y = 20;
                                
                                // Başlık
                                doc.setFontSize(16);
                                doc.text("Rapport de Tests Cypress - France Culture", 20, y);
                                
                                // Tarih
                                y += 10;
                                doc.setFontSize(12);
                                doc.text("Date: " + new Date().toLocaleString(), 20, y);
                                
                                // Özet
                                y += 20;
                                doc.setFontSize(14);
                                doc.text("Résumé des Tests:", 20, y);
                                
                                y += 10;
                                doc.setFontSize(12);
                                doc.text([
                                    "Total des Tests: " + report.stats.tests,
                                    "Tests Réussis: " + report.stats.passes,
                                    "Tests Échoués: " + report.stats.failures,
                                    "Durée: " + report.stats.duration + "ms"
                                ], 30, y);
                                
                                doc.save("${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf");
                            '
                        '''
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("Tests Cypress échoués: ${e.message}")
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Raporları arşivle
            archiveArtifacts artifacts: "${REPORT_DIR}/**/*", allowEmptyArchive: true
            junit "${REPORT_DIR}/junit/*.xml"
        }
        success {
            script {
                echo """
                ✅ Résumé des Tests:
                - Statut du Build: RÉUSSI
                - Heure de Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Rapports disponibles dans le dossier '${REPORT_DIR}'
                """
            }
        }
        failure {
            script {
                echo """
                ❌ Résumé des Tests:
                - Statut du Build: ÉCHOUÉ
                - Heure de Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Veuillez consulter les logs et les rapports pour plus de détails
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