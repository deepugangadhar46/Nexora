# 🚀 NEXORA - AI-Powered Startup Generation Platform

<div align="center">

![NEXORA Logo](frontend/public/logo.svg)

**Transform Your Ideas into Reality with AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18.3-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**NEXORA** is a comprehensive AI-powered platform that helps entrepreneurs and startups transform their ideas into fully functional MVPs. Using cutting-edge AI models (DeepSeek, Groq, Kimi), NEXORA provides:

- 💡 **Idea Validation** - Analyze market viability with AI-powered insights
- 🏗️ **MVP Development** - Generate production-ready code instantly
- 📊 **Market Research** - Deep competitive analysis and market trends
- 📈 **Business Planning** - Comprehensive business plans with financial projections
- 🎯 **Pitch Deck Generation** - Professional investor-ready presentations
- 🤝 **Team Collaboration** - Real-time collaboration tools

---

## ✨ Features

### 🎨 **MVP Builder**
- **AI Code Generation** - Generate React, Vue, or vanilla JS applications
- **Real-time Preview** - Live sandbox environment powered by E2B
- **Multi-Model Support** - DeepSeek, Groq, and Kimi AI models
- **Smart Code Editing** - Context-aware code modifications
- **Package Detection** - Automatic dependency management

### 📊 **Business Intelligence**
- **Idea Validation Reports** - PDF reports with market analysis
- **Competitive Analysis** - Identify competitors and market gaps
- **Financial Projections** - Revenue forecasts and cost analysis
- **Market Sizing** - TAM, SAM, SOM calculations

### 🎯 **Professional Outputs**
- **Business Plans** - DOCX format with comprehensive sections
- **Pitch Decks** - PPTX presentations with professional design
- **Market Research** - Detailed industry analysis
- **Export Options** - Multiple format support

### 🔐 **Enterprise Features**
- **Authentication** - JWT + OAuth (Google, GitHub)
- **Subscription Management** - Tiered pricing with Stripe/Razorpay
- **Credit System** - Usage-based billing
- **Team Collaboration** - Multi-user workspaces
- **API Access** - RESTful API for integrations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │MVP Builder│  │ Research │  │ Business │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ MVP Builder    │  │ Idea Validator │  │ Business     │  │
│  │ Agent          │  │ Agent          │  │ Plan Agent   │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ Market Research│  │ Pitch Deck     │  │ Auth &       │  │
│  │ Agent          │  │ Agent          │  │ Payments     │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │DeepSeek  │  │  Groq    │  │  Kimi    │  │  E2B     │   │
│  │   AI     │  │   AI     │  │   AI     │  │ Sandbox  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │FireCrawl │  │  Stripe  │  │Razorpay  │  │  MySQL   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18.3 + TypeScript
- **Build Tool**: Vite 7.1
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: TailwindCSS 3.4
- **State Management**: Zustand 4.5
- **Routing**: React Router 6.26
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion 12.23
- **Icons**: Lucide React

### **Backend**
- **Framework**: FastAPI 0.109
- **Language**: Python 3.11+
- **Database**: MySQL 8.2 (Aiven Cloud)
- **Caching**: Redis 5.0 (Optional)
- **Authentication**: JWT + OAuth2
- **Payment**: Stripe + Razorpay
- **AI Models**: DeepSeek, Groq, Kimi
- **Sandbox**: E2B
- **Web Scraping**: FireCrawl

### **DevOps**
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Sentry
- **Rate Limiting**: SlowAPI
- **Testing**: Pytest + React Testing Library
- **CI/CD**: GitHub Actions (Ready)

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** (or Bun)
- **MySQL 8.0+**
- **Redis** (Optional, for caching)
- **API Keys** (See [Configuration](#configuration))

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/nexora.git
cd nexora
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Initialize database
python database.py

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or: bun install

# Configure environment
cp .env.example .env
# Edit .env with your backend URL

# Run development server
npm run dev
# or: bun dev
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ⚙️ Configuration

### Required Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

#### Backend `.env`

```env
# Database
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=nexora

# AI Models (At least one required)
HF_TOKEN=your_huggingface_token          # For DeepSeek
GROQ_API_KEY=your_groq_api_key
KIMI_API_KEY=your_kimi_api_key

# External Services
E2B_API_KEY=your_e2b_api_key             # For sandbox
FIRECRAWL_API_KEY=your_firecrawl_key     # For web scraping

# Authentication
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_secret

# Payments
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_public
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Optional
REDIS_URL=redis://localhost:6379
SENTRY_DSN=your_sentry_dsn
```

#### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000
VITE_SENTRY_DSN=your_sentry_dsn
```

### API Keys Setup

1. **Hugging Face** (DeepSeek): https://huggingface.co/settings/tokens
2. **Groq**: https://console.groq.com/keys
3. **Kimi**: https://platform.moonshot.cn/
4. **E2B**: https://e2b.dev/
5. **FireCrawl**: https://firecrawl.dev/
6. **Stripe**: https://dashboard.stripe.com/apikeys
7. **Razorpay**: https://dashboard.razorpay.com/app/keys

---

## 📖 Usage

### Creating Your First MVP

1. **Sign Up** - Create an account (20 free credits)
2. **Navigate to MVP Builder** - Click "MVP Development"
3. **Describe Your Idea** - Enter your project description
4. **Generate Code** - AI creates your application
5. **Preview & Edit** - Test in live sandbox
6. **Download** - Export your project

### Validating an Idea

1. **Go to Idea Validation**
2. **Enter Idea Details** - Describe your concept
3. **AI Analysis** - Get market insights
4. **Download Report** - PDF with comprehensive analysis

### Creating a Business Plan

1. **Navigate to Business Planning**
2. **Fill Business Details** - Company info, market, etc.
3. **Generate Plan** - AI creates comprehensive plan
4. **Export** - Download as DOCX or PDF

---

## 📚 API Documentation

### Interactive API Docs

Visit http://localhost:8000/docs for interactive Swagger documentation.

### Key Endpoints

#### Authentication
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/user/{user_id}
```

#### MVP Builder
```http
POST /api/v1/mvp/generate
POST /api/v1/mvp/edit
POST /api/v1/sandbox/create
POST /api/v1/sandbox/update
```

#### Idea Validation
```http
POST /api/idea-validation/validate
GET  /api/idea-validation/report/{report_id}
```

#### Business Planning
```http
POST /api/business-plan/generate
GET  /api/business-plan/download/{plan_id}
```

### Example Request

```bash
curl -X POST "http://localhost:8000/api/v1/mvp/generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a todo app with React",
    "model": "deepseek"
  }'
```

---

## 🐳 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

See [DEPLOYMENT.md](backend/DEPLOYMENT.md) for detailed production deployment guide including:
- AWS/GCP/Azure deployment
- Environment configuration
- Database setup
- SSL/TLS configuration
- Monitoring setup

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=.
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Integration Tests

```bash
# Run all tests
npm run test:all
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Style

- **Python**: Follow PEP 8, use Black formatter
- **TypeScript**: Follow Airbnb style guide, use ESLint
- **Commits**: Use conventional commits

---

## 📊 Project Status

- ✅ MVP Builder - Production Ready
- ✅ Idea Validation - Production Ready
- ✅ Business Planning - Production Ready
- ✅ Market Research - Production Ready
- ✅ Pitch Deck - Production Ready
- ✅ Authentication - Production Ready
- ✅ Payment Integration - Production Ready
- 🚧 Team Collaboration - In Development
- 🚧 API Access - In Development

---

## 🔒 Security

- **Authentication**: JWT with secure token rotation
- **Authorization**: Role-based access control
- **Data Encryption**: TLS 1.3 for all communications
- **Input Validation**: Comprehensive validation with Pydantic
- **Rate Limiting**: Protection against abuse
- **SQL Injection**: Parameterized queries
- **XSS Protection**: Input sanitization with Bleach

Report security vulnerabilities to: security@nexora.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **AI Models**: DeepSeek, Groq, Kimi
- **UI Components**: shadcn/ui
- **Sandbox**: E2B
- **Web Scraping**: FireCrawl
- **Icons**: Lucide React

---

## 📞 Support

- **Documentation**: https://docs.nexora.com
- **Email**: support@nexora.com
- **Discord**: https://discord.gg/nexora
- **GitHub Issues**: https://github.com/yourusername/nexora/issues

---

## 🗺️ Roadmap

### Q1 2025
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Custom AI model training
- [ ] White-label solution

### Q2 2025
- [ ] Multi-language support
- [ ] Advanced team features
- [ ] API marketplace
- [ ] Enterprise SSO

---

<div align="center">

**Made with ❤️ by the NEXORA Team**

[Website](https://nexora.com) • [Twitter](https://twitter.com/nexora) • [LinkedIn](https://linkedin.com/company/nexora)

</div>
