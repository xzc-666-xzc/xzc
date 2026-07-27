FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/user-service-1.0.0-SNAPSHOT.jar app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 9001

ENTRYPOINT ["java", "-jar", "app.jar"]