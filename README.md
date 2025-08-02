# 📄 Document Management & RAG-based Q&A System

## 📑 Table of Contents
- [📌 Overview](#-overview)
- [🚀 Tech Stack](#-tech-stack)
- [📂 Project Structure](#-project-structure)
- [⚙️ Features](#️-features)
- [🛠️ Prerequisites](#️-prerequisites)
- [⚡ Running the Project](#-running-the-project)
  - [1️⃣ Clone the Repository](#1️⃣-clone-the-repository)
  - [2️⃣ Run Without Docker](#2️⃣-run-without-docker)
  - [3️⃣ Run With Docker](#3️⃣-run-with-docker)
- [📜 API Documentation](#-api-documentation)
- [👤 Default Admin Credentials](#-default-admin-credentials)
- [🧪 Health Check](#-health-check)
- [📜 License](#-license)
- [🔮 Future Enhancements](#-future-enhancements)

- [👨‍💻 Author](#-author)

## 📌 Overview

This project is a **Document Management and Retrieval-Augmented Generation (RAG)-based Q&A system**, designed to manage documents, trigger ingestion for content processing, and enable seamless document retrieval and question-answering functionalities.

The system provides:
- **Role-based Authentication (Admin, Editor, Viewer)**
- **Document Upload, Update, Delete, and Preview**
- **Ingestion Management** with manual triggers and retry options
- **Scalable Architecture** using **NestJS, React (TypeScript), and PostgreSQL**
- **Flexible Storage** (Local filesystem or AWS S3)
- **Dockerized Deployment** for easy setup and scalability

---

## 🚀 Tech Stack

### **Backend**
- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT-based
- **File Storage:** Local or AWS S3
- **Containerization:** Docker

### **Frontend**
- **Framework:** React (TypeScript) with Vite
- **State Management:** React Query
- **UI:** Tailwind CSS

---

## 📂 Project Structure
```plaintext
doc-management/
│── backend/       # NestJS backend application
│── frontend/      # React frontend application
│── documents/     # React frontend application
│── docker-compose.yml
│── README.md
```
---

## ⚙️ Features

✅ **Authentication & Authorization**
- Role-based access control (Admin, Editor, Viewer)
- JWT authentication and permission management

✅ **Document Management**
- Upload documents (`pdf`, `doc`, `docx`, `txt`)
- Local or S3 storage based on configuration
- Document previewer

✅ **Ingestion Module**
- Manual ingestion triggers (Admin or permitted Editor)
- Retry ingestion for failed/cancelled documents
- Ingestion history logs with status tracking

✅ **Scalable Architecture**
- Modular NestJS backend
- React frontend with reusable components
- Dockerized deployment for local and cloud environments

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [PostgreSQL](https://www.postgresql.org/) v15+
- [Docker](https://www.docker.com/) (Optional, for containerized setup)

---

## ⚡ Running the Project

### **1️⃣ Clone the repository**
```bash
git clone https://github.com/dhawanit/document-management.git
cd doc-management
```

### **2️⃣ Run Without Docker**
#### 2.1 Setup Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed:all
npm run start:dev
```
Backend runs on http://localhost:3000

#### 2.2 Setup Frontend
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

### **3️⃣ Run With Docker**
1.	Ensure Docker is running
2.	Run:
```bash
cd backend
cp .env.example .env

cd ../frontend
cp .env.example .env

cd ..
docker compose up --build
```
- **Frontend**: http://localhost:5173/login
- **Backend**: http://localhost:3000/
- **Postgres**: Accessible internally at postgres:5432

### ✅ Backend will automatically:
- Run migrations
- Seed admin, editor, and viewer test data
---
## 📜 API Documentation

The backend exposes the following main modules:
- **Auth Module**: /auth/register, /auth/login
- **User Module**: /users (Admin only)
- **Document Module**: /documents
- **Ingestion Module**: /ingestion

Detailed API documentation is available in the Design Decision Document (v1.0).

---

## 👤 Default Admin Credentials
```bash
Email: admin@document.com
Password: admin123
```
---
## 🧪 Health Check
To verify backend service is running:
```bash
curl http://localhost:3000/health
```
Returns:
```bash
{
  "status": "ok",
  "timestamp": "2025-08-02T10:00:00Z"
}
```
---
## 🔮 Future Enhancements
- ✅ Automated job retries for failed ingestions
- ✅ Notification service (email, WebSocket)
- ✅ Full RAG-based Q&A implementation (Phase 2 with Python API)
- ✅ Multi-tenant document management

---
## 📜 License
This project is licensed under the MIT License.
---
## 👨‍💻 Author

- **Dhawanit Bhatnagar** – [dhawanitbhatnagar@gmail.com](mailto:dhawanitbhatnagar@gmail.com)
- GitHub: [@dhawanit](https://github.com/dhawanit)
- LinkedIn: [Dhawanit Bhatnagar](https://in.linkedin.com/in/dhawanit-bhatnagar)