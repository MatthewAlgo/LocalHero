pipeline {
    agent any

    environment {
        // CI Environment
        NODE_ENV = 'test'
        JWT_SECRET = 'ci-test-secret'
        GEMINI_API_KEY = 'dummy-key'
        GOOGLE_PLACES_API_KEY = 'dummy-key'
    }

    stages {
        stage('Install & Test') {
            parallel {
                 stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm test'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm test'
                        }
                    }
                }
            }
        }
    }
}
