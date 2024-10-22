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
                        echo "Démarrage des Tests Cypress..."
                        
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
                            line = line.replaceAll(/\x1B\[[0-9;]*[mGK]/, '')  // Nettoyer les codes ANSI
                            line = line.trim()
                            
                            // Traductions en français
                            line = line.replaceAll(/^Tests:/, 'Nombre de Tests:')
                            line = line.replaceAll(/Passing:/, 'Réussis:')
                            line = line.replaceAll(/Failing:/, 'Échoués:')
                            line = line.replaceAll(/Duration:/, 'Durée:')
                            
                            return "→ ${line}"
                        }
                        
                        echo "Résultats des Tests:"
                        testResults.each { result ->
                            echo result
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