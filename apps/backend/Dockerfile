# Build stage — compile the JAR
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# Runtime stage — lean image with just JRE + execution tools
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Install language runtimes for code execution (python, gcc, node)
RUN apk add --no-cache python3 gcc g++ nodejs

# Room data directory for SQLite files
RUN mkdir -p /app/data/rooms

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
