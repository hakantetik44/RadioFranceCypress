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
                sh '''
                    npx cypress verify || exit 0
                    npx cypress run \
                    --browser electron \
                    --headless \
                    --reporter mochawesome \
                    --reporter-options "reportDir=cypress/results,overwrite=false,html=true,json=true,reportFilename=report" \
                    --config defaultCommandTimeout=60000
                '''
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
                reportName: 'Cypress Test Report'
            ])
        }
        cleanup {
            cleanWs()
        }
    }
}