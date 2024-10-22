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
                        
                        // Run tests
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter mochawesome \
                            --reporter-options configFile=reporter-config.json \
                            2>&1 | tee cypress-output.txt
                        """

                        // Create PDF report
                        writeFile file: 'createReport.js', text: """
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
                                const testOutput = fs.readFileSync('cypress-output.txt', 'utf8');
                                const doc = new jsPDF();
                                
                                // Title
                                doc.setFontSize(20);
                                doc.text('Rapport de Tests Automatisés', 20, 20);
                                doc.setFontSize(18);
                                doc.text('France Culture', 20, 30);
                                
                                // Summary
                                doc.setFontSize(14);
                                doc.text([
                                    'Date d\\'exécution: ${TIMESTAMP}',
                                    'Nombre total de tests: ' + report.stats.tests,
                                    'Tests réussis: ' + report.stats.passes,
                                    'Tests échoués: ' + report.stats.failures,
                                    'Durée totale: ' + Math.round(report.stats.duration/1000) + ' secondes'
                                ], 20, 50);
                                
                                // Test Details
                                let yPos = 90;
                                doc.setFontSize(16);
                                doc.text('Détail des Tests:', 20, yPos);
                                yPos += 10;

                                report.results[0].suites[0].tests.forEach(test => {
                                    if (yPos > 250) {
                                        doc.addPage();
                                        yPos = 20;
                                    }

                                    doc.setFontSize(12);
                                    const status = test.state === 'passed' ? '✓' : '✗';
                                    const color = test.state === 'passed' ? [0, 128, 0] : [255, 0, 0];
                                    
                                    doc.setTextColor(...color);
                                    doc.text(status, 20, yPos);
                                    doc.setTextColor(0, 0, 0);
                                    
                                    const title = test.title;
                                    const duration = (test.duration/1000).toFixed(2) + 's';
                                    
                                    doc.text(title, 30, yPos);
                                    doc.text(duration, 150, yPos);
                                    
                                    if (test.state === 'failed' && test.err) {
                                        yPos += 8;
                                        doc.setFontSize(10);
                                        doc.setTextColor(255, 0, 0);
                                        doc.text('Erreur: ' + test.err.message, 35, yPos);
                                        doc.setTextColor(0, 0, 0);
                                    }
                                    
                                    yPos += 12;
                                });
                                
                                // Logs Section
                                doc.addPage();
                                doc.setFontSize(16);
                                doc.text('Journal d\\'Exécution:', 20, 20);
                                
                                let logPos = 40;
                                const logs = testOutput.split('\\n')
                                    .filter(line => line.includes('CYPRESS_LOG:'))
                                    .map(line => line.replace('CYPRESS_LOG:', '').trim());
                                
                                logs.forEach(log => {
                                    if (logPos > 250) {
                                        doc.addPage();
                                        logPos = 20;
                                    }
                                    
                                    doc.setFontSize(10);
                                    doc.text('• ' + log, 25, logPos);
                                    logPos += 10;
                                });
                                
                                doc.save('${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf');
                                console.log('PDF report generated successfully');
                                
                            } catch (error) {
                                console.error('Error generating PDF:', error);
                                process.exit(1);
                            }
                        """

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
            """
        }
        failure {
            echo """
                ❌ Bilan des Tests:
                - Statut: ÉCHOUÉ
                - Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Consultez le rapport pour plus de détails
            """
        }
        cleanup {
            cleanWs()
        }
    }
}