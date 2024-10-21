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
                // Node.js ve npm'in zaten kurulu olduğunu varsayıyoruz
                // Eğer kurulu değilse, sunucuya manuel olarak kurulum yapmanız gerekebilir
                sh 'npm install'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                // Cypress testini çalıştırma
                sh 'npx cypress run --spec "cypress/e2e/RadioFrance.cy.js"'
            }
        }
    }

    post {
        always {
            junit 'cypress/results/*.xml' // Test sonuçlarını kaydetme
        }
    }
}
