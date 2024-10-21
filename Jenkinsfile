pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/hakantetik44/RadioFranceCypress.git', branch: 'main'
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh 'which node || echo "Node.js not found"'
                sh 'which npm || echo "npm not found"'
                sh 'node -v || echo "Node.js not available"'
                sh 'npm -v || echo "npm not available"'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                sh 'npx cypress run --reporter junit --reporter-options "mochaFile=cypress/results/results-[hash].xml"'
            }
        }
    }
    
    post {
        always {
            junit 'cypress/results/*.xml'
        }
    }
}