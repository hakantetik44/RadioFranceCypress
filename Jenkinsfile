pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        // Define Cypress cache folder for caching
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        // Optional: Define the Cypress config file if needed
        CYPRESS_CONFIG_FILE = "${WORKSPACE}/cypress.json" // Adjust if your config file is named differently
    }
    
    stages {
        stage('Checkout') {
            steps {
                // Checkout the source code from the SCM
                checkout scm
            }
        }
        
        stage('Debug Info') {
            steps {
                // Debugging information
                sh '''
                    echo "PATH = $PATH"
                    node -v
                    npm -v
                    npx cypress --version
                    pwd
                    ls -la
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                // Install npm dependencies
                sh 'npm ci'
            }
        }
        
    
        
        stage('Run Cypress Tests') {
            steps {
                // Run Cypress tests in headless mode
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
            // Publish test results
            junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
        }
        failure {
            // Archive screenshots and videos in case of failure
            archiveArtifacts artifacts: 'cypress/screenshots/**/*.png,cypress/videos/**/*.mp4', allowEmptyArchive: true
        }
        cleanup {
            // Clean workspace after job completion
            cleanWs()
        }
    }
}






