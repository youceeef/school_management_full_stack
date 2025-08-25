# EduSpace: Educational Resource Management System

`EduSpace (ES)` is a **full‑stack web application** developed as a Final Formation Project for the **2025/2026** academic year.  
It modernizes the administrative and resource management processes within educational institutions in **Tunisia**, providing a **centralized platform** for classrooms, equipment, reservations, and documents — replacing traditional, manual methods.

Developed by **Youssef KAABECHI**.

---

## 📚 Table of Contents

- [Features](#-features)
- [User Roles](#-user-roles)
- [System Architecture & Diagrams](#-system-architecture--diagrams)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#️-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Screenshots & Previews](#-screenshots--previews)
- [Future Perspectives](#-future-perspectives)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Features

Based on the **Agile Scrum methodology**, EduSpace delivers:

- **👤 Secure Authentication**: Email/password login & “Forgot Password” recovery
- **🔐 Role-Based Access Control**: Granular permissions with `spatie/laravel-permission`
- **🏢 Room & Equipment Management**: Full CRUD operations
- **🗓️ Advanced Reservation System**:
  - Teachers create reservation requests
  - Lab Managers approve/reject requests
- **📅 Interactive Calendar**: Real‑time availability view
- **📄 Document Management**: Upload, share, download course materials
- **🔔 Notifications**: For reservation status and updates
- **🎨 Dual Theme UI**: Light and dark modes

**Feature Previews:**
![Login Page](screenshots/login.png)
![Dashboard Light](screenshots/dashboard-light.png)
![Dashboard Dark](screenshots/dashboard-dark.png)

---

## 👥 User Roles

1. **Administrator** — Full system control (users, roles, rooms, equipment)
2. **Teacher** — Profile management, resource reservations, upload docs
3. **Student** — Access/download shared materials, profile management
4. **Lab Manager** — Validate and manage reservations

**Role Management Preview:**  
![Role Management](screenshots/roles.png)

---

## 🧠 System Architecture & Diagrams

- **Use Case Diagrams** — Global & role‑specific
- **Database Schema (MLD)** — Relational mapping of all entities
- **UML Class Diagram** — Entities with attributes & methods

**Examples:**
![Global Use Case](screenshots/usecase-global.png)  
![Database Schema](screenshots/db-schema.png)

---

## 🛠 Tech Stack

### Backend

- [PHP ^8.1](https://www.php.net/)
- [Laravel ^10.10](https://laravel.com/)
- [Laravel Sanctum](https://laravel.com/docs/10.x/sanctum)
- [Spatie/laravel-permission](https://spatie.be/docs/laravel-permission/v6/introduction)
- [Composer](https://getcomposer.org/)

### Frontend

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/)
- [React Context](https://react.dev/learn/passing-data-deeply-with-context)

### Database

- [MySQL](https://www.mysql.com/)

---

## ⚙️ Prerequisites

- PHP >= 8.1
- Composer
- Node.js & NPM
- MySQL

---

## 🧩 Installation

### 1. Clone the repository

```sh
git clone https://github.com/your-username/EduSpace.git
cd EduSpace
```

### 2. Backend setup

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 3. Frontend setup

```sh
cd ../front
npm install
cp .env.example .env.local
# Set backend API URL in .env.local
npm start
```

Frontend will run at : http://localhost:3000

### 3. Usage
