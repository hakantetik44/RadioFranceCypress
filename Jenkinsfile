pipeline {
    agent any

    tools {
        nodejs 'Node.js 22.9'
    }
    environment {
        TERM = 'xterm' // Terminal ayarları
    }
    stages {
        stage('🛠️ Setup Environment') {
            steps {
                script {
                    echo "🌍 Setting up environment..."
                    // Node.js ve npm kurulumu
                    sh '''
                    echo "📦 Installing Node.js..."
                    curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                    '''
                    echo "✅ Node.js installed."
                }
            }
        }

        stage('🔄 Clean Workspace') {
            steps {
                script {
                    echo "🧹 Cleaning up workspace..."
                    cleanWs()
                    echo "🗑️ Workspace cleaned."
                }
            }
        }

        stage('📥 Checkout Code') {
            steps {
                script {
                    echo "📥 Checking out code from repository..."
                    checkout scm
                    echo "✅ Code checked out."
                }
            }
        }

        stage('📦 Install Dependencies') {
            steps {
                script {
                    echo "🔍 Installing dependencies..."
                    sh 'npm install'
                    echo "✅ Dependencies installed."
                }
            }
        }

        stage('⚙️ Build Project') {
            steps {
                script {
                    echo "🔧 Building the project..."
                    sh 'npm run build'
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
                        npx cypress run --headless --browser chrome
                        '''
                    } catch (Exception e) {
                        echo "❌ Tests failed: ${e.message}"
                        currentBuild.result = 'FAILURE'
                    }
                    echo "✅ Tests completed."
                }
            }
        }

        stage('📊 Analyze Results') {
            steps {
                script {
                    echo "📊 Analyzing test results..."
                    // Örnek bir analiz komutu
                    sh 'npm run test:report'
                    echo "✅ Results analyzed."
                }
            }
        }

        stage('📦 Package Application') {
            steps {
                script {
                    echo "📦 Packaging the application..."
                    sh 'npm run package'
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
                    ./deploy.sh staging
                    '''
                    echo "✅ Deployed to staging."
                }
            }
        }

        stage('📦 Publish Artifacts') {
            steps {
                script {
                    echo "📦 Publishing artifacts..."
                    archiveArtifacts artifacts: '**/dist/**/*', fingerprint: true
                    echo "✅ Artifacts published."
                }
            }
        }

        stage('🔧 Perform Lint Checks') {
            steps {
                script {
                    echo "🔧 Running lint checks..."
                    sh 'npm run lint'
                    echo "✅ Lint checks passed."
                }
            }
        }

        stage('🧹 Cleanup Resources') {
            steps {
                script {
                    echo "🧹 Cleaning up resources..."
                    sh 'rm -rf node_modules'
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
            archiveArtifacts artifacts: '''
                cypress/reports/html/*,
                cypress/reports/pdf/*,
                cypress/videos/*,
                cypress/screenshots/**/*
            ''', allowEmptyArchive: true

            junit allowEmptyResults: true, testResults: 'cypress/reports/junit/*.xml'
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
            cleanWs()
        }
    }
}
