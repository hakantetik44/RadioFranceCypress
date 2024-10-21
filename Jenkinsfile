pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
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
                // Cypress cache klasörünü oluştur
                sh 'mkdir -p $CYPRESS_CACHE_FOLDER'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                sh '''
                    npx cypress verify || exit 0  # Cypress'i doğrulamak için
                    npx cypress run \
                    --browser electron \
                    --headless \
                    --reporter mocha \
                    --reporter-options "reportDir=cypress/results,overwrite=false,html=false,json=true" \
                    --config defaultCommandTimeout=60000
                '''
            }
        }
    }
    
    post {
        always {
            junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
        }
        cleanup {
            cleanWs()
        }
    }
}
