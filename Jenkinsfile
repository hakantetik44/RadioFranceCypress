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
                sh 'npm install || { echo "npm not found, exiting."; exit 1; }'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                sh 'npx cypress run || { echo "Cypress tests failed."; exit 1; }'
            }
        }
    }

    post {
        always {
            junit 'cypress/results/*.xml'
        }
    }
}
