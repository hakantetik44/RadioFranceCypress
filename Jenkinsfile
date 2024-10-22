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
        BUILD_NUMBER = currentBuild.number
    }
    
    stages {
        stage('Préparation') {
            steps {
                script {
                    echo "🚀 Démarrage du pipeline de test"
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
                        
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter mochawesome \
                            --reporter-options configFile=reporter-config.json \
                            2>&1 | tee cypress-output.txt
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
                                    .filter(line => !line.includes('DevTools') && 
                                                !line.includes('Opening Cypress') &&
                                                !line.includes('tput:') &&
                                                !line.includes('[90m') &&
                                                !line.includes('Task without title'));

                                const doc = new jsPDF();

                                // Title Page
                                doc.setFontSize(24);
                                doc.setTextColor(44, 62, 80);
                                doc.text('Rapport de Tests', 20, 30);
                                doc.setFontSize(20);
                                doc.text('France Culture', 20, 45);

                                // Info Box
                                doc.setDrawColor(52, 152, 219);
                                doc.setFillColor(240, 248, 255);
                                doc.roundedRect(20, 60, 170, 40, 3, 3, 'FD');

                                // Header Information
                                doc.setFontSize(11);
                                doc.setTextColor(0, 0, 0);
                                doc.text([
                                    'Date d\\'exécution: ''' + env.TIMESTAMP.replace('_', ' ') + '''',
                                    'Build: #''' + env.BUILD_NUMBER + '''',
                                    'Commit: ''' + env.GIT_COMMIT_MSG + '''',
                                    'Auteur: ''' + env.GIT_AUTHOR + ''''
                                ], 30, 70);

                                // Test Summary
                                doc.setFontSize(16);
                                doc.setTextColor(41, 128, 185);
                                doc.text('Résumé des Tests', 20, 120);

                                // Statistic Boxes
                                const boxes = [
                                    { label: 'Tests Total:', value: report.stats.tests, color: [52, 73, 94] },
                                    { label: 'Réussis:', value: report.stats.passes, color: [46, 204, 113] },
                                    { label: 'Échoués:', value: report.stats.failures, color: [231, 76, 60] },
                                    { label: 'Durée:', value: Math.round(report.stats.duration/1000) + 's', color: [52, 152, 219] }
                                ];

                                let boxY = 130;
                                boxes.forEach((box, index) => {
                                    doc.setDrawColor(...box.color);
                                    doc.setFillColor(255, 255, 255);
                                    doc.roundedRect(20, boxY, 80, 25, 3, 3, 'FD');
                                    doc.setTextColor(...box.color);
                                    doc.setFontSize(12);
                                    doc.text(box.label, 25, boxY + 10);
                                    doc.setFontSize(14);
                                    doc.text(box.value.toString(), 25, boxY + 20);
                                    boxY += 30;
                                });

                                // Test Details Page
                                doc.addPage();
                                doc.setFontSize(16);
                                doc.setTextColor(41, 128, 185);
                                doc.text('Détails des Tests', 20, 20);

                                let yPos = 40;
                                report.results[0].suites[0].tests.forEach(test => {
                                    if (yPos > 250) {
                                        doc.addPage();
                                        yPos = 20;
                                    }

                                    const duration = (test.duration/1000).toFixed(2);
                                    const icon = test.state === 'passed' ? '✓' : '✗';
                                    const color = test.state === 'passed' ? [46, 204, 113] : [231, 76, 60];
                                    
                                    doc.setTextColor(...color);
                                    doc.text(icon, 20, yPos);
                                    doc.setTextColor(0, 0, 0);
                                    doc.setFontSize(12);
                                    doc.text(test.title, 35, yPos);
                                    doc.text(duration + 's', 160, yPos);
                                    yPos += 20;
                                });

                                // Logs Page
                                if (logs.length > 0) {
                                    doc.addPage();
                                    doc.setFontSize(16);
                                    doc.setTextColor(41, 128, 185);
                                    doc.text('Journal d\\'Exécution', 20, 20);

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
                                        yPos += 10;
                                    });
                                }

                                // Page Numbers
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
                                console.error('❌ Erreur lors de la génération du PDF:', error);
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
                ${REPORT_DIR}/pdf/*,
                ${REPORT_DIR}/html/*,
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
                - Rapport HTML: ${REPORT_DIR}/html/
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