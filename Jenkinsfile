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
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --config defaultCommandTimeout=60000 \
                            | tee cypress_output.log
                        '''
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("Cypress tests failed: ${e.message}")
                    } finally {
                        echo "Cypress Test Sonuçları:"
                        sh '''
                            cat cypress_output.log | \
                            sed -e 's/\\x1b\\[[0-9;]*m//g' | \
                            grep -E "^(Running:|\\s*✓|\\s*✖|Page|Cookies|Titre|Menu|Lien|Tests:|Passing:|Failing:|Pending:|Skipped:|Duration:|Spec Ran:)" | \
                            sed -e 's/^[[:space:]]*//' | \
                            sed -e 's/^Running:/Test Dosyası:/' | \
                            sed -e 's/^✓/[BAŞARILI]/' | \
                            sed -e 's/^✖/[BAŞARISIZ]/'
                        '''
                    }
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'cypress/videos/**/*.mp4,cypress/screenshots/**/*.png,cypress_output.log', allowEmptyArchive: true
        }
        success {
            echo "Tüm testler başarıyla geçti!"
        }
        failure {
            echo "Testler başarısız oldu. Lütfen logları kontrol edin."
        }
        cleanup {
            cleanWs()
        }
    }
}