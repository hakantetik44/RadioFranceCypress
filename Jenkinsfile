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
                            CYPRESS_SCREENSHOT_ON_RUN_FAILURE=true \
                            CYPRESS_VIDEO=true \
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

                        // Detaylı PDF rapor oluştur
                        sh """
                            if [ -f "${REPORT_DIR}/json/mochawesome.json" ]; then
                                npx marge \
                                    "${REPORT_DIR}/json/mochawesome.json" \
                                    --reportDir "${REPORT_DIR}/html" \
                                    --inline \
                                    --charts \
                                    --reportTitle "Tests Cypress - France Culture" \
                                    --reportFilename "report_${TIMESTAMP}"

                                node -e '
                                    const fs = require("fs");
                                    const { jsPDF } = require("jspdf");
                                    
                                    try {
                                        const report = JSON.parse(fs.readFileSync("${REPORT_DIR}/json/mochawesome.json", "utf8"));
                                        const doc = new jsPDF();
                                        
                                        // Başlık
                                        doc.setFontSize(20);
                                        doc.setTextColor(44, 62, 80);
                                        doc.text("Rapport des Tests Automatisés", 20, 20);
                                        doc.text("France Culture", 20, 30);
                                        
                                        // Test Özeti
                                        doc.setFontSize(16);
                                        doc.setTextColor(52, 73, 94);
                                        doc.text("Résumé des Tests", 20, 50);
                                        
                                        doc.setFontSize(12);
                                        doc.setTextColor(0, 0, 0);
                                        doc.text([
                                            "Date dexécution: ${TIMESTAMP}",
                                            "Nombre total de tests: " + report.stats.tests,
                                            "Tests réussis: " + report.stats.passes,
                                            "Tests échoués: " + report.stats.failures,
                                            "Durée totale: " + Math.round(report.stats.duration/1000) + " secondes"
                                        ], 25, 65);
                                        
                                        // Test Detayları
                                        let yPos = 100;
                                        doc.setFontSize(16);
                                        doc.setTextColor(52, 73, 94);
                                        doc.text("Détails des Tests", 20, yPos);
                                        yPos += 15;
                                        
                                        report.results[0].suites.forEach(suite => {
                                            // Suite başlığı
                                            doc.setFontSize(14);
                                            doc.setTextColor(41, 128, 185);
                                            doc.text("Suite: " + suite.title, 25, yPos);
                                            yPos += 10;
                                            
                                            // Her test için
                                            suite.tests.forEach(test => {
                                                if (yPos > 270) {
                                                    doc.addPage();
                                                    yPos = 20;
                                                }
                                                
                                                doc.setFontSize(12);
                                                const status = test.state === "passed" ? "✓" : "✗";
                                                const statusColor = test.state === "passed" ? [39, 174, 96] : [192, 57, 43];
                                                
                                                doc.setTextColor(...statusColor);
                                                doc.text(status, 30, yPos);
                                                doc.setTextColor(0, 0, 0);
                                                doc.text(test.title, 40, yPos);
                                                doc.text("(" + (test.duration/1000).toFixed(2) + " sec)", 180, yPos);
                                                
                                                if (!test.pass) {
                                                    yPos += 8;
                                                    doc.setFontSize(10);
                                                    doc.setTextColor(192, 57, 43);
                                                    doc.text("Erreur: " + (test.err ? test.err.message : "Erreur inconnue"), 45, yPos);
                                                }
                                                
                                                yPos += 12;
                                            });
                                            yPos += 5;
                                        });
                                        
                                        // Log Sayfası
                                        doc.addPage();
                                        doc.setFontSize(16);
                                        doc.setTextColor(52, 73, 94);
                                        doc.text("Journal dExécution", 20, 20);
                                        
                                        let logY = 35;
                                        const logContent = fs.readFileSync("cypress-output.txt", "utf8");
                                        logContent.split("\\n")
                                            .filter(line => line.includes("CYPRESS_LOG:"))
                                            .forEach(line => {
                                                if (logY > 270) {
                                                    doc.addPage();
                                                    logY = 20;
                                                }
                                                const logMessage = line.replace("CYPRESS_LOG:", "").trim();
                                                doc.setFontSize(10);
                                                doc.setTextColor(0, 0, 0);
                                                doc.text("• " + logMessage, 25, logY);
                                                logY += 8;
                                            });
                                        
                                        doc.save("${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf");
                                    } catch (err) {
                                        console.error("Erreur lors de la génération du PDF:", err);
                                        process.exit(1);
                                    }
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
                    sh 'rm -f cypress-output.txt || true'
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
            script {
                echo """
                ✅ Bilan des Tests:
                - Statut: RÉUSSI
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Rapports disponibles dans:
                  * HTML: ${REPORT_DIR}/html
                  * PDF:  ${REPORT_DIR}/pdf
                  * Vidéos: cypress/videos
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
            cleanWs()
        }
    }
}