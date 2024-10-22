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
                        echo "Cypress Testleri Başlıyor..."
                        
                        def testOutput = sh(
                            script: '''
                                npx cypress run \
                                --browser electron \
                                --headless \
                                --config defaultCommandTimeout=60000
                            ''',
                            returnStdout: true
                        ).trim()
                        
                        def testResults = testOutput.split('\n').findAll { line ->
                            line.contains('Page France Culture chargée') ||
                            line.contains('Cookies acceptés') ||
                            line.contains('Menu principal trouvé') ||
                            line.contains('Lien de recherche trouvé') ||
                            line.contains('Tests:') ||
                            line.contains('Passing:') ||
                            line.contains('Failing:') ||
                            line.contains('Duration:')
                        }.collect { line ->
                            line = line.replaceAll(/\x1B\[[0-9;]*[mGK]/, '')  // ANSI kodlarını temizle
                            line = line.trim()
                            
                            // Türkçe çeviriler
                            line = line.replaceAll(/^Tests:/, 'Toplam Test:')
                            line = line.replaceAll(/Passing:/, 'Başarılı:')
                            line = line.replaceAll(/Failing:/, 'Başarısız:')
                            line = line.replaceAll(/Duration:/, 'Süre:')
                            
                            return "→ ${line}"
                        }
                        
                        echo "Test Sonuçları:"
                        testResults.each { result ->
                            echo result
                        }
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("Cypress testleri başarısız: ${e.message}")
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo """
                ✅ Test Özeti:
                - Build Durumu: BAŞARILI
                - Tamamlanma Zamanı: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                """
            }
        }
        failure {
            script {
                echo """
                ❌ Test Özeti:
                - Build Durumu: BAŞARISIZ
                - Tamamlanma Zamanı: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Lütfen hata detayları için logları kontrol edin
                """
            }
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