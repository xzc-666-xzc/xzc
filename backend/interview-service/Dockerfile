FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/interview-service-1.0.0-SNAPSHOT.jar app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 9002

ENTRYPOINT ["java", "-jar", "app.jar"]