pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        REPORT_DIR = "cypress/reports"
        TIMESTAMP = new Date().format('yyyy-MM-dd_HH-mm-ss')
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
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
                    npm set progress=false
                    npm ci --no-audit
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
                        
                        // Cypress testlerini çalıştır
                        sh '''
                            export CYPRESS_VIDEO=false
                            npx cypress run \
                                --browser electron \
                                --headless \
                                --reporter cypress-multi-reporters \
                                --reporter-options configFile=reporter-config.json > test-output.txt 2>&1
                        '''

                        // Test loglarını işle
                        def logs = sh(script: "grep 'CYPRESS_LOG:' test-output.txt || true", returnStdout: true).trim()
                        def testResults = []
                        logs.split('\n').each { line ->
                            if (line) {
                                testResults.add(line.replace('CYPRESS_LOG:', '').trim())
                            }
                        }

                        // PDF raporu oluştur
                        sh """
                            node -e '
                            const fs = require("fs");
                            const { jsPDF } = require("jspdf");
                            
                            const logs = ${groovy.json.JsonOutput.toJson(testResults)};
                            const doc = new jsPDF();
                            let y = 20;
                            
                            // Başlık
                            doc.setFontSize(20);
                            doc.setTextColor(44, 62, 80);
                            doc.text("Rapport Détaillé - France Culture", 20, y);
                            
                            // Tarih
                            y += 20;
                            doc.setFontSize(12);
                            doc.setTextColor(52, 73, 94);
                            doc.text("Date du Test: ${TIMESTAMP}", 20, y);
                            
                            // Test sonuçları
                            y += 20;
                            doc.setFontSize(14);
                            doc.setTextColor(41, 128, 185);
                            doc.text("Résultats des Tests", 20, y);
                            
                            // Log detayları
                            y += 10;
                            doc.setFontSize(11);
                            doc.setTextColor(0, 0, 0);
                            logs.forEach(log => {
                                y += 8;
                                if (y >= 280) {
                                    doc.addPage();
                                    y = 20;
                                }
                                doc.text("• " + log, 25, y);
                            });
                            
                            doc.save("${REPORT_DIR}/pdf/rapport_${TIMESTAMP}.pdf");
                            '
                        """
                        
                        echo "\n📋 Résultats des Tests:"
                        testResults.each { result ->
                            echo "  ➜ ${result}"
                        }
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("⚠️ Interruption des tests: ${e.message}")
                    }
                }
            }
            post {
                always {
                    sh 'rm -f test-output.txt || true'
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: '''
                ${REPORT_DIR}/**/*
            ''', allowEmptyArchive: true
        }
        success {
            script {
                echo """
                ✅ Résumé Final:
                - État: RÉUSSI
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Rapports: ${REPORT_DIR}/{html,pdf}
                """
            }
        }
        failure {
            script {
                echo """
                ⚠️ Résumé Final:
                - État: INTERROMPU
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                """
            }
        }
        cleanup {
            cleanWs(cleanWhenSuccess: true, cleanWhenFailure: true, cleanWhenAborted: true)
        }
    }
}