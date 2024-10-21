pipeline {
    agent any 

    environment {
        NODEJS_HOME = tool('NodeJS') // Node.js kurulum yolunu belirtiyoruz
    }

    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    // Node.js bağımlılıklarını yüklüyoruz
                    sh "${NODEJS_HOME}/bin/npm install"
                }
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                script {
                    // Cypress testlerini çalıştırıyoruz
                    sh """
                        npx cypress run --browser electron --headless --reporter junit --reporter-options 'mochaFile=cypress/results/results-[hash].xml'
                    """
                }
            }
        }
        
        stage('Archive Results') {
            steps {
                // JUnit raporlarını arşivliyoruz
                junit 'cypress/results/*.xml'
            }
        }
    }

    post {
        always {
            // Her durumda log dosyalarını temizliyoruz
            cleanWs()
        }
        success {
            echo 'Tests ran successfully!'
        }
        failure {
            echo 'There were failures in the tests.'
        }
    }
}
