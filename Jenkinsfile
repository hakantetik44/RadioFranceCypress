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
                wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'xterm']) {
                    script {
                        try {
                            def testOutput = sh(
                                script: '''
                                    npx cypress run \
                                    --browser electron \
                                    --headless \
                                    --config defaultCommandTimeout=60000
                                ''',
                                returnStdout: true
                            ).trim()

                            echo "Test Çıktıları:"
                            def cleanOutput = testOutput.replaceAll(/\x1B\[[0-9;]*[mK]/, '')  // ANSI kodlarını kaldır
                                                      .readLines()
                                                      .findAll { line ->
                                                          line.contains('✓') ||
                                                          line.contains('✖') ||
                                                          line.contains('Running:') ||
                                                          line.contains('passing') ||
                                                          line.contains('failing') ||
                                                          line.contains('pending') ||
                                                          line.contains('duration')
                                                      }
                                                      .collect { line ->
                                                          line = line.trim()
                                                          line = line.replaceAll(/^Running:/, 'Test Dosyası:')
                                                          line = line.replaceAll(/^✓/, '[BAŞARILI]')
                                                          line = line.replaceAll(/^✖/, '[BAŞARISIZ]')
                                                          line = line.replaceAll(/passing/, 'Geçen Test Sayısı:')
                                                          line = line.replaceAll(/failing/, 'Başarısız Test Sayısı:')
                                                          line = line.replaceAll(/pending/, 'Bekleyen Test Sayısı:')
                                                          line = line.replaceAll(/duration/, 'Toplam Süre:')
                                                          return line
                                                      }
                                                      .join('\n')

                            echo cleanOutput
                        } catch (Exception e) {
                            error("Cypress testleri başarısız oldu: ${e.message}")
                        }
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "Tüm testler başarıyla tamamlandı!"
            
            script {
                // Test sonuçlarını kaydet
                sh 'mkdir -p cypress/results'
                sh 'touch cypress/results/test-summary.txt'
                sh 'echo "Test Başarılı - $(date)" > cypress/results/test-summary.txt'
            }
            
            // Test sonuçlarını arşivle
            archiveArtifacts artifacts: '''
                cypress/videos/**/*.mp4,
                cypress/screenshots/**/*.png,
                cypress/results/test-summary.txt
            ''', allowEmptyArchive: true
        }
        failure {
            echo "Testlerde hatalar var! Detaylı bilgi için logları kontrol edin."
            
            script {
                // Hata detaylarını kaydet
                sh 'mkdir -p cypress/results'
                sh 'touch cypress/results/test-failures.txt'
                sh 'echo "Test Başarısız - $(date)" > cypress/results/test-failures.txt'
            }
            
            // Hata raporlarını arşivle
            archiveArtifacts artifacts: '''
                cypress/videos/**/*.mp4,
                cypress/screenshots/**/*.png,
                cypress/results/test-failures.txt
            ''', allowEmptyArchive: true
        }
        cleanup {
            cleanWs(
                cleanWhenSuccess: true,
                cleanWhenFailure: true,
                cleanWhenAborted: true
            )
        }
    }
}