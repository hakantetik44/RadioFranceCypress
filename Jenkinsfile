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
                        
                        // Testleri çalıştır
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter mochawesome \
                            --reporter-options configFile=reporter-config.json \
                            2>&1 | tee cypress-output.txt
                        """

                        // Test loglarını oku
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

                        // PDF rapor oluştur
                        sh """
                            echo 'const fs = require("fs");
                            const { jsPDF } = require("jspdf");
                            
                            try {
                                const report = JSON.parse(fs.readFileSync("${REPORT_DIR}/json/mochawesome.json", "utf8"));
                                const testOutput = fs.readFileSync("cypress-output.txt", "utf8");
                                const doc = new jsPDF();
                                
                                // Başlık
                                doc.setFontSize(20);
                                doc.text("Rapport des Tests - France Culture", 20, 20);
                                
                                // Özet Bilgiler
                                doc.setFontSize(14);
                                doc.text("Résumé de lexécution", 20, 40);
                                
                                doc.setFontSize(12);
                                doc.text([
                                    "Date et heure: ${TIMESTAMP}",
                                    "Total des tests: " + report.stats.tests,
                                    "Tests réussis: " + report.stats.passes,
                                    "Tests échoués: " + report.stats.failures,
                                    "Durée totale: " + Math.round(report.stats.duration/1000) + " secondes"
                                ], 30, 55);

                                // Test Detayları
                                doc.setFontSize(14);
                                doc.text("Détails des tests", 20, 90);
                                
                                let yPos = 100;
                                report.results[0].suites[0].tests.forEach(test => {
                                    const status = test.state === "passed" ? "✓" : "✗";
                                    doc.setFontSize(12);
                                    doc.text(status + " " + test.title, 30, yPos);
                                    doc.text("Durée: " + (test.duration/1000).toFixed(2) + "s", 30, yPos + 7);
                                    
                                    if (test.state !== "passed" && test.err) {
                                        doc.setFontSize(10);
                                        doc.text("Erreur: " + test.err.message, 35, yPos + 14);
                                        yPos += 20;
                                    } else {
                                        yPos += 15;
                                    }

                                    if (yPos > 250) {
                                        doc.addPage();
                                        yPos = 20;
                                    }
                                });

                                // Log Kayıtları
                                doc.addPage();
                                doc.setFontSize(14);
                                doc.text("Journal des actions", 20, 20);
                                
                                let logPos = 35;
                                const logs = testOutput.split("\\n")
                                    .filter(line => line.includes("CYPRESS_LOG:"))
                                    .map(line => line.replace("CYPRESS_LOG:", "").trim());
                                
                                logs.forEach(log => {
                                    doc.setFontSize(10);
                                    doc.text("• " + log, 25, logPos);
                                    logPos += 7;
                                    
                                    if (logPos > 250) {
                                        doc.addPage();
                                        logPos = 20;
                                    }
                                });
                                
                                doc.save("${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf");
                                console.log("PDF report generated successfully");
                                
                            } catch (error) {
                                console.error("Error generating PDF:", error);
                                process.exit(1);
                            }' | node
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
                cypress/reports/pdf/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*
            """, allowEmptyArchive: true
        }
        success {
            echo """
                ✅ Bilan des Tests:
                - Statut: RÉUSSI
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Rapport PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - Vidéos: cypress/videos
            """
        }
        failure {
            echo """
                ❌ Bilan des Tests:
                - Statut: ÉCHOUÉ
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Voir le rapport pour plus de détails
            """
        }
        cleanup {
            cleanWs()
        }
    }
}