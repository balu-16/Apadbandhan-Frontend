<p align="center">
  <img src="https://img.shields.io/badge/Platform-AIoT-blue?style=for-the-badge" alt="Platform"/>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/NestJS-Backend-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/License-Private-red?style=for-the-badge" alt="License"/>
</p>

<h1 align="center">Apadbandhav</h1>

<p align="center">
  <strong>AIoT-Powered Accident Detection & Emergency Response Platform</strong>
</p>

<p align="center">
  <em>Saving lives through intelligent real-time accident detection and automated emergency response</em>
</p>

---

## Overview

**Apadbandhav** is an innovative AIoT (Artificial Intelligence of Things) platform designed to detect accidents in real-time and automatically trigger emergency response protocols. The system combines smart IoT devices with a powerful web platform to ensure rapid assistance when accidents occur.

### Key Features

| Feature | Description |
|---------|-------------|
| **Real-time Detection** | AIoT devices detect accidents instantly using advanced sensors |
| **Automated Alerts** | Immediate notifications to emergency contacts and services |
| **Device Management** | Register and manage multiple AIoT devices per user |
| **Location Tracking** | Precise GPS-based location for quick emergency response |
| **Insurance Storage** | Securely store health, vehicle, and term insurance details |
| **Emergency Contacts** | Manage emergency contacts for each registered device |
| **Admin Dashboard** | Comprehensive analytics and alert management |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Component Library |
| **React Query** | Data Fetching |
| **React Router** | Navigation |
| **Leaflet** | Maps & Location |
| **Recharts** | Data Visualization |
| **Socket.IO** | Real-time Updates |

### Backend
| Technology | Purpose |
|------------|---------|
| **NestJS** | API Framework |
| **TypeORM** | Database ORM |
| **PostgreSQL** | Database |
| **Passport JWT** | Authentication |
| **Swagger** | API Documentation |

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **PostgreSQL** (for backend)

### Frontend Setup

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd apadbandhav

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your database settings in .env

# Start development server
npm run start:dev
```

API documentation available at `http://localhost:3000/api/docs`

---

## Project Structure

```
apadbandhav/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Application pages
│   ├── services/       # API services
│   └── lib/            # Utility functions
├── backend/
│   ├── src/
│   │   ├── auth/       # Authentication module
│   │   ├── users/      # User management
│   │   ├── devices/    # Device management
│   │   ├── alerts/     # Alert system
│   │   └── common/     # Shared utilities
│   └── ...
└── ...
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP and login |
| POST | `/api/auth/signup` | Register new user |
| GET | `/api/auth/me` | Get current user |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/devices` | Register device |
| GET | `/api/devices` | List user devices |
| PATCH | `/api/devices/:id` | Update device |
| DELETE | `/api/devices/:id` | Remove device |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/alerts` | Create alert (AIoT) |
| GET | `/api/alerts` | List all alerts |
| GET | `/api/alerts/stats` | Alert statistics |
| PATCH | `/api/alerts/:id/status` | Update alert status |

---

## AIoT Device Integration

Send accident alerts from your AIoT device:

```json
POST /api/alerts
{
  "deviceCode": "1234567890123456",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Location Address",
  "type": "accident",
  "severity": "high"
}
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Contributing

This is a private project. Please contact the maintainers for contribution guidelines.

---

## License

**Private** - All Rights Reserved

---

<p align="center">
  <strong>Built with care by NighaTech</strong>
</p>
