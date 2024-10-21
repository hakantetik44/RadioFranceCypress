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
        
        stage('Debug Info') {
            steps {
                sh '''
                    echo "PATH = $PATH"
                    node -v
                    npm -v
                    npx cypress --version
                    pwd
                    ls -la
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Cypress Verify') {
            steps {
                sh 'npx cypress verify'
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                sh '''
                    npx cypress run \
                    --browser electron \
                    --headless \
                    --reporter junit \
                    --reporter-options "mochaFile=cypress/results/results-[hash].xml"
                '''
            }
        }
    }
    
    post {
        always {
            junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
        }
        failure {
            archiveArtifacts artifacts: 'cypress/screenshots/**/*.png,cypress/videos/**/*.mp4', allowEmptyArchive: true
        }
        cleanup {
            cleanWs()
        }
    }
}