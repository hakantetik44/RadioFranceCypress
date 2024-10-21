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
                    try {
                        sh '''
                            npx cypress verify
                            CYPRESS_CONSOLE_OUTPUT=true npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter mochawesome \
                            --reporter-options reportDir=cypress/results,overwrite=false,html=true,json=true \
                            --config defaultCommandTimeout=60000 \
                            | tee cypress_output.log
                        '''
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("Cypress tests failed: ${e.message}")
                    } finally {
                        echo "Cypress Test Çıktıları:"
                        sh 'cat cypress_output.log'
                    }
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'cypress/videos/**/*.mp4,cypress/screenshots/**/*.png,cypress/results/**/*,cypress_output.log', allowEmptyArchive: true
        }
        success {
            echo "Tests passed successfully!"
        }
        failure {
            echo "Tests failed. Check the logs for more details."
        }
        cleanup {
            cleanWs()
        }
    }
} 