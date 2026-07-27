FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/gateway-1.0.0-SNAPSHOT.jar app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]