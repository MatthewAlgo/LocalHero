pipeline {
    agent any

    tools {
        nodejs "Node18"
    }

    environment {
        // CI Environment
        NODE_ENV = 'test'
        JWT_SECRET = 'ci-test-secret'
        // Dummy API keys used only for CI tests; not real credentials.
        // Production/staging keys are provided via Jenkins credentials or external env vars.
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
