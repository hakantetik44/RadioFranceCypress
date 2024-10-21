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
                sh 'npm install'
            }
        }
        stage('Run Cypress Tests') {
            steps {
                sh 'npx cypress run --spec "cypress/e2e/RadioFrance.cy.js"'
            }
        }
    }
    post {
        always {
            junit '**/cypress/results/*.xml'
        }
    }
}
