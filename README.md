# Qubli AI — AI-Powered Learning Platform

Qubli AI is an AI-powered learning platform that transforms the way you study. It generates personalized quizzes, flashcards, and study materials, adapts to your progress, and focuses on areas that need improvement. Designed for students, professionals, and lifelong learners, Qubli AI maximizes learning efficiency and knowledge retention.

---

## ✨ Features

- 📝 **Instant Quiz Generation**  
  Create quizzes on any topic with multiple question types including multiple-choice, true/false, and fill-in-the-blank
- 🎴 **Interactive Flashcards**  
  Reinforce memory with spaced repetition and smart reminders
- 📊 **Performance Tracking**  
  Monitor your progress with detailed analytics and insights
- 📱 **Modern Interface**  
  Sleek, responsive, and mobile-friendly design
- 💡 **Adaptive Learning**  
  Focus on areas where you need improvement
- 🎯 **Personalized Learning Experience**  
  Efficiently master knowledge and stay motivated
- 💎 **Premium Features**  
  Advanced AI-powered content for enhanced learning

---

## 🧰 Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Lucide Icons

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT Authentication
- OpenAI / Gemini API
- CORS

---

## ⚡ Prerequisites

- Node.js **18+**
- MongoDB Atlas account
- OpenAI/Gemini API Key
- Google/GitHub OAuth credentials

---

## 📦 Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd Qubli-AI
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure ENV Variables**

```bash
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_uri

GEMINI_API_KEY=your_gemini_api_key

EMAIL_SERVICE=gmail
EMAIL_USER=your_email_address
EMAIL_PASSWORD=your_email_app_password

FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api
NODE_ENV=development

VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## ▶️ Running The Project

**Development**

```bash
npm run dev:all
```

**Production**

```bash
npm run build
```

---

## 🛡️ Admin Dashboard

Qubli AI includes a complete admin dashboard for managing users, quizzes, and results.

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed admin user
npm run seed:admin

# 3. Start development
npm run dev:all

# 4. Login at http://localhost:5173/admin/login
```

### Features

- 📊 Dashboard with real-time statistics
- 👥 User management (enable/disable/ban)
- 📋 Quiz results tracking
- 🔍 Search and pagination
- 📈 Performance charts (7-day activity, average scores)
- 🔄 Real-time updates via Socket.io

### Documentation

- **[ADMIN_COMPLETE.md](ADMIN_COMPLETE.md)** — Full overview
- **[QUICK_START.md](QUICK_START.md)** — Fast setup (5 min)
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** — API reference
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — Common issues

---

<!-- ## ⌨ Quick Keyboard Shortcuts

| Shortcut                       | Action               |
| ------------------------------ | -------------------- |
| `Ctrl+\` / `Cmd+\`             | Toggle Sidebar       |
| `Ctrl+Shift+O` / `Cmd+Shift+O` | Create Quiz          | -->

## 📄 License

**Private project — All rights reserved.**
