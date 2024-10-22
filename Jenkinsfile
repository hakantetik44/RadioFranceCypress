```groovy
pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        REPORT_DIR = "cypress/reports"
        TIMESTAMP = new Date().format('yyyy-MM-dd_HH-mm-ss')
        GIT_COMMIT_MSG = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
        GIT_AUTHOR = sh(script: 'git log -1 --pretty=%an', returnStdout: true).trim()
        BUILD_USER = currentBuild.getBuildCauses()[0].userId
    }
    
    stages {
        stage('Préparation') {
            steps {
                script {
                    echo "🚀 Démarrage du pipeline de test"
                    echo "⚙️ Configuration de l'environnement..."
                }
                
                checkout scm
                
                sh """
                    mkdir -p $CYPRESS_CACHE_FOLDER
                    mkdir -p ${REPORT_DIR}/{json,html,pdf,junit}
                    mkdir -p cypress/videos cypress/screenshots
                """
            }
        }
        
        stage('Installation') {
            steps {
                script {
                    echo "📦 Installation des dépendances..."
                }
                
                sh '''
                    npm ci
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter jspdf
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Exécution des tests Cypress..."
                        
                        // Testleri çalıştır
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter mochawesome \
                            --reporter-options configFile=reporter-config.json \
                            2>&1 | tee cypress-output.txt
                        """

                        // PDF rapor oluşturma scripti
                        writeFile file: 'createReport.js', text: """
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
                                const testOutput = fs.readFileSync('cypress-output.txt', 'utf8');
                                const doc = new jsPDF();

                                // Başlık Sayfası
                                doc.setFontSize(28);
                                doc.setTextColor(44, 62, 80);
                                doc.text('Rapport de Tests', 20, 30);
                                doc.setFontSize(24);
                                doc.text('France Culture', 20, 45);

                                // Bilgi Kutusu
                                doc.setDrawColor(52, 152, 219);
                                doc.setFillColor(240, 248, 255);
                                doc.roundedRect(20, 60, 170, 50, 3, 3, 'FD');
                                
                                doc.setFontSize(12);
                                doc.setTextColor(0, 0, 0);
                                doc.text([
                                    'Build: #${BUILD_NUMBER}',
                                    'Date: ${TIMESTAMP}',
                                    'Commit: ${GIT_COMMIT_MSG}',
                                    'Auteur: ${GIT_AUTHOR}',
                                    'Exécuté par: ${BUILD_USER}'
                                ], 25, 70);

                                // Test Özeti
                                doc.setFontSize(20);
                                doc.setTextColor(41, 128, 185);
                                doc.text('Résumé des Tests', 20, 130);

                                // Özet Kutusu
                                const passRate = (report.stats.passes / report.stats.tests) * 100;
                                doc.setFontSize(14);
                                doc.setTextColor(0, 0, 0);
                                
                                // İstatistik kutuları
                                function drawStatBox(text, value, x, y, color) {
                                    doc.setDrawColor(color[0], color[1], color[2]);
                                    doc.setFillColor(255, 255, 255);
                                    doc.roundedRect(x, y, 80, 30, 3, 3, 'FD');
                                    doc.setTextColor(color[0], color[1], color[2]);
                                    doc.text(text, x + 5, y + 12);
                                    doc.setFontSize(16);
                                    doc.text(value.toString(), x + 5, y + 25);
                                    doc.setFontSize(14);
                                }

                                drawStatBox('Tests Total', report.stats.tests, 20, 140, [52, 73, 94]);
                                drawStatBox('Réussis', report.stats.passes, 110, 140, [46, 204, 113]);
                                drawStatBox('Échoués', report.stats.failures, 20, 180, [231, 76, 60]);
                                drawStatBox('Durée', Math.round(report.stats.duration/1000) + 's', 110, 180, [52, 152, 219]);

                                // Test Detayları
                                doc.addPage();
                                doc.setFontSize(20);
                                doc.setTextColor(41, 128, 185);
                                doc.text('Détails des Tests', 20, 20);

                                let yPos = 40;
                                report.results[0].suites[0].tests.forEach(test => {
                                    if (yPos > 250) {
                                        doc.addPage();
                                        yPos = 20;
                                    }

                                    const isPassed = test.state === 'passed';
                                    const icon = isPassed ? '✓' : '✗';
                                    const color = isPassed ? [46, 204, 113] : [231, 76, 60];
                                    
                                    doc.setTextColor(...color);
                                    doc.setFontSize(14);
                                    doc.text(icon, 20, yPos);

                                    doc.setTextColor(0, 0, 0);
                                    doc.setFontSize(12);
                                    doc.text(test.title, 35, yPos);
                                    doc.text((test.duration/1000).toFixed(2) + 's', 160, yPos);

                                    if (!isPassed && test.err) {
                                        yPos += 7;
                                        doc.setFontSize(10);
                                        doc.setTextColor(231, 76, 60);
                                        const errorLines = doc.splitTextToSize(test.err.message, 150);
                                        errorLines.forEach(line => {
                                            doc.text(line, 35, yPos);
                                            yPos += 5;
                                        });
                                    }

                                    yPos += 10;
                                });

                                // Log Sayfası
                                doc.addPage();
                                doc.setFontSize(20);
                                doc.setTextColor(41, 128, 185);
                                doc.text('Journal d\\'Exécution', 20, 20);

                                const logs = testOutput.split('\\n')
                                    .filter(line => line.includes('CYPRESS_LOG:'))
                                    .map(line => line.replace('CYPRESS_LOG:', '').trim());

                                yPos = 40;
                                logs.forEach(log => {
                                    if (yPos > 250) {
                                        doc.addPage();
                                        yPos = 20;
                                    }

                                    let icon = '📋';
                                    if (log.includes('réussi') || log.includes('trouvé')) {
                                        icon = '✅';
                                    } else if (log.includes('échoué') || log.includes('erreur')) {
                                        icon = '❌';
                                    } else if (log.includes('chargé')) {
                                        icon = '🔄';
                                    }

                                    doc.setFontSize(10);
                                    doc.setTextColor(0, 0, 0);
                                    doc.text(icon + ' ' + log, 25, yPos);
                                    yPos += 8;
                                });

                                // Alt Bilgi
                                const pageCount = doc.getNumberOfPages();
                                for (let i = 1; i <= pageCount; i++) {
                                    doc.setPage(i);
                                    doc.setFontSize(8);
                                    doc.setTextColor(128, 128, 128);
                                    doc.text('Page ' + i + ' / ' + pageCount, 20, 285);
                                    doc.text('Radio France - Tests Automatisés', 85, 285);
                                    doc.text('${TIMESTAMP}', 170, 285);
                                }

                                doc.save('${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf');
                                console.log('✅ Rapport PDF généré avec succès');

                            } catch (error) {
                                console.error('❌ Erreur lors de la génération du PDF:', error);
                                process.exit(1);
                            }
                        """

                        // PDF raporu oluştur
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
                - Videos: cypress/videos
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
```