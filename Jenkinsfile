pipeline {
    agent any

    environment {
        GMAIL_CRED = credentials('gmail-smtp-cred')
    }

    stages {

        stage('1. Calidad: Validacion de Datos') {
            steps {
                echo '--- Verificando datos completos y sin duplicados ---'
                bat 'node validar_datos.js'
            }
        }

        stage('2. Deteccion: Estudiantes Nuevos') {
            steps {
                echo '--- Comparando versiones de la base de datos ---'
                bat 'node detectar_nuevos.js'
            }
        }

        stage('3. Despliegue: Envio de Correos') {
            steps {
                echo '--- Enviando correos unicamente a estudiantes nuevos ---'
                bat 'node enviar_correos.js'
            }
        }
    }

    post {
        success {
            mail to: 'encargada.certificaciones@instituto.edu.pe',
                subject: 'Envio de codigos: PROCESO COMPLETADO',
                body: 'El proceso finalizo correctamente. Se validaron los datos y se enviaron los codigos unicamente a los estudiantes nuevos detectados.'
        }

        failure {
            mail to: 'encargada.certificaciones@instituto.edu.pe',
                subject: 'Envio de codigos: ERROR EN EL PROCESO',
                body: 'El proceso se detuvo antes de completar el envio. Revisar el Console Output en Jenkins antes de reintentar.'
        }
    }
}