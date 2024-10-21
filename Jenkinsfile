pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/hakantetik44/RadioFranceCypress.git', branch: 'main'
            }
        }
        
        stage('Verify Node.js and npm') {
            steps {
                sh '''
                    echo "PATH = $PATH"
                    which node || echo "Node.js not found in PATH"
                    which npm || echo "npm not found in PATH"
                    node -v || echo "Node.js is not installed or not accessible"
                    npm -v || echo "npm is not installed or not accessible"
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    npm install || (echo "npm install failed. Trying with sudo..." && sudo npm install)
                '''
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                sh '''
                    npx cypress run --reporter junit --reporter-options "mochaFile=cypress/results/results-[hash].xml" || echo "Cypress tests failed"
                '''
            }
        }
    }
    
    post {
        always {
            junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
        }
    }
}