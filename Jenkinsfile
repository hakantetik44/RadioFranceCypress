pipeline {
    agent any
    tools {
        nodejs 'Node.js 22.9' // Global Tool Configuration'daki isimle eşleşmeli
    }
    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/hakantetik44/RadioFranceCypress.git', branch: 'main'
            }
        }
        stage('Verify Node.js and npm') {
            steps {
                sh '''
                    echo "PATH = $PATH"
                    node -v || echo "Node.js çalıştırılamadı"
                    npm -v || echo "npm çalıştırılamadı"
                    which node
                    which npm
                '''
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install --no-optional'
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
            junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
        }
    }
}
