# DermavisionAI - Design Document

## System Architecture

### 1. High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │  External APIs  │
│   (Next.js)     │◄──►│   (Next.js API)  │◄──►│  - Hugging Face │
│                 │    │                  │    │  - Google AI    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│  Local Storage  │    │   SQLite DB      │
│  (Browser)      │    │   (Prisma)       │
└─────────────────┘    └──────────────────┘
```

### 2. Component Architecture

#### 2.1 Frontend Components Hierarchy
```
App (page.tsx)
├── SplashScreen
├── LanguageSelector
├── LandingPage
├── ScanPage
│   └── SkinScanner
├── TriagePage
├── ResultsPage
├── InformationPage
└── AboutPage
```

#### 2.2 Data Flow Architecture
```
User Input → Image Capture → Vision AI → Symptom Collection → LLM Analysis → Report Generation → Database Storage
```

## Detailed Design

### 3. Frontend Design

#### 3.1 State Management
```typescript
interface ScanSession {
  symptoms: string[]
  risk_score: number
  image_url: string | null
  vision_result?: { 
    label: string
    confidences: { label: string; confidence: number }[] 
  } | null
  llm_report?: string
  error?: string
}
```

#### 3.2 Screen Flow Design
```
Landing → Scan → Triage → Results
    ↑        ↓       ↓        ↓
    └────────┴───────┴────────┘
         (Reset Session)
```

#### 3.3 UI Component Design Patterns

**Color Scheme:**
- Primary: `derma-teal` (#0d9488)
- Secondary: `derma-teal-dark` (#0f766e)
- Background: `derma-white` (#ffffff)
- Accent: `derma-yellow` (#fbbf24)
- Surface: `derma-cream` (#fef7ed)

**Typography:**
- Headings: Inter font, bold weights (600-800)
- Body: Inter font, regular weight (400)
- UI Elements: Inter font, medium weight (500)

**Layout Patterns:**
- Mobile-first responsive design
- Full-height screens with fixed headers/footers
- Card-based content organization
- Grid layouts for symptom selection

### 4. Backend API Design

#### 4.1 API Endpoints

**Analysis Endpoint:**
```typescript
POST /api/analyze
Request: {
  image: string (base64)
  symptoms: string[]
  visionAnalysis?: VisionResult
}
Response: {
  result: string (LLM report)
  error?: string
}
```

**Database Endpoints:**
```typescript
GET /api/analyses
Query: { page?, limit?, riskLevel? }
Response: { analyses: SkinAnalysis[], pagination: PaginationInfo }

GET /api/analyses/[id]
Response: { analysis: SkinAnalysis }

PUT /api/analyses/[id]
Request: { notes?: string }
Response: { analysis: SkinAnalysis }

DELETE /api/analyses/[id]
Response: { success: boolean }
```

#### 4.2 Data Processing Pipeline

```typescript
// Vision AI Processing
const analyzeWithVisionAI = async (imageSrc: string) => {
  const blob = await base64ToBlob(imageSrc)
  const app = await Client.connect("Heckur0009/dermascan-api")
  const result = await app.predict("/predict", [blob])
  return result.data[0]
}

// LLM Report Generation
const generateReport = async (imageAnalysis, symptoms) => {
  const prompt = buildMedicalPrompt(imageAnalysis, symptoms)
  const response = await geminiModel.generateContent(prompt)
  return response.text()
}
```

### 5. Database Design

#### 5.1 Schema Design
```sql
-- SkinAnalysis Table
CREATE TABLE SkinAnalysis (
  id              TEXT PRIMARY KEY,
  imageBase64     TEXT NOT NULL,
  imagePath       TEXT,
  symptoms        TEXT NOT NULL,
  riskLevel       TEXT NOT NULL,
  skinConditions  TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  aiResponse      TEXT NOT NULL,
  confidence      REAL,
  analysisDate    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes           TEXT
);

-- Indexes
CREATE INDEX idx_analysisDate ON SkinAnalysis(analysisDate);
CREATE INDEX idx_riskLevel ON SkinAnalysis(riskLevel);
```

#### 5.2 Data Access Layer
```typescript
// Prisma Client Usage
const prisma = new PrismaClient()

// Save Analysis
const saveAnalysis = async (data: AnalysisData) => {
  return await prisma.skinAnalysis.create({
    data: {
      imageBase64: data.image,
      symptoms: JSON.stringify(data.symptoms),
      riskLevel: extractRiskLevel(data.aiResponse),
      skinConditions: JSON.stringify(data.conditions),
      recommendations: JSON.stringify(data.recommendations),
      aiResponse: data.aiResponse,
      confidence: data.confidence
    }
  })
}
```

### 6. Integration Design

#### 6.1 Hugging Face Integration
```typescript
interface VisionModelConfig {
  endpoint: "Heckur0009/dermascan-api"
  method: "/predict"
  inputFormat: Blob
  outputFormat: {
    label: string
    confidences: Array<{
      label: string
      confidence: number
    }>
  }
}
```

#### 6.2 Google AI Integration
```typescript
interface LLMConfig {
  model: "gemini-2.0-flash-exp"
  apiKey: process.env.GOOGLE_AI_API_KEY
  maxTokens: 2048
  temperature: 0.3
  systemPrompt: "Medical analysis assistant..."
}
```

#### 6.3 Error Handling Strategy
```typescript
const handleAIError = (error: Error, service: 'vision' | 'llm') => {
  console.error(`${service} AI Error:`, error)
  
  if (service === 'vision') {
    // Continue without vision analysis
    return { warning: "Vision analysis unavailable" }
  } else {
    // Show error to user for LLM failure
    return { error: "Report generation failed" }
  }
}
```

### 7. Security Design

#### 7.1 Data Protection
- **Local Storage**: All medical data stored locally in SQLite
- **API Security**: Environment variables for API keys
- **Image Handling**: Base64 encoding for secure storage
- **No Cloud Transmission**: Medical data never leaves user device

#### 7.2 Input Validation
```typescript
const validateAnalysisInput = (data: any) => {
  const schema = z.object({
    image: z.string().min(1),
    symptoms: z.array(z.string()).min(1),
    visionAnalysis: z.object({
      label: z.string(),
      confidences: z.array(z.object({
        label: z.string(),
        confidence: z.number()
      }))
    }).optional()
  })
  
  return schema.parse(data)
}
```

### 8. Performance Design

#### 8.1 Image Optimization
```typescript
const optimizeImage = (canvas: HTMLCanvasElement) => {
  // Fixed 300x300 resolution for consistency
  const context = canvas.getContext('2d')
  context.drawImage(video, 0, 0, 300, 300)
  
  // Compress to reduce storage size
  return canvas.toDataURL('image/jpeg', 0.8)
}
```

#### 8.2 Database Optimization
- **Indexing**: Date and risk level indexes for fast queries
- **Pagination**: Limit query results to prevent memory issues
- **Connection Pooling**: Prisma handles connection management

#### 8.3 Async Processing
```typescript
const processAnalysis = async (data: AnalysisInput) => {
  // Parallel processing where possible
  const [visionResult, savedAnalysis] = await Promise.all([
    analyzeWithVisionAI(data.image),
    saveToDatabase(data)
  ])
  
  // Sequential LLM processing (depends on vision result)
  const llmReport = await generateLLMReport(visionResult, data.symptoms)
  
  return { visionResult, llmReport, savedAnalysis }
}
```

### 9. User Experience Design

#### 9.1 Loading States
```typescript
interface LoadingStates {
  isVisionLoading: boolean    // Vision AI processing
  isLLMLoading: boolean      // Report generation
  isDatabaseLoading: boolean // Database operations
  isCameraLoading: boolean   // Camera initialization
}
```

#### 9.2 Error Recovery
```typescript
const ErrorBoundary = ({ error, retry }: ErrorProps) => (
  <div className="error-container">
    <h3>Something went wrong</h3>
    <p>{error.message}</p>
    <button onClick={retry}>Try Again</button>
    <button onClick={resetSession}>Start Over</button>
  </div>
)
```

#### 9.3 Progressive Enhancement
- **Core Functionality**: Works without JavaScript (basic form submission)
- **Enhanced Experience**: Full SPA experience with JavaScript
- **Offline Capability**: Database operations work offline

### 10. Accessibility Design

#### 10.1 WCAG Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order

#### 10.2 Responsive Design Breakpoints
```css
/* Mobile First */
.container {
  width: 100%;
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: 2rem;
  }
}
```

### 11. Testing Strategy

#### 11.1 Unit Testing
```typescript
// Component Testing
describe('SkinScanner', () => {
  it('should capture image when button clicked', () => {
    const mockCapture = jest.fn()
    render(<SkinScanner onCapture={mockCapture} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockCapture).toHaveBeenCalled()
  })
})

// API Testing
describe('/api/analyze', () => {
  it('should return analysis result', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({ image: 'base64...', symptoms: ['itching'] })
    
    expect(response.status).toBe(200)
    expect(response.body.result).toBeDefined()
  })
})
```

#### 11.2 Integration Testing
- **Database Operations**: Test CRUD operations
- **AI Service Integration**: Mock external API responses
- **File Upload/Camera**: Test image processing pipeline
- **PDF Generation**: Verify report formatting

#### 11.3 End-to-End Testing
```typescript
// E2E Test Flow
describe('Complete Analysis Flow', () => {
  it('should complete full analysis workflow', async () => {
    // Navigate to scan page
    await page.click('[data-testid="start-scan"]')
    
    // Upload image
    await page.setInputFiles('input[type="file"]', 'test-image.jpg')
    
    // Add symptoms
    await page.fill('textarea', 'itching, redness')
    
    // Generate report
    await page.click('[data-testid="generate-report"]')
    
    // Verify results
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible()
  })
})
```

### 12. Deployment Design

#### 12.1 Build Configuration
```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    domains: ['localhost']
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY
  }
}
```

#### 12.2 Environment Setup
```bash
# Development
npm run dev

# Production Build
npm run build
npm start

# Database Setup
npx prisma generate
npx prisma migrate dev
```

#### 12.3 Production Considerations
- **Database Migration**: Automated schema updates
- **Asset Optimization**: Image and CSS minification
- **Error Monitoring**: Logging and error tracking
- **Performance Monitoring**: Response time tracking
- **Security Headers**: CSP and security configurations

### 13. Monitoring and Analytics

#### 13.1 Application Metrics
- **Usage Analytics**: Screen transitions, feature usage
- **Performance Metrics**: API response times, database query performance
- **Error Tracking**: AI service failures, database errors
- **User Behavior**: Analysis completion rates, symptom patterns

#### 13.2 Health Checks
```typescript
// API Health Check
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: 'healthy', database: 'connected' })
  } catch (error) {
    return Response.json({ status: 'unhealthy', error: error.message }, { status: 500 })
  }
}
```

This design document provides a comprehensive technical blueprint for implementing and maintaining the DermavisionAI application, ensuring scalability, security, and user experience excellence.