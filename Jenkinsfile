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
                        
                        // Test çıktısını bir dosyaya yazalım
                        sh '''
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --config defaultCommandTimeout=60000 \
                            2>&1 | tee cypress_complete_output.log
                        '''
                        
                        echo "📊 Résultats des Tests:"
                        echo "========================================"
                        
                        // Test çıktılarını işleyelim
                        sh '''
                            cat cypress_complete_output.log | \
                            grep -A1 -B1 "CYPRESS_LOG\\|Running:\\|✓\\|✖\\|describe\\|it(" | \
                            sed -E 's/\\x1B\\[[0-9;]*[mGK]//g' | \
                            while IFS= read -r line; do
                                if [[ $line == *"CYPRESS_LOG:"* ]]; then
                                    message=$(echo "$line" | sed 's/.*CYPRESS_LOG: //')
                                    echo "  ▶️ $message"
                                elif [[ $line == *"Running: "* ]]; then
                                    echo "🔎 Fichier de test: ${line#*Running: }"
                                elif [[ $line == *"describe"* ]]; then
                                    echo "📋 Suite de test: ${line}"
                                elif [[ $line == *"it("* ]]; then
                                    echo "  🔍 Test: ${line}"
                                elif [[ $line == *"✓"* ]]; then
                                    echo "  ✅ Test réussi: ${line#*✓}"
                                elif [[ $line == *"✖"* ]]; then
                                    echo "  ❌ Test échoué: ${line#*✖}"
                                elif [[ $line =~ "Page France Culture chargée" ]]; then
                                    echo "  ▶️ Page chargée"
                                elif [[ $line =~ "Cookies acceptés" ]]; then
                                    echo "  ▶️ Cookies acceptés"
                                elif [[ $line =~ "Menu principal trouvé" ]]; then
                                    echo "  ▶️ Menu trouvé"
                                elif [[ $line =~ "Titre de la page:" ]]; then
                                    echo "  ▶️ $line"
                                elif [[ $line =~ "Lien de recherche trouvé" ]]; then
                                    echo "  ▶️ Lien trouvé"
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