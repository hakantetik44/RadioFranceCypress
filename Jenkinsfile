pipeline {
    agent any

    tools {
        nodejs 'Node.js 22.9' // Kullanılacak Node.js versiyonu
    }
    environment {
        TERM = 'xterm' // Terminal ayarları
    }
    stages {
        stage('🔄 Clean Workspace') {
            steps {
                script {
                    echo "🧹 Cleaning up workspace..."
                    cleanWs() // Workspace temizleme
                    echo "🗑️ Workspace cleaned."
                }
            }
        }

        stage('📥 Checkout Code') {
            steps {
                script {
                    echo "📥 Checking out code from repository..."
                    checkout scm // Kaynak kodu kontrol etme
                    echo "✅ Code checked out."
                }
            }
        }

        stage('🛠️ Setup Environment') {
            steps {
                script {
                    echo "🌍 Setting up environment..."
                    // Node.js kurulumu (belirtilen versiyonda)
                    echo "📦 Installing Node.js..."
                    sh '''
                    curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                    '''
                    echo "✅ Node.js installed."
                }
            }
        }

        stage('📦 Install Dependencies') {
            steps {
                script {
                    echo "🔍 Installing dependencies..."
                    sh 'npm install' // Bağımlılıkları yükleme
                    echo "✅ Dependencies installed."
                }
            }
        }

        stage('⚙️ Build Project') {
            steps {
                script {
                    echo "🔧 Building the project..."
                    sh 'npm run build' // Projeyi derleme
                    echo "✅ Project built successfully."
                }
            }
        }

        stage('🚀 Run Tests') {
            steps {
                script {
                    echo "🚀 Starting tests..."
                    try {
                        sh '''
                        #!/bin/bash
                        set -e
                        echo "🔍 Running Cypress tests..."
                        npx cypress run --headless --browser chrome // Cypress testlerini çalıştırma
                        '''
                    } catch (Exception e) {
                        echo "❌ Tests failed: ${e.message}"
                        currentBuild.result = 'FAILURE' // Testler başarısız olursa durumu ayarlama
                    }
                    echo "✅ Tests completed."
                }
            }
        }

        stage('📊 Analyze Results') {
            steps {
                script {
                    echo "📊 Analyzing test results..."
                    sh 'npm run test:report' // Test raporlarını analiz etme
                    echo "✅ Results analyzed."
                }
            }
        }

        stage('📦 Package Application') {
            steps {
                script {
                    echo "📦 Packaging the application..."
                    sh 'npm run package' // Uygulamayı paketleme
                    echo "✅ Application packaged."
                }
            }
        }

        stage('🚀 Deploy to Staging') {
            steps {
                script {
                    echo "🚀 Deploying to staging environment..."
                    sh '''
                    echo "🔄 Deploying..."
                    ./deploy.sh staging // Staging ortamına dağıtım
                    '''
                    echo "✅ Deployed to staging."
                }
            }
        }

        stage('📦 Publish Artifacts') {
            steps {
                script {
                    echo "📦 Publishing artifacts..."
                    archiveArtifacts artifacts: '**/dist/**/*', fingerprint: true // Artifact'leri yayınlama
                    echo "✅ Artifacts published."
                }
            }
        }

        stage('🔧 Perform Lint Checks') {
            steps {
                script {
                    echo "🔧 Running lint checks..."
                    sh 'npm run lint' // Lint kontrolleri yapma
                    echo "✅ Lint checks passed."
                }
            }
        }

        stage('🧹 Cleanup Resources') {
            steps {
                script {
                    echo "🧹 Cleaning up resources..."
                    sh 'rm -rf node_modules' // Node modüllerini silme
                    echo "✅ Resources cleaned up."
                }
            }
        }

        stage('🔔 Final Notifications') {
            steps {
                script {
                    echo "🔔 Sending notifications..."
                    // Örnek bildirim komutu
                    sh 'curl -X POST -H "Content-Type: application/json" -d \'{"text": "Build complete!"}\' https://hooks.slack.com/services/...' 
                    echo "✅ Notifications sent."
                }
            }
        }
    }

    post {
        always {
            echo "📦 Archiving test results..."
            archiveArtifacts artifacts: '''
                cypress/reports/html/*,
                cypress/reports/pdf/*,
                cypress/videos/*,
                cypress/screenshots/**/*
            ''', allowEmptyArchive: true // Test sonuçlarını arşivleme

            junit allowEmptyResults: true, testResults: 'cypress/reports/junit/*.xml' // JUnit sonuçlarını analiz etme
        }
        success {
            echo """
                ✅ Test Summary:
                - Status: SUCCESS
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Report PDF: cypress/reports/pdf/report.pdf
                """
        }
        failure {
            echo """
                ❌ Test Summary:
                - Status: FAILED
                - End: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Check the reports for details
                """
        }
        cleanup {
            cleanWs() // Çalışma alanını temizleme
        }
    }
}
