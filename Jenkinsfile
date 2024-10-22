pipeline {
    agent any

    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        NODEJS_VERSION = 'Node.js_22.9'  // Node.js versiyonu belirtiliyor
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/hakantetik44/RadioFranceCypress.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    // NodeJS versiyonu belirleme
                    def nodejs = tool name: "${NODEJS_VERSION}", type: 'NodeJSInstallation'
                    env.PATH = "${nodejs}/bin:${env.PATH}"
                }
                sh 'npm ci'
            }
        }

        stage('Prepare Cypress Cache') {
            steps {
                sh 'mkdir -p ${CYPRESS_CACHE_FOLDER}'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    // Cypress komutunu çalıştır ve çıktıyı log dosyasına kaydet
                    def testResults = sh(script: 'npx cypress run --browser electron --headless --config defaultCommandTimeout=60000 | tee cypress_output.log', returnStdout: true)

                    // Test çıktısını düzenle ve daha anlaşılır hale getir
                    sh """
                    cat cypress_output.log | \
                    sed -e 's/\\x1b\\[[0-9;]*m//g' | \
                    sed -e '/^$/d' | \
                    sed -e 's/^it/Test:/; s/^describe/Test Grubu:/; s/^  Running:/Test Dosyası:/; s/^✖/[BAŞARISIZ]/; s/^✓/[BAŞARILI]/' | \
                    sed -e '/^DevTools listening/d; /^Opening Cypress/d; /^Opening.*failed/d' | \
                    sed -e '/^tput:/d; /^===/d'
                    """
                    
                    // Test sonuçlarını ekrana yazdır
                    echo "Cypress Test Sonuçları:\n${testResults}"
                }
            }
        }
    }

    post {
        always {
            // Her durumda çalışacak adımlar
            junit '**/cypress_output.log'  // Test sonuçlarını JUnit formatında sakla
            cleanWs()  // Çalışma alanını temizle
        }
    }
}
