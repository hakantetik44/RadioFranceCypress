pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        TERM = 'dumb'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Prepare Cypress Cache') {
            steps {
                sh 'mkdir -p $CYPRESS_CACHE_FOLDER'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    def testResult = sh(script: '''
                        npx cypress verify || exit 0
                        npx cypress run \
                        --browser electron \
                        --headless \
                        --reporter mochawesome \
                        --reporter-options "reportDir=cypress/results,overwrite=false,html=true,json=true,reportFilename=report" \
                        --config defaultCommandTimeout=60000
                    ''', returnStdout: true)
                    
                    echo "Cypress Test Sonuçları:"
                    echo testResult
                    
                    // Mochawesome raporunu oku ve ekrana yazdır
                    def reportContent = readFile('cypress/results/report.json')
                    def report = readJSON text: reportContent
                    
                    echo "Test Özeti:"
                    echo "Toplam Test Sayısı: ${report.stats.tests}"
                    echo "Başarılı Test Sayısı: ${report.stats.passes}"
                    echo "Başarısız Test Sayısı: ${report.stats.failures}"
                    
                    report.results[0].suites[0].tests.each { test ->
                        echo "Test: ${test.title}"
                        echo "Durum: ${test.pass ? 'Başarılı' : 'Başarısız'}"
                        echo "Süre: ${test.duration} ms"
                        echo "---"
                    }
                }
            }
        }
    }
    
    post {
        always {
            publishHTML(target: [
                allowMissing: false,
                alwaysLinkToLastBuild: false,
                keepAll: true,
                reportDir: 'cypress/results',
                reportFiles: 'report.html',
                reportName: 'Cypress Test Raporu'
            ])
        }
        cleanup {
            cleanWs()
        }
    }
}