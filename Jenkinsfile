pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS' // Assurez-vous que 'NodeJS' est configuré dans les outils Jenkins
    }

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