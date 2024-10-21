pipeline {
    agent any 
    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/hakantetik44/RadioFranceCypress.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Run Cypress Tests') {
            steps {
                // Cypress'i belirli bir test dosyasıyla çalıştırma
                sh 'npx cypress run --spec "cypress/e2e/RadioFrance.cy.js"'
            }
        }
    }
    post {
        always {
            // Test sonuçlarını burada işle
            junit '**/cypress/results/*.xml' // Eğer XML raporları oluşturuyorsanız
        }
    }
}