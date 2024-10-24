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
        stage('Preparation') {
            steps {
                script {
                    echo """
                        ╔══════════════════════════════════╗
                        ║         Test Automation          ║
                        ╚══════════════════════════════════╝
                        
                        🚀 Starting test execution...
                    """
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
                    echo "📦 Installing dependencies..."
                }

                sh '''
                    export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                    rm -rf node_modules
                    npm install
                    npx cypress install --force
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter jspdf
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo """
                            ╔══════════════════════════════════╗
                            ║         Test Execution           ║
                            ╚══════════════════════════════════╝
                        """

                        sh '''
                            export CYPRESS_CACHE_FOLDER=${WORKSPACE}/.cypress-cache
                            
                            echo "🚀 Starting Tests..."
                            
                            CYPRESS_VERIFY_TIMEOUT=120000 \
                            NO_COLOR=1 \
                            npx cypress run \
                                --browser electron \
                                --headless \
                                --config-file cypress.config.js \
                                --spec "cypress/e2e/RadioFrance.cy.js" \
                            | grep -v "DevTools" \
                            | grep -v "tput" \
                            | grep -v "=" \
                            | grep -v "Opening" \
                            | grep -v "\\[" \
                            | grep -v "Module" \
                            | grep -v "browser" \
                            | grep -v "npm" \
                            | grep -v "Node" \
                            | grep -v "Searching" \
                            | grep -v "^$" \
                            | grep -E "Running:|✓|CYPRESS_LOG:|Passing|Tests|Duration|Fonctionnalités"

                            TEST_STATUS=$?
                            
                            echo "📊 Generating Reports..."
                            if [ -d "cypress/reports/json" ]; then
                                npx mochawesome-merge "cypress/reports/json/*.json" > "cypress/reports/mochawesome.json"
                                npx marge "cypress/reports/mochawesome.json" --reportDir "cypress/reports/html" --inline
                            else
                                echo "❌ No test results found"
                                exit 1
                            fi

                            exit $TEST_STATUS
                        '''

                        writeFile file: 'createReport.js', text: '''
const fs = require('fs');
const { jsPDF } = require('jspdf');

// Sabit renkler ve stiller
const COLORS = {
    primary: [0, 57, 166],    // Mavi
    white: [255, 255, 255],
    black: [0, 0, 0],
    gray: [247, 247, 247],
    success: [46, 184, 46],   // Yeşil
    info: [41, 128, 185],     // Açık mavi
    warning: [241, 196, 15],  // Sarı
    text: [74, 85, 104],      // Koyu gri
    border: [229, 231, 235]   // Açık gri
};

try {
    const report = JSON.parse(fs.readFileSync('cypress/reports/mochawesome.json', 'utf8'));
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Header section
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, 210, 45, 'F');

    // Title and logo space
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(28);
    doc.text("Rapport d'Execution", 20, 25);
    doc.setFontSize(20);
    doc.text("des Tests", 20, 35);

    // Date
    const dateStr = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(':', 'h');
    doc.setFontSize(12);
    doc.text(dateStr, 130, 25);

    // Summary boxes section
    const boxWidth = 40;
    const boxMargin = 15;
    let startX = 20;
    const startY = 55;

    // Function to create metric box
    const createMetricBox = (title, value, color, x, y) => {
        doc.setFillColor(...color);
        doc.roundedRect(x, y, boxWidth, 35, 3, 3, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(10);
        doc.text(title, x + 5, y + 8);
        doc.setFontSize(16);
        doc.text(value.toString(), x + 5, y + 25);
    };

    // Create metric boxes
    createMetricBox('TOTAL', report.stats.tests, COLORS.primary, startX, startY);
    createMetricBox('PASSÉS', report.stats.passes, COLORS.success, startX + boxWidth + boxMargin, startY);
    createMetricBox('ÉCHOUÉS', report.stats.failures || 0, [220, 53, 69], startX + (boxWidth + boxMargin) * 2, startY);
    createMetricBox('DURÉE', Math.round(report.stats.duration/1000) + 's', COLORS.info, startX + (boxWidth + boxMargin) * 3, startY);

    // Test details section
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(18);
    doc.text("Résultats Détaillés", 20, 110);

    let yPos = 125;

    // Function to create status badge
    const createStatusBadge = (status, x, y) => {
        const color = status ? COLORS.success : [220, 53, 69];
        const text = status ? '✓' : '✕';
        doc.setFillColor(...color);
        doc.circle(x, y, 3, 'F');
        doc.setTextColor(...color);
        doc.setFontSize(12);
        doc.text(text, x - 1.5, y + 1);
    };

    // Test results with better styling
    if (report.results && report.results.length > 0) {
        report.results[0].tests.forEach((test) => {
            // Background
            doc.setFillColor(...COLORS.gray);
            doc.roundedRect(15, yPos - 5, 180, 30, 2, 2, 'F');

            // Status and title
            createStatusBadge(test.pass, 25, yPos + 5);
            doc.setTextColor(...COLORS.black);
            doc.setFontSize(11);
            doc.text(test.title, 35, yPos + 5);

            // Duration and details
            doc.setTextColor(...COLORS.text);
            doc.setFontSize(10);
            doc.text(`Durée: ${(test.duration / 1000).toFixed(2)}s`, 35, yPos + 15);

            const testState = test.pass ? 'SUCCÈS' : 'ÉCHEC';
            doc.setTextColor(test.pass ? COLORS.success[0] : [220, 53, 69][0]);
            doc.text(testState, 160, yPos + 5);

            yPos += 35;

            if (yPos > 250) {
                doc.addPage();
                yPos = 30;
            }
        });
    }

    // Execution log section
    doc.addPage();
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(18);
    doc.text("Journal d'Exécution", 20, 17);

    // Get logs from test results
    yPos = 40;
    const logs = Array.from(new Set(
        report.results[0].tests.flatMap(test => 
            test.context ? JSON.parse(test.context).CYPRESS_LOG || [] : []
        )
    ));

    logs.forEach((log, index) => {
        doc.setFillColor(...COLORS.gray);
        doc.roundedRect(15, yPos - 5, 180, 20, 2, 2, 'F');
        
        if (log.includes('SUCCESS') || log.includes('PASSED')) {
            doc.setTextColor(...COLORS.success);
            doc.text('✓', 20, yPos + 5);
        } else if (log.includes('INFO')) {
            doc.setTextColor(...COLORS.info);
            doc.text('ℹ', 20, yPos + 5);
        }
        
        doc.setTextColor(...COLORS.black);
        doc.setFontSize(10);
        doc.text(log, 30, yPos + 5);
        yPos += 25;
    });

    // Save PDF
    doc.save(`${process.env.REPORT_DIR}/pdf/report_${process.env.TIMESTAMP}.pdf`);

} catch (err) {
    console.error('Error generating PDF report:', err);
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
                    sh 'rm -f createReport.js'
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: """
                ${REPORT_DIR}/html/**/*,
                ${REPORT_DIR}/pdf/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*
            """, allowEmptyArchive: true

            junit testResults: "${REPORT_DIR}/junit/results-*.xml", allowEmptyResults: true
        }
        success {
            echo """
                ╔══════════════════════════════════╗
                ║         Test Execution           ║
                ╚══════════════════════════════════╝
                
                ✅ Status: SUCCESS
                ⏱️ Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                
                📊 Reports Available:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
                - Videos: cypress/videos
            """
        }
        failure {
            echo """
                ╔══════════════════════════════════╗
                ║         Test Execution           ║
                ╚══════════════════════════════════╝
                
                ❌ Status: FAILED
                ⏱️ Finished: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                
                📊 Reports Available:
                - PDF: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - HTML: ${REPORT_DIR}/html/index.html
                - Videos: cypress/videos
            """
        }
        cleanup {
            cleanWs()
        }
    }
}