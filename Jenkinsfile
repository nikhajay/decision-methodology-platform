
pipeline {
    agent any

    environment {
        IMAGE_NAME = 'fastapi-cicd'
        CONTAINER_NAME = 'fastapi-app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                sh '''
                    python3 -m venv .venv
                    .venv/bin/python -m pip install -r requirements.txt
                    .venv/bin/python -m pytest -q
                '''
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build \
                      -t $IMAGE_NAME:$BUILD_NUMBER \
                      .
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker rm -f $CONTAINER_NAME || true

                    docker run -d \
                      --name $CONTAINER_NAME \
                      --restart unless-stopped \
                      -p 8000:8000 \
                      $IMAGE_NAME:$BUILD_NUMBER
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    for i in $(seq 1 20); do
                        if curl -fsS \
                          http://localhost:8000/health; then
                            exit 0
                        fi
                        sleep 2
                    done

                    docker logs $CONTAINER_NAME
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD Pipeline Successful!'
        }

        failure {
            echo 'CI/CD Pipeline Failed!'
        }
    }
}
