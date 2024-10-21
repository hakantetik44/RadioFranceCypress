pipeline {
    agent any

    tools {
        nodejs 'Node14'  // Assurez-vous que 'Node14' est configuré dans les outils Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/hakantetik44/RadioFranceCypress.git', branch: 'main'
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh 'node -v'
                sh 'npm -v'
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