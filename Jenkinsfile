pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Get AWS Account') {
            steps {
                script {
                    env.ACCOUNT_ID = sh(
                        script: 'aws sts get-caller-identity --query Account --output text',
                        returnStdout: true
                    ).trim()

                    env.BACKEND_REPO = "${env.ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com/nodejs-backend"
                    env.FRONTEND_REPO = "${env.ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com/nodejs-frontend"

                    env.IMAGE_TAG = "${env.BUILD_NUMBER}"
                }
            }
        }

        stage('Login To ECR') {
            steps {
                sh '''
                aws ecr get-login-password --region ${AWS_REGION} \
                | docker login \
                --username AWS \
                --password-stdin \
                ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                docker build \
                -t nodejs-backend:${IMAGE_TAG} \
                ./backend
                '''
            }
        }

        stage('Tag Backend Image') {
            steps {
                sh '''
                docker tag \
                nodejs-backend:${IMAGE_TAG} \
                ${BACKEND_REPO}:${IMAGE_TAG}
                '''
            }
        }

        stage('Push Backend Image') {
            steps {
                sh '''
                docker push \
                ${BACKEND_REPO}:${IMAGE_TAG}
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                docker build \
                -t nodejs-frontend:${IMAGE_TAG} \
                ./frontend
                '''
            }
        }

        stage('Tag Frontend Image') {
            steps {
                sh '''
                docker tag \
                nodejs-frontend:${IMAGE_TAG} \
                ${FRONTEND_REPO}:${IMAGE_TAG}
                '''
            }
        }

        stage('Push Frontend Image') {
            steps {
                sh '''
                docker push \
                ${FRONTEND_REPO}:${IMAGE_TAG}
                '''
            }
        }
    }

    post {
        always {
            sh '''
            docker image prune -af || true
            '''
        }
    }
}