pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/hakantetik44/RadioFranceCypress.git', branch: 'main'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                sh 'npx cypress run --reporter mocha-junit-reporter --reporter-options "mochaFile=cypress/results/results.xml,toConsole=true"'
            }
        }
    }
    
    post {
        always {
            junit 'cypress/results/*.xml'
        }
    }
}