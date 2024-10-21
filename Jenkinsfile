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
                sh 'node -v || echo "Node.js is not installed"'
                sh 'npm -v || echo "npm is not installed"'
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