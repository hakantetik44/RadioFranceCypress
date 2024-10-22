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
                    mkdir -p ${REPORT_DIR}/{mocha,html,pdf,junit}
                    mkdir -p cypress/{videos,screenshots}
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
                            export CYPRESS_VIDEO=true
                            export CYPRESS_VIDEO_COMPRESSION=32
                            npx cypress run \
                                --browser electron \
                                --headless \
                                --reporter cypress-multi-reporters \
                                --reporter-options configFile=reporter-config.json | tee test-output.log
                        '''

                        // Mochawesome raporlarını birleştir
                        sh """
                            npx mochawesome-merge "${REPORT_DIR}/mocha/*.json" > "${REPORT_DIR}/mochawesome_merged.json"
                            npx marge "${REPORT_DIR}/mochawesome_merged.json" \
                                --reportDir "${REPORT_DIR}/html" \
                                --inline \
                                --charts \
                                --reportTitle "Tests Cypress - France Culture" \
                                --reportFilename "report_${TIMESTAMP}"
                        """

                        // PDF rapor oluştur
                        sh """
                            node -e 'const fs = require("fs");
                                const { jsPDF } = require("jspdf");
                                const report = JSON.parse(fs.readFileSync("${REPORT_DIR}/mochawesome_merged.json", "utf8"));
                                
                                const doc = new jsPDF();
                                doc.setFontSize(16);
                                doc.text("Rapport de Tests Cypress - France Culture", 20, 20);
                                
                                doc.setFontSize(12);
                                let y = 40;
                                
                                // Test özeti
                                doc.text([
                                    "Date: ${TIMESTAMP}",
                                    "Tests total: " + report.stats.tests,
                                    "Tests réussis: " + report.stats.passes,
                                    "Tests échoués: " + report.stats.failures,
                                    "Durée: " + Math.round(report.stats.duration/1000) + " secondes"
                                ], 20, y);
                                
                                y += 40;
                                
                                // Test detayları
                                doc.setFontSize(14);
                                doc.text("Détails des Tests:", 20, y);
                                
                                y += 10;
                                doc.setFontSize(11);
                                report.results[0].suites[0].tests.forEach(test => {
                                    y += 10;
                                    const status = test.pass ? "✓" : "✗";
                                    doc.text(status + " " + test.title, 25, y);
                                    if (test.context) {
                                        y += 5;
                                        doc.setFontSize(9);
                                        doc.text(test.context, 30, y);
                                        doc.setFontSize(11);
                                    }
                                });
                                
                                doc.save("${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf");'
                        """
                        
                        // Test loglarını göster
                        def testLogs = sh(script: "grep 'CYPRESS_LOG:' test-output.log || true", returnStdout: true).trim()
                        echo "\n📋 Résultats des Tests:"
                        testLogs.split('\n').each { log ->
                            if (log) {
                                echo "  ➜ ${log.replace('CYPRESS_LOG:', '').trim()}"
                            }
                        }
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("❌ Tests Cypress échoués: ${e.message}")
                    }
                }
            }
            post {
                always {
                    sh 'rm -f test-output.log || true'
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: '''
                ${REPORT_DIR}/**/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*
            ''', allowEmptyArchive: true
            
            junit allowEmptyResults: true, testResults: "${REPORT_DIR}/junit/*.xml"
        }
        success {
            script {
                echo """
                ✅ Bilan des Tests:
                - Statut: RÉUSSI
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Rapports disponibles dans: ${REPORT_DIR}/{html,pdf}
                - Video: cypress/videos
                """
            }
        }
        failure {
            script {
                echo """
                ❌ Bilan des Tests:
                - Statut: ÉCHOUÉ
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Consultez les rapports pour plus de détails
                """
            }
        }
        cleanup {
            cleanWs(cleanWhenSuccess: true, cleanWhenFailure: true, cleanWhenAborted: true)
        }
    }
}