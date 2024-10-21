pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        TERM = 'dumb'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Prepare Cypress Cache') {
            steps {
                sh 'mkdir -p $CYPRESS_CACHE_FOLDER'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    // Cypress testlerini çalıştırırken çıktıların konsolda görünmesini sağla
                    def testResult = sh(script: '''
                        npx cypress verify || exit 0
                        npx cypress run \
                        --browser electron \
                        --headless \
                        --reporter mocha-junit-reporter \
                        --reporter-options "mochaFile=cypress/results/junit-results.xml" \
                        --config defaultCommandTimeout=60000 \
                        --quiet
                    ''', returnStdout: true)
                    
                    echo testResult
                }
            }
        }
    }
    
    post {
        always {
            junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
        }
        cleanup {
            cleanWs()
        }
    }
}
