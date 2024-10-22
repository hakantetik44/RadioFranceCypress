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
                '''
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    try {
                        echo "🚀 Démarrage des Tests Cypress..."
                        
                        sh '''
                            export CYPRESS_VIDEO=false
                            npx cypress run \
                                --browser electron \
                                --headless \
                                --reporter cypress-multi-reporters \
                                --reporter-options configFile=reporter-config.json | tee test-output.log
                        '''

                        // Mochawesome raporlarını birleştir
                        sh """
                            npx mochawesome-merge "${REPORT_DIR}/mocha/*.json" > "${REPORT_DIR}/mochawesome_merged.json"
                        """

                        // Test loglarını al
                        def testLogs = sh(script: "grep 'CYPRESS_LOG:' test-output.log || true", returnStdout: true).trim()
                        def logsList = testLogs.split('\n').findAll { it.length() > 0 }.collect { 
                            it.replace('CYPRESS_LOG:', '').trim() 
                        }

                        // Detaylı PDF rapor oluştur
                        sh """
                            node -e '
                                const fs = require("fs");
                                const { jsPDF } = require("jspdf");
                                const report = JSON.parse(fs.readFileSync("${REPORT_DIR}/mochawesome_merged.json", "utf8"));
                                
                                // PDF oluştur
                                const doc = new jsPDF();
                                let y = 20;
                                
                                // Başlık
                                doc.setFontSize(20);
                                doc.setTextColor(44, 62, 80);
                                doc.text("Rapport Détaillé des Tests Cypress", 20, y);
                                
                                // Alt başlık
                                y += 10;
                                doc.setFontSize(12);
                                doc.setTextColor(52, 73, 94);
                                doc.text("France Culture - Rapport d'Exécution", 20, y);
                                
                                // Tarih ve genel bilgiler
                                y += 20;
                                doc.setFontSize(14);
                                doc.setTextColor(41, 128, 185);
                                doc.text("Informations Générales", 20, y);
                                
                                y += 10;
                                doc.setFontSize(12);
                                doc.setTextColor(0, 0, 0);
                                doc.text([
                                    "Date d'exécution: ${TIMESTAMP}",
                                    "Total des Tests: " + report.stats.tests,
                                    "Tests Réussis: " + report.stats.passes,
                                    "Tests Non Réussis: " + report.stats.failures,
                                    "Durée Totale: " + Math.round(report.stats.duration/1000) + " secondes"
                                ], 25, y);
                                
                                // Test detayları
                                y += 40;
                                doc.setFontSize(14);
                                doc.setTextColor(41, 128, 185);
                                doc.text("Détails des Tests Exécutés", 20, y);
                                
                                y += 10;
                                doc.setFontSize(12);
                                report.results[0].suites[0].tests.forEach(test => {
                                    y += 10;
                                    const status = test.pass ? "✓" : "!";
                                    const color = test.pass ? [39, 174, 96] : [211, 84, 0];
                                    doc.setTextColor(...color);
                                    doc.text(status + " " + test.title, 25, y);
                                    y += 5;
                                    doc.setTextColor(127, 140, 141);
                                    doc.setFontSize(10);
                                    doc.text("Durée: " + (test.duration/1000).toFixed(2) + " secondes", 30, y);
                                    doc.setFontSize(12);
                                });
                                
                                // Logs section
                                y += 20;
                                doc.setTextColor(41, 128, 185);
                                doc.setFontSize(14);
                                doc.text("Journal d'Exécution Détaillé", 20, y);
                                
                                y += 10;
                                doc.setFontSize(11);
                                doc.setTextColor(0, 0, 0);
                                ${logsList.collect { 
                                    "y += 7; doc.text('• ${it.replace("'", "\\'")}', 25, y);" 
                                }.join('\n')}
                                
                                // Conclusion
                                y += 20;
                                doc.setFontSize(14);
                                doc.setTextColor(41, 128, 185);
                                doc.text("Conclusion", 20, y);
                                
                                y += 10;
                                doc.setFontSize(12);
                                doc.setTextColor(0, 0, 0);
                                const conclusion = report.stats.failures === 0 
                                    ? "Tous les tests ont été exécutés avec succès."
                                    : "Certains tests nécessitent une attention particulière.";
                                doc.text(conclusion, 25, y);
                                
                                doc.save("${REPORT_DIR}/pdf/rapport_complet_${TIMESTAMP}.pdf");'
                        """
                        
                        echo "\n📋 Résultats des Tests:"
                        logsList.each { log ->
                            echo "  ➜ ${log}"
                        }
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("⚠️ Interruption des tests: ${e.message}")
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
                ${REPORT_DIR}/**/*
            ''', allowEmptyArchive: true
            
            junit allowEmptyResults: true, testResults: "${REPORT_DIR}/junit/*.xml"
        }
        success {
            script {
                echo """
                ✅ Résumé d'Exécution:
                - État: RÉUSSI
                - Heure de fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Rapports disponibles dans: ${REPORT_DIR}/{html,pdf}
                """
            }
        }
        failure {
            script {
                echo """
                ⚠️ Résumé d'Exécution:
                - État: INTERROMPU
                - Heure de fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Consultez les rapports pour plus de détails
                """
            }
        }
        cleanup {
            cleanWs(cleanWhenSuccess: true, cleanWhenFailure: true, cleanWhenAborted: true)
        }
    }
}