pipeline {
    agent any

    stages {
        stage('Checkout SCM') {
            steps {
                script {
                    // Git reposunu çek
                    checkout scm
                }
            }
        }

        stage('Preparation') {
            steps {
                script {
                    // Gerekli dizinleri oluştur
                    sh 'mkdir -p .cypress-cache'
                    sh 'mkdir -p cypress/reports/json cypress/reports/html cypress/reports/pdf cypress/reports/junit'
                    sh 'mkdir -p cypress/videos cypress/screenshots'
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo '📦 Installing dependencies...'
                    // npm ile bağımlılıkları yükle
                    sh 'npm ci'
                    sh 'npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator mocha-junit-reporter cypress-image-snapshot jspdf'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    echo '🧪 Running Cypress tests...'
                    // Cypress testlerini çalıştır
                    sh 'npx cypress run --browser electron --headless --reporter mochawesome --reporter-options configFile=reporter-config.json | tee cypress-output.txt'
                }
            }
        }

        stage('Generate Report') {
            steps {
                script {
                    // Rapor oluşturma
                    sh 'node createReport.js'
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo '✅ All tests passed!'
        }
        failure {
            echo '❌ Test summary: FAILED'
        }
    }
}
