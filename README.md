# CodeCollab

CodeCollab is a production-grade, real-time collaborative coding platform supporting multiple languages, a custom sandbox execution engine, WebSockets for ultra-fast synchronization, and integrated Agora voice features.

## Tech Stack
* **Frontend:** Next.js (App Router), React, Zustand, Tailwind CSS, Monaco Editor, Agora RTC.
* **Backend:** Spring Boot (Java 17), Spring Security (JWT), Spring Data JPA, Spring WebSockets, Flyway, Razorpay, Redis.
* **Infrastructure:** PostgreSQL, Redis Docker, ProcessBuilder sandboxing.

## Features Built
- Secure Authentication (Register/Login/JWT).
- Room Workspace Provisioning and Presence hooks.
- **Collaborative Editor:** Live synchronization of code, cursors, and active language mapped dynamically.
- **Roles:** Host privilege controls (Transfer Host, Mute, Kick, Promote Editor).
- **Execution Engine:** Sandbox environments mapped to Java, Python, Node, C, C++, and SQL returning formatted output / test case verification statuses securely. 
- **Voice Intercom:** Fully embedded WebRTC Agora audio layer controlled by host and client.
- **Monetization:** Paygate Integration with Razorpay mapped securely to backend webhooks.

## Architecture & Quick Start Locally

### Prerequisites
1. Docker and Docker Compose
2. Node.js 18+ (if running frontend manually)
3. Java 17+ (if running backend manually)

### One-Click Startup (Docker)

To run the entire system (Frontend, Backend, Postgres, and Redis) flawlessly:

```bash
docker-compose up --build
```
* **Frontend:** `http://localhost:3000`
* **Backend API:** `http://localhost:8080`

### Manual Run

**1. Backing Services:**
Start a local Redis instance (`port 6379`) and a Postgres instance (`port 5432`). Update the `application.yml` accordingly.

**2. Backend:**
```bash
cd apps/backend
./mvnw clean install
./mvnw spring-boot:run
```

**3. Frontend:**
Ensure `.env.local` exists with:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
```
```bash
cd apps/frontend
npm i
npm run dev
```
