pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        CYPRESS_VERIFY_TIMEOUT = '120000' // Doğrulama zaman aşımı süresini artır
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                // NPM cache temizleme
                sh 'npm cache clean --force'
                
                // Cypress'i yeniden yükleme
                sh 'npm uninstall cypress'
                sh 'npm i cypress@13.15.0 --save-dev'
                
                // Diğer bağımlılıkları yükleme
                sh 'npm ci'
            }
        }

        stage('Verify Cypress') {
            steps {
                // Cypress'i doğrulama
                sh 'npx cypress verify'
                
                // Binary'yi doğrulama
                sh 'npx cypress cache verify'
            }
        }
        
        stage('Prepare Test Environment') {
            steps {
                sh """
                    mkdir -p $CYPRESS_CACHE_FOLDER
                    mkdir -p cypress/results
                    mkdir -p cypress/screenshots
                    mkdir -p cypress/videos
                """
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                script {
                    try {
                        echo "Démarrage des Tests Cypress..."
                        
                        // Daha uzun timeout ve retry parametreleri ile çalıştır
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --config defaultCommandTimeout=90000,pageLoadTimeout=90000,responseTimeout=90000 \
                            --reporter-options reportDir=cypress/results,overwrite=false
                        """
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("Tests Cypress échoués: ${e.message}")
                    }
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'cypress/**/*', allowEmptyArchive: true
        }
        success {
            script {
                echo """
                ✅ Résumé des Tests:
                - Statut du Build: RÉUSSI
                - Heure de Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                """
            }
        }
        failure {
            script {
                echo """
                ❌ Résumé des Tests:
                - Statut du Build: ÉCHOUÉ
                - Heure de Fin: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Veuillez consulter les logs pour plus de détails
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