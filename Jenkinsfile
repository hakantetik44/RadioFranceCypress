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
    }
    
    stages {
        stage('Préparation') {
            steps {
                script {
                    echo "🚀 Démarrage du pipeline de test"
                    env.BUILD_NUMBER = currentBuild.number.toString()
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
                    npm install --save-dev jspdf mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Exécution des tests Cypress..."
                        
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter mochawesome \
                            --reporter-options configFile=reporter-config.json \
                            2>&1 | tee cypress-output.txt || true
                        """

                        writeFile file: 'createReport.js', text: '''
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
                                const testOutput = fs.readFileSync('cypress-output.txt', 'utf8');

                                const logs = testOutput.split('\\n')
                                    .filter(line => line.includes('CYPRESS_LOG:'))
                                    .map(line => line.replace('CYPRESS_LOG:', '').trim())
                                    .filter(log => log && 
                                        !log.includes('DevTools') && 
                                        !log.includes('Opening Cypress') && 
                                        !log.includes('tput:'));

                                const doc = new jsPDF();

                                // Titre principal
                                doc.setFontSize(24);
                                doc.setTextColor(44, 62, 80);
                                doc.text('Rapport de Tests', 20, 30);
                                doc.setFontSize(20);
                                doc.text('France Culture', 20, 45);

                                // Informations du build
                                doc.setFontSize(12);
                                doc.setTextColor(0, 0, 0);
                                doc.text([
                                    'Date d\\'exécution: ''' + env.TIMESTAMP.replace('_', ' ') + '''',
                                    'Build: #''' + env.BUILD_NUMBER + '''',
                                    'Commit: ''' + env.GIT_COMMIT_MSG.replaceAll("'", "") + '''',
                                    'Auteur: ''' + env.GIT_AUTHOR + ''''
                                ], 20, 65);

                                // Résumé des tests
                                doc.setFontSize(16);
                                doc.text('Résumé', 20, 90);
                                
                                doc.setFontSize(12);
                                const stats = [
                                    'Tests Total: ' + report.stats.tests,
                                    'Tests Réussis: ' + report.stats.passes,
                                    'Tests Échoués: ' + report.stats.failures,
                                    'Durée: ' + Math.round(report.stats.duration/1000) + ' secondes'
                                ];
                                doc.text(stats, 25, 105);

                                // Détails des tests
                                doc.setFontSize(16);
                                doc.text('Détails des Tests', 20, 140);

                                let y = 155;
                                report.results[0].suites[0].tests.forEach(test => {
                                    if (y > 250) {
                                        doc.addPage();
                                        y = 20;
                                    }

                                    const icon = test.state === 'passed' ? '✓' : '✗';
                                    const color = test.state === 'passed' ? [46, 204, 113] : [231, 76, 60];
                                    
                                    doc.setFontSize(12);
                                    doc.setTextColor(...color);
                                    doc.text(icon, 20, y);
                                    
                                    doc.setTextColor(0, 0, 0);
                                    doc.text(test.title, 30, y);
                                    doc.text((test.duration/1000).toFixed(2) + 's', 160, y);
                                    
                                    y += 10;

                                    if (!test.state === 'passed' && test.err) {
                                        doc.setFontSize(10);
                                        doc.setTextColor(231, 76, 60);
                                        doc.text('Erreur: ' + test.err.message, 35, y);
                                        y += 10;
                                    }
                                });

                                // Logs
                                if (logs.length > 0) {
                                    doc.addPage();
                                    doc.setFontSize(16);
                                    doc.setTextColor(0, 0, 0);
                                    doc.text('Journal d\\'Exécution', 20, 20);

                                    y = 40;
                                    logs.forEach(log => {
                                        if (y > 250) {
                                            doc.addPage();
                                            y = 20;
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
                                        doc.text(icon + ' ' + log, 25, y);
                                        y += 8;
                                    });
                                }

                                // Numéros de page
                                const pageCount = doc.getNumberOfPages();
                                for (let i = 1; i <= pageCount; i++) {
                                    doc.setPage(i);
                                    doc.setFontSize(8);
                                    doc.setTextColor(128, 128, 128);
                                    doc.text('Page ' + i + ' / ' + pageCount, 20, 285);
                                    doc.text('Radio France - Tests Automatisés', 85, 285);
                                    doc.text(''' + env.TIMESTAMP.replace('_', ' ') + '''', 170, 285);
                                }

                                doc.save(''' + env.REPORT_DIR + '''/pdf/report_''' + env.TIMESTAMP + '''.pdf');
                                console.log('✅ Rapport PDF généré avec succès');

                            } catch (error) {
                                console.error('❌ Erreur: ', error);
                                process.exit(1);
                            }
                        '''

                        sh 'node createReport.js'
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
            post {
                always {
                    sh 'rm -f cypress-output.txt createReport.js'
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: """
                ${REPORT_DIR}/pdf/*,
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
                - Consultez les rapports pour plus de détails
            """
        }
        cleanup {
            cleanWs()
        }
    }
}
```