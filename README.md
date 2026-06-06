# 🚀 TaskFlow — Team Task Manager

A full-stack web application for managing team projects, tasks, and progress with role-based access control (Admin/Member).

![TaskFlow Screenshot](https://via.placeholder.com/800x400?text=TaskFlow+Team+Task+Manager)

## ✨ Features

### Authentication
- 🔐 User signup with email validation
- 🔑 Secure login with JWT tokens
- 🔒 Password hashing with bcrypt
- 👤 Persistent sessions

### Project Management
- 📁 Create, edit, and delete projects
- 👥 Add/remove team members
- 🎭 Role-based access (Admin/Member)
- 📊 Progress tracking per project

### Task Management
- ✅ Create tasks with title, description, priority, assignee, due date
- 📋 Kanban board view (To Do → In Progress → Review → Done)
- 📝 List view with inline status updates
- 🔍 Search and filter tasks
- ⏰ Overdue task tracking

### Dashboard
- 📈 Overview statistics (total, in-progress, completed, overdue)
- 📊 Visual progress charts
- 🔥 Overdue task alerts
- 📅 Upcoming deadlines
- 🕐 Recent activity

### Role-Based Access Control
| Action | Admin | Member |
|--------|:-----:|:------:|
| View projects & tasks | ✅ | ✅ |
| Create/edit tasks | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
| Manage project settings | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Styling
- **Vite** — Build tool
- **Lucide React** — Icons

### Backend
- **Node.js** — Runtime
- **Express.js** — Web framework
- **MongoDB** — Database
- **Mongoose** — ODM
- **JWT** — Authentication
- **bcryptjs** — Password hashing
- **express-validator** — Input validation

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── middleware/
│   │   └── auth.js         # JWT & role verification
│   ├── models/
│   │   ├── User.js         # User schema
│   │   ├── Project.js      # Project schema
│   │   └── Task.js         # Task schema
│   ├── routes/
│   │   ├── auth.js         # Auth endpoints
│   │   ├── projects.js     # Project CRUD
│   │   └── tasks.js        # Task CRUD
│   ├── server.js           # Express server
│   ├── package.json
│   └── .env.example
│
├── src/
│   ├── components/
│   │   ├── AuthPages.tsx   # Login/Signup
│   │   ├── Dashboard.tsx   # Overview
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── MyTasksPage.tsx
│   │   └── Sidebar.tsx
│   ├── context/
│   │   └── AuthContext.tsx # Auth state
│   ├── services/
│   │   └── api.ts          # API client
│   ├── App.tsx
│   └── main.tsx
│
├── index.html
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Set up the backend
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# PORT=5000
# FRONTEND_URL=http://localhost:5173

npm start
```

### 3. Set up the frontend
```bash
# In a new terminal, from project root
npm install
npm run dev
```

### 4. Open in browser
Visit `http://localhost:5173`

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users/search` | Search user by email |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get user's projects |
| GET | `/api/projects/:id` | Get project by ID |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| PUT | `/api/projects/:id/members/:userId` | Update member role |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/my` | Get user's tasks |
| GET | `/api/tasks/stats` | Get task statistics |
| GET | `/api/tasks/project/:projectId` | Get project tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

---

## 🚢 Deployment on Railway

### 1. Create a Railway account
Visit [railway.app](https://railway.app) and sign up

### 2. Create a new project
- Click "New Project"
- Choose "Deploy from GitHub repo"
- Select your repository

### 3. Add MongoDB
- Click "New" → "Database" → "MongoDB"
- Copy the connection string

### 4. Configure environment variables
In your Railway service, add:
```
MONGODB_URI=<your_railway_mongodb_uri>
JWT_SECRET=<random_secret_string>
NODE_ENV=production
```

### 5. Deploy
Railway will automatically build and deploy your app!

---

## 📱 Usage Guide

### Getting Started
1. **Sign Up** — Create an account with your email
2. **Create a Project** — Click "New Project" and add details
3. **Add Tasks** — Open project and click "Add Task"
4. **Invite Team** — Add members by their email (they must sign up first)
5. **Track Progress** — Use Dashboard to monitor overall status

### Task Workflow
```
To Do → In Progress → Review → Done
```

### Role Permissions
- **Admin**: Full control over project, tasks, and members
- **Member**: Can view and update tasks only

---

## 🧪 Testing Multi-User Flow

1. **User A**: Sign up → Create project → Add tasks
2. **User B**: Sign up with different email
3. **User A**: Add User B as project member
4. **User B**: Log in → View shared project → Update task status
5. **Both users** see real-time updates when refreshing

---

## 📄 License

MIT License — feel free to use for personal or commercial projects.

---

## 👨‍💻 Author

Built with ❤️ for the job application assignment.

**Timeline**: Completed in ~8-10 hours

---

## 🙏 Acknowledgments

- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Express.js](https://expressjs.com)
- [MongoDB](https://mongodb.com)
- [Lucide Icons](https://lucide.dev)
