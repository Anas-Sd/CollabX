<div align="center">

# ⚡ CollabX

**Next-Generation Collaborative IDE**

*Stop screen-sharing. Start collaborating.*

[![Live Demo](https://img.shields.io/badge/🔗_Live_Demo-CollabX.live-FF6B6B?style=for-the-badge)](https://collabx.live)
[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-Syed_Anas-00D9FF?style=for-the-badge)](https://syedanas.me)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Anas-Sd/CollabX?style=for-the-badge&color=gold)](https://github.com/Anas-Sd/CollabX)
[![GitHub Forks](https://img.shields.io/github/forks/Anas-Sd/CollabX?style=for-the-badge&color=8B5CF6)](https://github.com/Anas-Sd/CollabX)

<br/>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## 🧬 What is CollabX?

> Most technical interviews and pair programming sessions rely on laggy screen-shares. **CollabX** changes that.

A **full-stack collaborative environment** that allows high-performance engineering teams to code, execute, draw, and talk together in real-time — all within a stunning, premium interface.

```javascript
const collabx = {
    mission: "Make remote pair programming frictionless",
    features: ["Live Execution", "Voice Chat", "Whiteboard", "RBAC"],
    stack: ["Next.js", "Spring Boot", "PostgreSQL"],
    integrations: ["Judge0", "Agora WebRTC", "Razorpay"],
    status: "🟢 Live in Production"
};

async function startSession(team) {
    const room = await collabx.createRoom(team);
    return room.executeCode(); // ✨ Magic happens here
}
```
---

<div align="center">

### 🏗️ Architecture at a Glance

| Component | Responsibility | Technology |
|:---|:---|:---|
| **Client Gateway** | Handles all UI rendering, routing, and state | `Next.js 14`, `Tailwind` |
| **Sync Engine** | Manages real-time keystrokes and cursor tracking | `Spring WebSockets` |
| **Execution Node** | Compiles and runs user code securely | `Judge0 API`, `Docker` |
| **Voice Router** | Manages low-latency audio streams | `Agora WebRTC SDK` |
| **Persistence Layer**| Stores user profiles, billing, and room history | `PostgreSQL`, `Razorpay` |

</div>

---

## 📖 How to Use CollabX

Whether you are hosting an interview or pair programming with a friend, using CollabX is incredibly straightforward.

### 1️⃣ Creating a Workspace
- **Sign In**: Create a free account or log in via the dashboard.
- **Start a Session**: Click `Start your workspace` from the main dashboard.
- **Claim your Role**: As the creator, you are automatically assigned the **Host** role. This gives you exclusive rights to manage participants, execute code, and lock the room.

### 2️⃣ Inviting Collaborators
- **Share the Link**: Copy your unique Room ID from the top navigation bar.
- **Assign Roles**: When a user joins, the host can manage them with specific roles:
  - 📝 **Editor**: Can write code, draw on the whiteboard, and talk in the voice channel.
  - 👁️ **Viewer**: Can only watch the code execution and listen to the voice channel (Perfect for interview observers).

### 3️⃣ Writing & Executing Code
- **Select Language**: Choose between `Python`, `Java`, `C++`, `JavaScript`, or `SQL` from the editor dropdown.
- **Write Together**: Watch your teammates' cursors move in real-time with sub-100ms latency.
- **Run**: Hit the `Run` button. The code is instantly sent to our secure Judge0 containers, and the terminal output is broadcasted to everyone in the room simultaneously.

### 4️⃣ Utilizing the Tools
- 🎙️ **Voice Chat**: Click the microphone icon to instantly connect via WebRTC. No external Discord or Google Meet call required.
- 🎨 **Whiteboard**: Switch to the `Whiteboard` tab to draw system architectures, data flows, or algorithms collaboratively.
- 💾 **Session Persistence**: Need to leave? Your code and whiteboard state are automatically persisted in the database. Rejoin the URL later to pick up exactly where you left off.

---

## ✨ Features

<div align="center">

| | Feature | Description |
|:---:|:---|:---|
| ⚡ | **Sub-100ms Synchronization** | Real-time pair programming powered by WebSockets |
| 💻 | **Live Code Execution** | Compile & run Python, Java, C++, JS, and SQL instantly |
| 🛡️ | **Role-Based Access** | Secure 'Editor' or 'Viewer' permissions for room members |
| 🎙️ | **Built-in Voice Chat** | Peer-to-peer WebRTC voice channels via Agora |
| 🎨 | **Stunning UI/UX** | Premium, glassmorphic dark mode for zero distractions |
| 👑 | **PRO Tier Access** | Unlock unlimited executions & the exclusive Gold dashboard |

</div>

---

## 🛠️ Tech Stack

### ⚡ Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### ⚙️ Backend
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![WebSockets & Security](https://img.shields.io/badge/WebSockets_&_Security-000000?style=for-the-badge)

### 🗄️ Database
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

### 🛠️ Integrations
![Judge0 API](https://img.shields.io/badge/Judge0_API-FF4B4B?style=for-the-badge)
![Agora](https://img.shields.io/badge/Agora-099DFD?style=for-the-badge)
![ExcaliDraw](https://img.shields.io/badge/ExcaliDraw-6965DB?style=for-the-badge)
![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-2C2C32?style=for-the-badge)
![RazorPay](https://img.shields.io/badge/RazorPay-02042B?style=for-the-badge)

### 🐳 DevOps
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white)

### 🛠️ Tools
![Google Antigravity](https://img.shields.io/badge/Google_Antigravity-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Stitch](https://img.shields.io/badge/Stitch-FF6B6B?style=for-the-badge)
![Flow](https://img.shields.io/badge/Flow-00C7B7?style=for-the-badge)
![Claude 3.5 Sonnet](https://img.shields.io/badge/Claude_3.5_Sonnet-D97757?style=for-the-badge)

---

## 🎯 Key Highlights

<div align="center">

| | Highlight |
|:---:|:---|
| ✅ | End-to-end **Next.js & Spring Boot** microservices architecture |
| ⚡ | Optimized WebSocket payload handling for **instant keystroke sync** |
| 🎨 | Clean UI with **pixel-perfect responsive design** & smooth Framer Motion animations |
| 🔒 | Secure environment-based **JWT authentication** & role validation |
| 🚀 | Deployed live with **production-grade infrastructure** & automated CI/CD |

</div>

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- Java JDK `>= 17`
- PostgreSQL
- API Keys for Judge0, Agora, and Razorpay

### Installation

```bash
# Clone the repository
git clone https://github.com/Anas-Sd/CollabX.git

# Navigate to the project
cd CollabX

# Setup Backend (Spring Boot)
cd apps/backend
./mvnw clean install
# Add application-dev.yml with your DB credentials
./mvnw spring-boot:run

# Setup Frontend (Next.js)
cd ../frontend
npm install
# Configure .env.local with API endpoints
npm run dev
```

---

## 📁 Project Structure

<details>
<summary>🗂️ Click to expand file structure</summary>

```
CollabX/
├── 📂 apps/
│   ├── 📂 frontend/        # Next.js App Router Application
│   │   ├── 📂 src/app/     # Routes & Layouts
│   │   ├── 📂 src/components/
│   │   └── 📂 src/store/   
│   └── 📂 backend/         # Java Spring Boot Service
│       ├── 📂 src/main/java/
│       │   ├── 📂 controllers/
│       │   ├── 📂 services/
│       │   └── 📂 websocket/
│       └── 📄 pom.xml
├── 📄 docker-compose.yml
└── 📄 README.md
```

</details>

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the project
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## 📬 Let's Connect!

<div align="center">

<a href="mailto:office.collabx@gmail.com">
  <img src="https://img.shields.io/badge/Email-office.collabx@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white"/>
</a>
<a href="https://www.linkedin.com/in/-syedanas">
  <img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/>
</a>
<a href="https://syedanas.me">
  <img src="https://img.shields.io/badge/Portfolio-syedanas.me-00D9FF?style=for-the-badge&logo=googlechrome&logoColor=white"/>
</a>
<a href="https://github.com/Anas-Sd">
  <img src="https://img.shields.io/badge/GitHub-Anas--Sd-181717?style=for-the-badge&logo=github&logoColor=white"/>
</a>

<br/><br/>

📍 **India** | 🕐 **IST (UTC+5:30)** | ✅ **Open for Opportunities**

</div>

---

## ⚖️ License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

### 💬 "In the world of code, creativity is my weapon."

<br/>

**⭐ If you found this useful, give it a star!**

**From [SYED ANAS](https://github.com/Anas-Sd) with ❤️**

</div>
