pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Kaynak kodu alınıyor...'
                git url: 'https://github.com/hakantetik44/RadioFranceCypress.git'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Bağımlılıklar yükleniyor...'
                sh 'npm ci'
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                script {
                    echo 'Cypress testleri başlatılıyor...'
                    sh 'npx cypress run --browser electron --headless --reporter mocha --reporter-options reportDir=cypress/results,overwrite=false,html=false,json=true --config defaultCommandTimeout=60000'
                    echo 'Cypress testleri tamamlandı.'
                }
            }
        }
    }

    post {
        always {
            echo 'Jenkins job tamamlandı.'
        }
    }
}
