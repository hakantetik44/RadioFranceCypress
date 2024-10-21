pipeline {
    agent any 

    environment {
        NODEJS_HOME = tool('NodeJS') // Node.js kurulum yolunu belirtiyoruz
    }

    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    sh "${NODEJS_HOME}/bin/npm install"
                }
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                script {
                    sh """
                        npx cypress run --browser electron --headless --reporter junit --reporter-options 'mochaFile=cypress/results/results-[hash].xml'
                    """
                }
            }
        }
        
        stage('Archive Results') {
            steps {
                junit 'cypress/results/*.xml'
            }
        }
    }

    post {
        always {
            script {
                // İşlemler tamamlandıktan sonra workspace'yi temizliyoruz
                cleanWs()
            }
        }
        success {
            echo 'Tests ran successfully!'
        }
        failure {
            echo 'There were failures in the tests.'
        }
    }
}
