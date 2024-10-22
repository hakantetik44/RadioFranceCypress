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

        stage('Prepare Test Environment') {
            steps {
                sh 'mkdir -p $CYPRESS_CACHE_FOLDER'
            }
        }

        stage('Run Cypress Tests') {
            steps {
                script {
                    try {
                        echo "Démarrage des Tests Cypress..."
                        
                        // Test çıktısını al ve işle
                        def testOutput = sh(
                            script: '''
                                npx cypress run \
                                --browser electron \
                                --headless \
                                --config defaultCommandTimeout=60000 | grep "CYPRESS_LOG:"
                            ''',
                            returnStdout: true
                        ).trim()

                        // Log mesajlarını topla
                        def logMessages = testOutput.split('\n')
                            .findAll { it.contains('CYPRESS_LOG:') }
                            .collect { it.replace('CYPRESS_LOG:', '').trim() }

                        // Test sonuçlarını yazdır
                        echo "=== Résultats des Tests ==="
                        logMessages.each { message ->
                            echo "→ ${message}"
                        }
                        
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("Tests Cypress échoués: ${e.message}")
                    }
                }
            }
        }
    }
    
    post {
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