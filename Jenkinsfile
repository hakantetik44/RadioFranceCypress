pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
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
                            sed -e '/^$/d' | \
                            sed -e '/^Opening Cypress/d' | \
                            sed -e '/^DevTools listening/d' | \
                            sed -e '/^Opening.*failed/d' | \
                            sed -e '/^tput:/d' | \
                            sed -e '/^===/d' | \
                            sed -e '/^  (Run Starting)/d' | \
                            sed -e '/^  │/d' | \
                            sed -e '/^  └/d' | \
                            sed -e 's/^  Running:/Test Dosyası:/' | \
                            grep -E "^(Test Dosyası:|\\s*✓|\\s*✖|describe|it|\\d+\\))" | \
                            sed -e 's/^[[:space:]]*//' | \
                            sed -e 's/^✓/[BAŞARILI]/' | \
                            sed -e 's/^✖/[BAŞARISIZ]/' | \
                            sed -e 's/^describe/Test Grubu:/' | \
                            sed -e 's/^it/Test:/' | \
                            sed -e 's/^[0-9])/Test /'
                        '''
                        
                        echo "Test Özeti:"
                        sh '''
                            cat cypress_output.log | \
                            sed -e 's/\\x1b\\[[0-9;]*m//g' | \
                            grep -E "^\\s*(✓|✖|passing|failing|pending|duration)" | \
                            sed -e 's/^[[:space:]]*//' | \
                            sed -e 's/passing/Geçen Test Sayısı:/' | \
                            sed -e 's/failing/Başarısız Test Sayısı:/' | \
                            sed -e 's/pending/Bekleyen Test Sayısı:/' | \
                            sed -e 's/duration/Toplam Süre:/'
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
            echo "Tüm testler başarıyla tamamlandı!"
        }
        failure {
            echo "Testlerde hatalar var. Lütfen log dosyalarını kontrol edin."
        }
        cleanup {
            cleanWs()
        }
    }
}