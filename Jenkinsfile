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
                // Node.js ve npm'in kurulu olduğunu varsayıyoruz
                sh 'npm install || { echo "npm not found, exiting."; exit 1; }'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                sh 'npx cypress run --spec "cypress/e2e/RadioFrance.cy.js" || { echo "Cypress tests failed."; exit 1; }'
            }
        }
    }

    post {
        always {
            junit 'cypress/results/*.xml'
        }
    }
}
