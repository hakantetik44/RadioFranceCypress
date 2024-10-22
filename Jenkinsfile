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
                        echo "🚀 Démarrage des Tests Cypress..."
                        
                        def testOutput = sh(
                            script: '''
                                CYPRESS_REPORTER=cypress-multi-reporters \
                                CYPRESS_REPORTER_CONFIG='{"reporterEnabled": ["spec", "mocha-junit-reporter"], "mochaJunitReporterReporterOptions": {"mochaFile": "cypress/results/results.xml"}}' \
                                npx cypress run \
                                --browser electron \
                                --headless \
                                --env logCaptureEnabled=true \
                                --config defaultCommandTimeout=60000,screenshotOnRunFailure=true \
                                | tee test_output.log
                            ''',
                            returnStdout: true
                        ).trim()

                        echo """
                        📊 Résultats des Tests:
                        ========================================"""

                        // Test çıktılarını işle
                        sh '''
                            cat test_output.log | \
                            grep -E "cy\\.(log|task)|Running:|✓|✖|^\\s*(it|describe)\\(|^\\s*│.*\\b(chargé|trouvé|accepté|détecté)\\b" | \
                            sed -E 's/\\x1B\\[[0-9;]*[mGK]//g' | \
                            sed -E 's/^\\s*cy\\.(log|task)\\(//g' | \
                            sed -E 's/^\\s*│//g' | \
                            while IFS= read -r line; do
                                if [[ $line == *"Running:"* ]]; then
                                    echo "🔎 Fichier de test: ${line#*Running:}"
                                elif [[ $line == *"✓"* ]]; then
                                    echo "  ✅ Test réussi: ${line#*✓}"
                                elif [[ $line == *"✖"* ]]; then
                                    echo "  ❌ Test échoué: ${line#*✖}"
                                elif [[ $line == *"chargé"* ]] || [[ $line == *"trouvé"* ]] || [[ $line == *"accepté"* ]] || [[ $line == *"détecté"* ]]; then
                                    echo "  ▶️ $line"
                                elif [[ $line == *"describe("* ]]; then
                                    echo "📋 Suite: ${line}"
                                elif [[ $line == *"it("* ]]; then
                                    echo "  🔍 Test: ${line}"
                                else
                                    echo "  $line"
                                fi
                            done
                        '''

                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("⚠️ Erreur lors des tests: ${e.message}")
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo """
                ✅ Résumé Final:
                ----------------------------------------
                - Statut: RÉUSSI
                - Terminé à: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                """
            }
        }
        failure {
            script {
                echo """
                ❌ Résumé Final:
                ----------------------------------------
                - Statut: ÉCHOUÉ
                - Terminé à: ${new Date().format('dd/MM/yyyy HH:mm:ss')}
                - Consultez les logs pour plus de détails
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