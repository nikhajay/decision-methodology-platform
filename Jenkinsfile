pipeline {

    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    environment {
        DEPLOY_DIR = '/opt/decision-methodology'
        COMPOSE_PROJECT_NAME = 'decision-methodology'
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh '''
                        docker run --rm \
                          -v "$PWD:/app" \
                          -w /app \
                          python:3.12-slim \
                          sh -c "
                            pip install -r requirements-dev.txt &&
                            python -m pytest tests/ -v
                          "
                    '''
                }
            }
        }

        stage('Frontend Build Test') {
            steps {
                dir('frontend') {
                    sh '''
                        docker run --rm \
                          -v "$PWD:/app" \
                          -w /app \
                          node:22-alpine \
                          sh -c "
                            npm ci &&
                            npm run build
                          "
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    docker compose \
                      --env-file "$DEPLOY_DIR/.env" \
                      build backend frontend
                '''
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }

            steps {
                sh '''
                    docker compose \
                      --env-file "$DEPLOY_DIR/.env" \
                      up -d --no-build --remove-orphans
                '''
            }
        }

        stage('Health Check') {
            when {
                branch 'main'
            }

            steps {
                sh '''
                    for i in $(seq 1 15); do
                      if curl -fsS \
                        http://localhost:8081/api/health; then
                        exit 0
                      fi

                      sleep 3
                    done

                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline successful'
        }

        failure {
            echo 'CI/CD pipeline failed'
        }
    }
}