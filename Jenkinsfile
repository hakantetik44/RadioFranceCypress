pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        CYPRESS_CONFIG_FILE = "${WORKSPACE}/cypress.json"
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
        
        stage('Run Cypress Tests') {
            steps {
                sh 'CYPRESS_INSTALL_BINARY=0 npx cypress run --headless --browser electron --reporter junit --reporter-options "mochaFile=cypress/results/results-[hash].xml"'
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
