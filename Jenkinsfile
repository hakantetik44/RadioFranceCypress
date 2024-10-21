pipeline {
    agent any
    
    tools {
        nodejs 'Node.js 22.9'
    }
    
    environment {
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cypress-cache"
        TERM = 'dumb'
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
                        sh '''
                            npx cypress verify || exit 0
                            npx cypress run \
                            --browser electron \
                            --headless \
                            --reporter mocha-junit-reporter \
                            --reporter-options "mochaFile=cypress/results/junit-results.xml" \
                            --config defaultCommandTimeout=60000
                        '''
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        error("Cypress tests failed: ${e.message}")
                    }
                }
            }
        }

        stage('Parse Test Results') {
            steps {
                script {
                    def testResults = junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
                    echo "Test Sonuçları Özeti:"
                    echo "Toplam Test Sayısı: ${testResults.totalCount}"
                    echo "Başarılı Test Sayısı: ${testResults.passCount}"
                    echo "Başarısız Test Sayısı: ${testResults.failCount}"
                    echo "Atlanan Test Sayısı: ${testResults.skipCount}"

                    if (fileExists('cypress/results/junit-results.xml')) {
                        def xmlContent = readFile 'cypress/results/junit-results.xml'
                        def testsuite = new XmlSlurper().parseText(xmlContent)
                        echo "Detaylı Test Sonuçları:"
                        testsuite.testcase.each { testcase ->
                            echo "Test: ${testcase.@name}"
                            echo "Durum: ${testcase.failure.size() == 0 ? 'Başarılı' : 'Başarısız'}"
                            echo "Süre: ${testcase.@time} saniye"
                            echo "---"
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            junit allowEmptyResults: true, testResults: 'cypress/results/*.xml'
            archiveArtifacts artifacts: 'cypress/videos/**/*.mp4,cypress/screenshots/**/*.png', allowEmptyArchive: true
        }
        cleanup {
            cleanWs()
        }
    }
}