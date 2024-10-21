pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/hakantetik44/RadioFranceCypress.git', branch: 'main'
            }
        }

        stage('Install Node.js') {
            steps {
                // Node.js kurulumu için gerekli komut
                sh '''
                curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
                sudo apt-get install -y nodejs
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                // NPM ile gerekli bağımlılıkları yükleme
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
