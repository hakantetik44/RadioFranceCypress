pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9' // Make sure 'Node.js 22.9' is configured in Jenkins Global Tool Configuration
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
        
        stage('Debug Info') {
            steps {
                sh '''
                    echo "Debug Information:"
                    echo "===================="
                    echo "PATH = $PATH"
                    node -v
                    npm -v
                    npx cypress --version
                    echo "Working directory:"
                    pwd
                    echo "Directory listing:"
                    ls -la
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Cypress Verify') {
            steps {
                sh 'npx cypress verify'
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                sh '''
                    npx cypress run \
                    --browser electron \
                    --headless \
                    --reporter junit \
                    --reporter-options "mochaFile=cypress/results/results-[hash].xml"
                '''
            }
        }
    }
    
    post {
        always {
            // Collect test results even if they are empty (in case no tests were run)
            junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
        }
        failure {
            // Archive artifacts if the build fails, such as screenshots and videos from Cypress
            archiveArtifacts artifacts: 'cypress/screenshots/**/*.png, cypress/videos/**/*.mp4', allowEmptyArchive: true
        }
        cleanup {
            // Clean the workspace after the job finishes
            cleanWs()
        }
    }
}
