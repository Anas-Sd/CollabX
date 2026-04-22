FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Install necessary execution tools
RUN apk add --no-cache python3 gcc g++ nodejs

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
