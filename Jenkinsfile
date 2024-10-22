pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        TEST_RESULTS_DIR = 'cypress/results'
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
                sh """
                    mkdir -p $CYPRESS_CACHE_FOLDER
                    mkdir -p ${TEST_RESULTS_DIR}
                """
            }
        }
        
        stage('Run Cypress Tests') {
            steps {
                script {
                    try {
                        echo "Démarrage des Tests Cypress..."
                        
                        // Cypress'i JSON reporter ile çalıştır
                        sh """
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --config defaultCommandTimeout=60000 \
                            --reporter-options "reportDir=${TEST_RESULTS_DIR},overwrite=false"
                        """
                        
                        // Test sonuçlarını oku ve işle
                        def testResults = readJSON(file: "${TEST_RESULTS_DIR}/results.json")
                        
                        // Test sonuçlarını formatla ve göster
                        def formattedResults = formatTestResults(testResults)
                        
                        echo "Résultats des Tests:"
                        formattedResults.each { result ->
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
        always {
            // Test sonuçlarını arşivle
            archiveArtifacts artifacts: "${TEST_RESULTS_DIR}/**/*", allowEmptyArchive: true
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

// Test sonuçlarını formatlama fonksiyonu
def formatTestResults(results) {
    def formattedResults = []
    
    results.results.each { suite ->
        formattedResults.add("→ Suite de Tests: ${suite.title}")
        
        suite.tests.each { test ->
            def status = test.state == 'passed' ? '✅' : '❌'
            def duration = String.format("%.2f", test.duration / 1000)
            formattedResults.add("  ${status} ${test.title} (${duration}s)")
            
            // Test sırasında kaydedilen logları ekle
            test.logs.each { log ->
                formattedResults.add("    ℹ️ ${log}")
            }
        }
        
        // Suite istatistiklerini ekle
        def stats = [
            "→ Nombre de Tests: ${suite.tests.size()}",
            "→ Réussis: ${suite.tests.count { it.state == 'passed' }}",
            "→ Échoués: ${suite.tests.count { it.state == 'failed' }}",
            "→ Durée: ${String.format("%.2f", suite.duration / 1000)}s"
        ]
        formattedResults.addAll(stats)
    }
    
    return formattedResults
}