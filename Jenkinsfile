pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                script {
                    try {
                        echo "Starting checkout..."
                        checkout scm
                        echo "\u001B[32mCheckout completed successfully! ✅\u001B[0m"
                    } catch (e) {
                        echo "\u001B[31mCheckout failed! ❌\u001B[0m"
                        error("Checkout stage failed.")
                    }
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    try {
                        echo "Checking for gradlew file..."
                        sh 'ls -la ./gradlew'  // Gradlew dosyasının varlığını kontrol et

                        echo "Starting build process..."
                        sh './gradlew build'  // Gradle build komutunu çalıştır
                        echo "\u001B[32mBuild completed successfully! ✅\u001B[0m"
                    } catch (e) {
                        echo "\u001B[31mBuild failed! ❌\u001B[0m"
                        error("Build stage failed: gradlew file missing or build command failed.")
                    }
                }
            }
        }

        stage('Test') {
            when {
                expression { currentBuild.result == null }
            }
            steps {
                script {
                    try {
                        echo "Running tests..."
                        sh './gradlew test'
                        echo "\u001B[32mTests passed successfully! ✅\u001B[0m"
                    } catch (e) {
                        echo "\u001B[31mTests failed! ❌\u001B[0m"
                        error("Test stage failed.")
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression { currentBuild.result == null }
            }
            steps {
                script {
                    try {
                        echo "Starting deployment..."
                        // Deploy komutunu buraya ekleyin
                        echo "\u001B[32mDeployment successful! ✅\u001B[0m"
                    } catch (e) {
                        echo "\u001B[31mDeployment failed! ❌\u001B[0m"
                        error("Deployment stage failed.")
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo "\u001B[32mPipeline completed successfully! ✅\u001B[0m"
        }
        failure {
            echo "\u001B[31mPipeline failed! ❌\u001B[0m"
        }
    }
}
