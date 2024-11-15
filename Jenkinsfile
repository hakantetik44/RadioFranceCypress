pipeline {
    agent any

    tools {
        nodejs 'Node.js 22.9'
    }

    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}\\.cypress-cache"
        REPORT_DIR = "cypress\\reports"
        TIMESTAMP = new Date().format('yyyy-MM-dd_HH-mm-ss')
        TEST_HISTORY_DIR = "${WORKSPACE}\\test-history"
        // Windows için karakter seti ayarları
        LANG = 'en_US.UTF-8'
        LANGUAGE = 'en_US:en'
        LC_ALL = 'en_US.UTF-8'
        // Jenkins konsolu için çıktı encoding
        JENKINS_CONSOLE_ENCODING = 'UTF-8'
    }

    stages {
        stage('Preparation') {
            steps {
                echo "[INFO] Starting the test pipeline"
                cleanWs()
                checkout scm

                bat """
                    @echo off
                    chcp 65001 > nul
                    
                    echo [INFO] Creating directories...
                    
                    if not exist "${CYPRESS_CACHE_FOLDER}" mkdir "${CYPRESS_CACHE_FOLDER}"
                    if not exist "${REPORT_DIR}\\json" mkdir "${REPORT_DIR}\\json"
                    if not exist "${REPORT_DIR}\\html" mkdir "${REPORT_DIR}\\html"
                    if not exist "${REPORT_DIR}\\pdf" mkdir "${REPORT_DIR}\\pdf"
                    if not exist "cypress\\videos" mkdir "cypress\\videos"
                    if not exist "cypress\\screenshots" mkdir "cypress\\screenshots"
                    if not exist "cypress\\logs" mkdir "cypress\\logs"
                    if not exist "${TEST_HISTORY_DIR}" mkdir "${TEST_HISTORY_DIR}"

                    if not exist "${TEST_HISTORY_DIR}\\history.csv" (
                        echo BuildNumber,Timestamp,TotalTests,PassedTests,Duration > "${TEST_HISTORY_DIR}\\history.csv"
                    )
                """
            }
        }

        stage('Installation') {
            steps {
                echo "[INFO] Installing dependencies..."

                bat """
                    @echo off
                    chcp 65001 > nul
                    
                    echo [INFO] Cleaning npm cache...
                    call npm cache clean --force
                    
                    echo [INFO] Installing npm packages...
                    call npm ci || call npm install
                    
                    echo [INFO] Installing Cypress dependencies...
                    call npm install --save-dev cypress-multi-reporters mocha-junit-reporter mochawesome mochawesome-merge mochawesome-report-generator puppeteer markdown-pdf
                """

                writeFile file: 'reporter-config.json', text: '''
                    {
                        "reporterEnabled": "spec, mocha-junit-reporter, mochawesome",
                        "mochaJunitReporterReporterOptions": {
                            "mochaFile": "cypress/reports/junit/results-[hash].xml"
                        },
                        "mochawesomeReporterOptions": {
                            "reportDir": "cypress/reports/json",
                            "overwrite": false,
                            "html": true,
                            "json": true,
                            "timestamp": true,
                            "reportTitle": "France Culture Test Results"
                        }
                    }
                '''

                writeFile file: 'generateReport.js', text: '''
                    const fs = require('fs');
                    const puppeteer = require('puppeteer');
                    // ... (generateReport.js içeriğinin geri kalanı aynı kalacak)
                '''
            }
        }

        stage('Tests') {
            steps {
                script {
                    try {
                        echo "[INFO] Running Cypress tests..."

                        bat """
                            @echo off
                            chcp 65001 > nul
                            
                            echo [INFO] Setting up Cypress environment...
                            set VERIFY_TIMEOUT=120000
                            call npx cypress verify

                            echo [INFO] Running Cypress tests...
                            set CYPRESS_VERIFY_TIMEOUT=120000
                            call npx cypress run ^
                                --browser chrome ^
                                --headless ^
                                --config video=true ^
                                --reporter cypress-multi-reporters ^
                                --reporter-options configFile=reporter-config.json

                            echo [INFO] Generating reports...
                            call npx mochawesome-merge "%REPORT_DIR%\\json\\*.json" > "%REPORT_DIR%\\mochawesome.json"
                            
                            echo [INFO] Creating HTML report...
                            call npx marge "%REPORT_DIR%\\mochawesome.json" ^
                                --reportDir "%REPORT_DIR%\\html" ^
                                --inline ^
                                --charts ^
                                --title "France Culture Test Results"

                            echo [INFO] Generating PDF report...
                            call node generateReport.js
                        """
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error "[ERROR] Tests failed: ${e.getMessage()}"
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '''
                cypress/reports/html/**/*,
                cypress/reports/pdf/**/*,
                cypress/videos/**/*,
                cypress/screenshots/**/*
            ''', allowEmptyArchive: true

            junit allowEmptyResults: true, testResults: 'cypress/reports/junit/*.xml'
        }
        success {
            echo """
                [SUCCESS] Test Summary:
                - Status: SUCCESS
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Report PDF: cypress/reports/pdf/report.pdf
            """
        }
        failure {
            echo """
                [ERROR] Test Summary:
                - Status: FAILED
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Check the reports for details
            """
        }
        cleanup {
            cleanWs()
        }
    }
}