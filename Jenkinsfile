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
        TEST_LOGS = "test_execution_logs.txt"
    }

    stages {
        stage('Preparation') {
            steps {
                script {
                    echo "🚀 Starting the test pipeline"
                    echo "⚙️ Setting up the environment..."
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
                    npm ci
                    npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator cypress-multi-reporters mocha-junit-reporter jspdf
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "🧪 Running Cypress tests..."

                        // Run tests and capture all logs
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            2>&1 | tee ${TEST_LOGS}
                        """

                        // Generate PDF Report with detailed logs
                        writeFile file: 'createReport.js', text: """
                            const fs = require('fs');
                            const { jsPDF } = require('jspdf');

                            try {
                                const testLogs = fs.readFileSync('${TEST_LOGS}', 'utf8');
                                const doc = new jsPDF();
                                let currentPage = 1;

                                // Helper function for headers
                                function addPageHeader(title, subtitle = '') {
                                    doc.setFillColor(41, 128, 185);
                                    doc.rect(0, 0, 220, 40, 'F');
                                    doc.setTextColor(255, 255, 255);
                                    doc.setFontSize(24);
                                    doc.text(title, 20, 25);
                                    if (subtitle) {
                                        doc.setFontSize(14);
                                        doc.text(subtitle, 20, 35);
                                    }
                                }

                                // Helper function for footers
                                function addPageFooter() {
                                    const pages = doc.internal.getNumberOfPages();
                                    doc.setTextColor(128, 128, 128);
                                    doc.setFontSize(10);
                                    doc.text(
                                        'Page ' + currentPage + ' of ' + pages,
                                        doc.internal.pageSize.width - 20,
                                        doc.internal.pageSize.height - 10,
                                        { align: 'right' }
                                    );
                                    currentPage++;
                                }

                                // Cover Page
                                addPageHeader('Test Automation Report', 'France Culture Test Suite');
                                
                                // Build Information Box
                                doc.setDrawColor(41, 128, 185);
                                doc.setFillColor(240, 248, 255);
                                doc.roundedRect(20, 50, 170, 60, 3, 3, 'FD');
                                doc.setFontSize(12);
                                doc.setTextColor(44, 62, 80);
                                const buildInfo = [
                                    '📅 Execution Date: ${TIMESTAMP}',
                                    '🔄 Build Number: ' + process.env.BUILD_NUMBER,
                                    '📝 Commit Message: ${GIT_COMMIT_MSG}',
                                    '👤 Author: ${GIT_AUTHOR}'
                                ];
                                doc.text(buildInfo, 30, 65);
                                addPageFooter();

                                // Test Results Page
                                doc.addPage();
                                addPageHeader('Test Results', 'Detailed Execution Summary');

                                // Parse and display test results
                                const logLines = testLogs.split('\\n');
                                let yPosition = 50;
                                let isTestCase = false;

                                logLines.forEach(line => {
                                    if (line.includes('CYPRESS_LOG:')) {
                                        // Custom log messages
                                        const logMessage = line.replace('CYPRESS_LOG:', '').trim();
                                        if (yPosition > 270) {
                                            doc.addPage();
                                            addPageHeader('Test Results', 'Detailed Execution Summary');
                                            yPosition = 50;
                                        }
                                        doc.setTextColor(41, 128, 185);
                                        doc.setFontSize(10);
                                        doc.text('🔍 ' + logMessage, 25, yPosition);
                                        yPosition += 8;
                                    } else if (line.includes('✓')) {
                                        // Passed test cases
                                        if (yPosition > 270) {
                                            doc.addPage();
                                            addPageHeader('Test Results', 'Detailed Execution Summary');
                                            yPosition = 50;
                                        }
                                        doc.setTextColor(46, 204, 113);
                                        doc.setFontSize(11);
                                        doc.text('✓ ' + line.replace('✓', '').trim(), 25, yPosition);
                                        yPosition += 10;
                                    } else if (line.includes('Running:')) {
                                        if (yPosition > 270) {
                                            doc.addPage();
                                            addPageHeader('Test Results', 'Detailed Execution Summary');
                                            yPosition = 50;
                                        }
                                        doc.setTextColor(52, 73, 94);
                                        doc.setFontSize(12);
                                        doc.text('📋 ' + line.trim(), 20, yPosition);
                                        yPosition += 10;
                                    }
                                });
                                addPageFooter();

                                // Statistics Page
                                doc.addPage();
                                addPageHeader('Test Statistics', 'Performance Metrics');

                                // Extract and display test statistics
                                const statsMatch = testLogs.match(/Tests:\\s+(\\d+).*Passing:\\s+(\\d+).*Failing:\\s+(\\d+).*Duration:\\s+(\\d+)/s);
                                if (statsMatch) {
                                    const [_, total, passing, failing, duration] = statsMatch;
                                    
                                    function drawStatBox(label, value, x, y, color, icon) {
                                        doc.setDrawColor(...color);
                                        doc.setFillColor(255, 255, 255);
                                        doc.roundedRect(x, y, 80, 40, 3, 3, 'FD');
                                        doc.setTextColor(...color);
                                        doc.setFontSize(12);
                                        doc.text(icon + ' ' + label, x + 5, y + 15);
                                        doc.setFontSize(20);
                                        doc.text(value.toString(), x + 5, y + 35);
                                    }

                                    drawStatBox('Total Tests', total, 20, 50, [52, 73, 94], '📊');
                                    drawStatBox('Passed', passing, 110, 50, [46, 204, 113], '✅');
                                    drawStatBox('Failed', failing, 20, 100, [231, 76, 60], '❌');
                                    drawStatBox('Duration', duration + 's', 110, 100, [52, 152, 219], '⏱');
                                }
                                addPageFooter();

                                // Screenshots Page (if any)
                                if (fs.existsSync('cypress/screenshots')) {
                                    doc.addPage();
                                    addPageHeader('Test Screenshots', 'Visual Evidence');
                                    doc.setTextColor(44, 62, 80);
                                    doc.setFontSize(12);
                                    doc.text('Screenshots are available in the artifacts directory:', 20, 50);
                                    doc.text('cypress/screenshots/', 20, 65);
                                    addPageFooter();
                                }

                                // Video Recording Info
                                doc.addPage();
                                addPageHeader('Test Recordings', 'Video Documentation');
                                doc.setTextColor(44, 62, 80);
                                doc.setFontSize(12);
                                doc.text('Test execution video is available at:', 20, 50);
                                doc.text('cypress/videos/RadioFrance.cy.js.mp4', 20, 65);
                                addPageFooter();

                                doc.save('${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf');
                            } catch (err) {
                                console.error(err);
                                process.exit(1);
                            }
                        """

                        // Generate reports
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
                        rm -f createReport.js
                        rm -f ${TEST_LOGS}
                    '''
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
                ✅ Test Summary:
                - Status: SUCCESS
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - PDF Report: ${REPORT_DIR}/pdf/report_${TIMESTAMP}.pdf
                - Videos: cypress/videos
            """
        }
        failure {
            echo """
                ❌ Test Summary:
                - Status: FAILED
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Check the reports for more details
            """
        }
        cleanup {
            cleanWs()
        }
    }
}