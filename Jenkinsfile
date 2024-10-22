pipeline {
    agent any

    environment {
        // Gerekli ortam değişkenleri
        REPORT_DIR = 'reports'
        TIMESTAMP = new Date().format("yyyyMMdd_HHmmss")
        GIT_COMMIT_MSG = sh(script: "git log -1 --pretty=%B", returnStdout: true).trim()
        GIT_AUTHOR = sh(script: "git log -1 --pretty=%an", returnStdout: true).trim()
    }

    stages {
        stage('Clone Repository') {
            steps {
                // Repository'yi klonla
                git url: 'https://github.com/your/repo.git', branch: 'main'
            }
        }

        stage('Install Dependencies') {
            steps {
                // Bağımlılıkları yükle
                sh 'npm install'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                // Cypress testlerini çalıştır
                sh 'npx cypress run --record --key YOUR_RECORD_KEY --reporter mochawesome --reporter-options "reportDir=mochawesome-report,overwrite=false,html=false,json=true"'
            }
        }

        stage('Create Report') {
            steps {
                script {
                    // Rapor oluşturma
                    writeFile(file: 'createReport.js', text: """
                    const fs = require('fs');
                    const { jsPDF } = require('jspdf');

                    try {
                        const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
                        const testOutput = fs.readFileSync('cypress-output.txt', 'utf8');
                        const doc = new jsPDF();

                        // Page de titre
                        doc.setFontSize(28);
                        doc.setTextColor(44, 62, 80);
                        doc.text('Rapport de Tests', 20, 30);
                        doc.setFontSize(24);
                        doc.text('France Culture', 20, 45);

                        // Boîte d'informations
                        doc.setDrawColor(52, 152, 219);
                        doc.setFillColor(240, 248, 255);
                        doc.roundedRect(20, 60, 170, 50, 3, 3, 'FD');
                        
                        doc.setFontSize(12);
                        doc.setTextColor(0, 0, 0);
                        const buildInfo = [
                            'Date: ${TIMESTAMP}',
                            'Commit: ${GIT_COMMIT_MSG}',
                            'Auteur: ${GIT_AUTHOR}'
                        ];
                        doc.text(buildInfo, 25, 70);

                        // Résumé des tests
                        doc.setFontSize(20);
                        doc.setTextColor(41, 128, 185);
                        doc.text('Résumé des Tests', 20, 130);

                        // Boîtes statistiques
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
                        drawStatBox('Durée', Math.round(report.stats.duration / 1000) + 's', 110, 180, [52, 152, 219]);

                        // Détails des tests
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
                            doc.text(icon, 20, yPos);

                            doc.setTextColor(0, 0, 0);
                            doc.setFontSize(12);
                            doc.text(test.title, 35, yPos);
                            doc.text((test.duration / 1000).toFixed(2) + 's', 160, yPos);

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

                        // Logs
                        doc.addPage();
                        doc.setFontSize(20);
                        doc.setTextColor(41, 128, 185);
                        doc.text("Journal d'Exécution", 20, 20);

                        const logs = testOutput.split('\\n')
                            .filter(line => line.includes('CYPRESS_LOG:'))
                            .map(line => line.replace('CYPRESS_LOG:', '').trim())
                            .filter(line => !line.includes('DevTools') && 
                                            !line.includes('Opening Cypress') &&
                                            !line.includes('tput:') &&
                                            !line.includes('[90m') &&
                                            !line.includes('Task without title'));

                        logs.forEach(log => {
                            doc.setFontSize(12);
                            doc.text(log, 20, yPos);
                            yPos += 10;
                        });

                        // Sauvegarde du PDF
                        doc.save('${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf');
                    } catch (err) {
                        console.error(err);
                        process.exit(1);
                    }
                    """)

                    // Raporu oluştur
                    sh 'node createReport.js'
                }
            }
        }
    }

    post {
        always {
            // Test sonuçlarını temizle
            sh 'rm -f cypress-output.txt createReport.js'
        }
        success {
            echo "✅ Bilan des Tests: Statut: RÉUSSI"
        }
        failure {
            echo "❌ Bilan des Tests: Statut: ÉCHOUÉ"
            echo "Consultez le rapport pour plus de détails"
        }
        unstable {
            echo "⚠️ Bilan des Tests: Statut: INSTABLE"
        }
    }
}
