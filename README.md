# LocalHero 🦸

**The Hyper-Local Content Generator for Local SEO**

LocalHero is a SaaS application that generates geo-targeted content for Local SEO agencies and multi-location businesses. It combines AI content generation with geospatial data to create authentic, location-specific content that ranks in Google Map Pack.

## 🎯 Problem Solved

Local SEO requires content that mentions specific local landmarks, schools, and intersections to rank well. Current AI tools produce generic content that fails to signal local relevance to Google. LocalHero solves this by:

1. **Fetching local landmarks** via Google Places API
2. **Injecting location-specific data** into AI-generated content
3. **Providing ready-to-post content** for Google Business Profile

## ✨ Features

- **Landmark Scraper**: Fetches schools, parks, museums, and POIs within your service radius
- **AI Content Generator**: Creates GBP posts, location pages, and social content with local mentions
- **Review Responder**: Generates personalized responses to customer reviews
- **Citation Audit**: Tracks your presence across 15+ business directories
- **Multi-Location Support**: Manage unlimited locations from one dashboard

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (Premium Design System) |
| Backend | Node.js + Express |
| Database | SQLite (sql.js) |
| AI | Google Gemini Flash |
| Geospatial | Google Places API |
| Testing | Jest + Vitest |

## 📁 Project Structure

```
LocalHero/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── app.js          # Express app
│   └── tests/              # Backend tests
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Auth context
│   │   ├── services/       # API service
│   │   └── App.jsx         # Main app
│   └── tests/              # Frontend tests
│
└── README.md
└── .github/
    └── workflows/
        └── ci.yml          # GitHub Actions CI workflow
└── Jenkinsfile             # Jenkins CI/CD pipeline
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Places API key
- Google Gemini API key

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

The backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on `http://localhost:5173`

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_PLACES_API_KEY=your-google-places-api-key
GEMINI_API_KEY=your-gemini-api-key
DATABASE_PATH=./data/localhero.db
```

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
```

### Frontend Tests

```bash
cd frontend
npm test              # Run all tests
npm run test:coverage # With coverage
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Locations
- `GET /api/locations` - List all locations
- `POST /api/locations` - Create location
- `GET /api/locations/:id` - Get location details
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Landmarks
- `GET /api/locations/:id/landmarks` - Get cached landmarks
- `POST /api/locations/:id/refresh-landmarks` - Fetch fresh landmarks

### Content Generation
- `POST /api/locations/:id/content/gbp-post` - Generate GBP post
- `POST /api/locations/:id/content/location-page` - Generate location page
- `POST /api/locations/:id/content/social-posts` - Generate social posts
- `GET /api/locations/:id/content` - Get content history

### Reviews
- `GET /api/locations/:id/reviews` - List reviews
- `POST /api/locations/:id/reviews` - Add review
- `POST /api/locations/:id/reviews/:reviewId/generate-response` - Generate response
- `PUT /api/locations/:id/reviews/:reviewId/response` - Save response

### Citations
- `GET /api/locations/:id/citations` - Get citation audit
- `PUT /api/locations/:id/citations/:citationId` - Update citation status

## 💰 Pricing Model

- **Per-Location**: $29/location/month
- **Agency Bundle**: $199/month for up to 10 locations, $15/location thereafter

## 🔒 API Cost Management

Google Places API costs $17 per 1000 requests. We implement aggressive caching:

1. Landmarks are cached for 30 days per location
2. Refresh is a manual action (not automatic)
3. Each content generation uses cached landmarks
4. OpenAI token usage is logged

## 📋 MVP Scope

**Included in MVP:**
- ✅ Landmark fetching from Google Places API
- ✅ AI content generation with local data injection
- ✅ Review response generation
- ✅ Citation audit checklist
- ✅ Dashboard for content management

**Deferred to v2:**
- ⏳ Google Business Profile auto-posting (requires 2-4 week API approval)
- ⏳ Scheduled post calendar
- ⏳ White-label agency features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for Local SEO professionals
