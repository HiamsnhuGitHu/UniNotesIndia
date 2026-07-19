# 📑 UniNotes India - Project Setup & Reproduction Guide

UniNotes India is a full-stack, containerized university study resource portal built for JAIPUR-based engineering universities. It provides folders navigation, star reviews, bookmarks, downloads tracking, admin approvals queue, and mock verification tokens.

---

## 🏗️ 1. Architecture & Technology Stack

1. **Frontend**: Vite + React (v19) + Tailwind CSS (v4.0) with Vite-plugin-PWA.
2. **Backend**: Spring Boot 3.3.x (Java 17) + MongoDB + JJWT security (v0.11.5) + TokenBucket rate limiting filter.
3. **DevOps**: Docker Compose orchestrating three containers: MongoDB, Nginx (acting as a reverse proxy serving the frontend and forwarding API/media requests to the backend), and the Spring Boot backend.

---

## 📂 2. Directory Layout

```text
/
├── backend/
│   ├── src/main/java/com/uninotes/india/
│   │   ├── config/             # Security, CORS, RateLimiting, MongoListener, WebMvcConfig
│   │   ├── controller/         # Auth, Note, Directory, NoteRequest, Admin Controllers
│   │   ├── dto/                # Login, Register, Stats DTOs
│   │   ├── entity/             # User, Note, Subject, University, Branch, etc.
│   │   ├── repository/         # Spring Data MongoDB Repositories
│   │   ├── service/            # AuthService, NoteService, FileStorageService, SequenceGenerator
│   │   └── UniNotesApplication.java
│   ├── src/main/resources/application.yml
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # Dashboard, Browse, Requests, Upload, Profile, Admin
│   │   ├── services/           # api.js Axios Client
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 💾 3. Database Schema Design (MongoDB)

Since MongoDB uses UUIDs or ObjectIds by default, a custom sequential auto-incrementing integer ID mechanism is implemented using a special collection named `database_sequences`.

### Sequence Generation System
- **DatabaseSequence**: Document storing sequence counters (`id` and `seq`).
- **MongoIdGeneratorListener**: An implementation of `BeforeConvertCallback<Object>` using reflection. If numeric `id` is null or `0`, it queries `SequenceGeneratorService` to generate the next sequence key based on the plural collection name and updates `updatedAt` and `createdAt` automatically.

---

## 🔒 4. Security & Middlewares

### 1. TokenBucket Rate Limiting Filter (`RateLimitingFilter`)
- Limiters mapped using a `ConcurrentHashMap` with client IP as the key.
- Resolves client IP handling Nginx proxies using the `X-Forwarded-For` header.
- Token bucket rules: Max 100 requests refilled continuously over 60 seconds.
- Rejects requests exceeding limits with HTTP status `429 (Too Many Requests)` and JSON payload `{"error": "Too many requests. Please try again in a minute."}`.

### 2. Spring Security Chain (`SecurityConfig`)
- JWT Validation: Adds `JwtAuthenticationFilter` reading token from `Authorization: Bearer <token>`.
- JWT Token Provider: Creates token using `SignatureAlgorithm.HS256`, injecting the claims: `username` and `role`. Expiry defaults to 24 hours.
- Route policies:
  - Public routes: `/api/auth/**`, GET endpoints for `/api/universities/**`, `/api/branches/**`, `/api/subjects/**`, and `/api/notes/search` or `/uploads/**`.
  - Admin endpoints: `/api/admin/**` requires `ROLE_ADMIN` or `ROLE_SUBADMIN`.
  - Create endpoints (like `/api/notes/upload`, `/api/subjects`): Requires `ROLE_STUDENT` or higher.
- CORS rules: Allow credentials, headers (`Authorization`, `Content-Type`), methods (`GET`, `POST`, `PUT`, `DELETE`).

### 3. Database Seeding (`DatabaseSeeder`)
- Runs on startup.
- Seeds default accounts:
  - Admin: Username `admin`, Password `admin123`
  - Student: Username `student`, Password `password123`
- Seeds 10 Jaipur-based Universities.
- Seeds 15 engineering branches.
- Seeds 8 semesters of core Computer Science Engineering subjects.

---

## 🌐 5. REST API Endpoints Specifications

### Authentication `/api/auth`
- `POST /login`: Validates credentials. Suspended users (`enabled=false`) or unverified users are rejected with `403` or `401` respectively. Returns JWT token and UserDto.
- `POST /register`: Registers student, generates 6-digit email token, sets `enabled=false`, and dispatches mock verification mail log output.
- `POST /verify-email`: Accepts `email` and `token` (also accepts backdoor validation key `123456` for testing). Sets `enabled=true`.
- `POST /forgot-password` & `POST /reset-password`: Implements token generation, mock email logging, and password updating.

### Notes Shares `/api/notes`
- `GET /search`: Evaluates parameters: `universityId`, `branchId`, `semester`, `subjectId`, and regex query checking text titles, descriptions, branch names, or subject names. Only searches notes with `status = "APPROVED"`.
- `POST /upload` (multipart/form-data): Standard students upload notes. File uploaded is physically stored on disk in the location set by `app.upload.dir`. Sets note `status = "PENDING"`. Admin/SubAdmin uploads are auto-approved (`APPROVED`).
- `GET /download/{id}`: Returns physical file as response stream, increments `downloadCount`, and logs entry into `DownloadHistory`.
- `GET /preview/{id}`: Serves inline rendering with dynamically evaluated Content-Type (e.g. PDF/Image preview).

---

## 🚀 6. How to Build & Run the App

### Option A: Running with Docker Compose (Recommended)
1. Ensure Docker is running.
2. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. Access the platform in your browser at:
   `http://localhost`

### Option B: Running Locally for Development

#### 1. Database Setup
- Set up and run MongoDB.
- Configure URI settings in `backend/src/main/resources/application.yml`.

#### 2. Build and Start Backend
- Move to `backend/` directory.
- Build and compile:
  ```bash
  mvn clean install
  ```
- Start the server (runs on `8080`):
  ```bash
  mvn spring-boot:run
  ```

#### 3. Build and Start Frontend
- Move to `frontend/` directory.
- Install node dependencies:
  ```bash
  npm install
  ```
- Start Vite local dev server (runs on `5173` with proxy mapping to `8080`):
  ```bash
  npm run dev
  ```
- Open `http://localhost:5173` in your browser.

---

## 🧪 7. Manual Verification Guidelines

1. **Email Verification Backdoor**: When registering, you can verify your account by using the code `123456` on the verification screen instead of copying the UUID generated in the server logs.
2. **Admin Credentials**: Use Username `admin`, Password `admin123` to log in as admin, moderate uploads, create directories, and dispatch announcements.
3. **Student Credentials**: Use Username `student`, Password `password123` to log in as a student, browse, download, bookmark, and upload files.
