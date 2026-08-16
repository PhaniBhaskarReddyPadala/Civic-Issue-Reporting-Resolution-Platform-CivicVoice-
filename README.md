# CivicVoice 🏙️

### Smart Civic Issue Reporting & Resolution Platform

CivicVoice is a full-stack web application that connects **citizens with government officers** to make civic issue reporting, tracking, and resolution more transparent and efficient.

Citizens can report issues such as potholes, garbage, water leakage, and broken streetlights, while government officers can manage complaints, update their status, and provide resolution proof.

---

## 🚀 Features

### 👤 Citizen

* Register and login securely
* Report civic issues with title, description, category, location, and images
* View all reported complaints
* Upvote important complaints
* Follow complaints for updates
* Track complaint status
* View complaints on a map
* Read civic announcements

### 👮 Government Officer

* Secure officer authentication
* View complaints assigned to their department
* Manage complaint status
* Update complaints from **Pending → In Progress → Resolved**
* Upload resolution images
* Publish civic announcements

### 🔐 Security

* JWT-based authentication
* Role-based access control
* bcrypt password hashing
* Protected API routes
* Zod request validation
* Environment-based configuration

---

## 🏗️ Architecture

```text
                 ┌──────────────────┐
                 │   React Frontend │
                 │ TypeScript + Vite│
                 └────────┬─────────┘
                          │
                       Axios
                          │
                          ▼
                 ┌──────────────────┐
                 │ Express Backend  │
                 │   Node + TS      │
                 └────────┬─────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
     ┌────────────────┐      ┌────────────────┐
     │ PostgreSQL/Neon│      │ MongoDB Atlas  │
     │    Prisma      │      │    Mongoose    │
     └────────────────┘      └────────────────┘
```

### Database Strategy

**PostgreSQL** handles structured relational data:

* Users
* Departments
* Complaints
* Votes
* Follows
* Civic Updates

**MongoDB** handles flexible complaint details and media-related data.

---

## 🛠️ Tech Stack

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios
* Lucide Icons

### Backend

* Node.js
* Express.js
* TypeScript
* Prisma
* Mongoose
* JWT
* bcryptjs
* Zod
* Multer

### Database & Services

* PostgreSQL
* Neon
* MongoDB Atlas
* Cloudinary

---

## 📂 Project Structure

```text
CivicVoice/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── App.tsx
│       └── main.tsx
│
├── .gitignore
└── README.md
```

---

## 🔄 Complaint Workflow

```text
Citizen Reports Issue
        ↓
Complaint Created
        ↓
Department Assigned
        ↓
Officer Reviews Complaint
        ↓
PENDING
        ↓
IN_PROGRESS
        ↓
RESOLVED
        ↓
Resolution Proof Uploaded
```

Citizens can continue to follow and monitor the complaint throughout the process.

---

## 🔌 API Overview

### Authentication

| Method | Endpoint             | Description   |
| ------ | -------------------- | ------------- |
| POST   | `/api/auth/register` | Register user |
| POST   | `/api/auth/login`    | Login user    |

### Complaints

| Method | Endpoint                           | Description            |
| ------ | ---------------------------------- | ---------------------- |
| POST   | `/api/complaints`                  | Create complaint       |
| GET    | `/api/complaints`                  | Get complaints         |
| GET    | `/api/complaints/:id`              | Get complaint details  |
| GET    | `/api/complaints/officer/assigned` | Get officer complaints |
| POST   | `/api/complaints/:id/vote`         | Toggle vote            |
| POST   | `/api/complaints/:id/follow`       | Toggle follow          |
| PATCH  | `/api/complaints/:id/status`       | Update status          |

### Departments

```text
GET /api/departments
```

### Civic Updates

```text
POST /api/civic-updates
GET  /api/civic-updates
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/PhaniBhaskarReddyPadala/Civic-Issue-Reporting-Resolution-Platform-CivicVoice-.git

cd Civic-Issue-Reporting-Resolution-Platform-CivicVoice-
```

### 2. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the backend directory.

```env
DATABASE_URL="your_postgresql_connection_string"

MONGODB_URI="your_mongodb_connection_string"

JWT_SECRET="your_jwt_secret"

CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

Do not commit your `.env` file to GitHub.

---

## 🗄️ Database Setup

From the backend directory:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Start the backend:

```bash
npm run dev
```

---

## 💻 Start Frontend

From the frontend directory:

```bash
npm run dev
```

The frontend will be available through the Vite development server.

---

## 📊 Current Implementation

* ✅ Citizen authentication
* ✅ Officer authentication
* ✅ JWT authorization
* ✅ Role-based access control
* ✅ Complaint creation
* ✅ Image uploads
* ✅ Geolocation
* ✅ Department-based complaint handling
* ✅ Complaint voting
* ✅ Complaint following
* ✅ Status tracking
* ✅ Resolution images
* ✅ Civic announcements
* ✅ PostgreSQL + MongoDB architecture
* ✅ Virtual map

---

## 🔮 Future Improvements

* [ ] Real-time notifications using Socket.IO
* [ ] Admin dashboard
* [ ] Complaint comments/discussions
* [ ] Email notifications
* [ ] Advanced complaint search
* [ ] Pagination/infinite scrolling
* [ ] Rate limiting
* [ ] Helmet security headers
* [ ] Production Cloudinary integration
* [ ] Automated CI/CD using GitHub Actions

---

## 🎯 Project Goal

CivicVoice aims to create a more **transparent, community-driven, and efficient civic complaint system** where citizens can easily report problems and government officers can systematically manage and resolve them.

---

## 👨‍💻 Author

**Phani Bhaskar Reddy Padala**

Built using **React, TypeScript, Node.js, Express, Prisma, PostgreSQL, MongoDB, and JWT**.
