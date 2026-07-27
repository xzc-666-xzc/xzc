FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/ai-service-1.0.0-SNAPSHOT.jar app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 9003

ENTRYPOINT ["java", "-jar", "app.jar"]