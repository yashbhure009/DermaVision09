# DermavisionAI - Requirements Document

## Project Overview

DermavisionAI is an AI-powered dermatological screening application that combines computer vision and large language models to provide preliminary skin lesion analysis. The application enables users to capture or upload images of skin lesions, describe symptoms, and receive AI-generated risk assessments and recommendations.

## Functional Requirements

### 1. Core Features

#### 1.1 Image Capture & Upload
- **FR-001**: Users must be able to capture images using device camera (webcam/mobile camera)
- **FR-002**: Users must be able to upload images from device gallery
- **FR-003**: System must support common image formats (PNG, JPEG, JPG)
- **FR-004**: Camera interface must provide real-time preview with 300x300px capture area
- **FR-005**: System must handle both front and rear camera access (environment facing preferred)

#### 1.2 Symptom Assessment
- **FR-006**: Users must be able to input symptoms via free-text description
- **FR-007**: System must provide quick-select symptom suggestions (12 predefined red-flag symptoms)
- **FR-008**: Users must be able to add/remove symptoms dynamically
- **FR-009**: System must validate that at least one symptom is provided before analysis

#### 1.3 AI Analysis
- **FR-010**: System must integrate with Hugging Face vision model for image analysis
- **FR-011**: System must use Google Gemini 2.5 for clinical report generation
- **FR-012**: Vision analysis must provide confidence scores and label predictions
- **FR-013**: LLM must generate comprehensive reports combining image analysis and symptoms
- **FR-014**: System must handle AI service failures gracefully with appropriate error messages

#### 1.4 Risk Assessment & Reporting
- **FR-015**: System must categorize risk levels (Low, Medium, High)
- **FR-016**: High/Medium risk cases must trigger doctor locator functionality
- **FR-017**: System must generate downloadable PDF reports with analysis results
- **FR-018**: Reports must include metadata (report ID, timestamp, symptoms, analysis type)
- **FR-019**: System must provide medical disclaimers on all reports

#### 1.5 Data Persistence
- **FR-020**: All analyses must be automatically saved to local SQLite database
- **FR-021**: Users must be able to view analysis history with pagination
- **FR-022**: Users must be able to filter analyses by risk level
- **FR-023**: Users must be able to add/edit notes on saved analyses
- **FR-024**: Users must be able to delete individual analyses
- **FR-025**: System must store images as base64 encoded strings

### 2. User Interface Requirements

#### 2.1 Multi-language Support
- **FR-026**: Application must support multiple languages (English as primary)
- **FR-027**: Language selector must be accessible from main interface
- **FR-028**: All UI text must be translatable via centralized translation system

#### 2.2 Navigation & User Experience
- **FR-029**: Application must provide intuitive screen-to-screen navigation
- **FR-030**: Users must be able to start new scans from any screen
- **FR-031**: System must provide loading states for all async operations
- **FR-032**: Application must be responsive across desktop and mobile devices

#### 2.3 Accessibility & Usability
- **FR-033**: Interface must follow accessibility best practices
- **FR-034**: Color scheme must provide sufficient contrast ratios
- **FR-035**: Interactive elements must have appropriate touch targets (44px minimum)
- **FR-036**: System must provide clear error messages and recovery options

### 3. Integration Requirements

#### 3.1 External Services
- **FR-037**: Integration with Hugging Face model "Heckur0009/dermascan-api"
- **FR-038**: Integration with Google Gemini 2.5 API for text generation
- **FR-039**: Integration with Google Maps for doctor location services
- **FR-040**: All external API calls must include proper error handling and timeouts

#### 3.2 Data Export
- **FR-041**: PDF generation must work offline without external dependencies
- **FR-042**: Reports must be printable with proper formatting
- **FR-043**: System must support data export for analysis history

## Non-Functional Requirements

### 4. Performance Requirements

#### 4.1 Response Times
- **NFR-001**: Image capture must complete within 2 seconds
- **NFR-002**: Vision AI analysis must complete within 30 seconds
- **NFR-003**: LLM report generation must complete within 45 seconds
- **NFR-004**: Database queries must return results within 1 second
- **NFR-005**: PDF generation must complete within 5 seconds

#### 4.2 Scalability
- **NFR-006**: Database must handle up to 10,000 analysis records per user
- **NFR-007**: Application must support concurrent analysis requests
- **NFR-008**: Image storage must be optimized for space efficiency

### 5. Security Requirements

#### 5.1 Data Protection
- **NFR-009**: All medical data must be stored locally (no cloud transmission)
- **NFR-010**: API keys must be stored securely in environment variables
- **NFR-011**: Image data must be encrypted at rest
- **NFR-012**: System must not log sensitive medical information

#### 5.2 Privacy
- **NFR-013**: No personal health information should be transmitted to third parties
- **NFR-014**: Users must be informed about data collection and usage
- **NFR-015**: System must provide data deletion capabilities

### 6. Reliability Requirements

#### 6.1 Error Handling
- **NFR-016**: System must gracefully handle network connectivity issues
- **NFR-017**: Application must recover from AI service timeouts
- **NFR-018**: Database operations must include transaction rollback capabilities
- **NFR-019**: System must provide meaningful error messages to users

#### 6.2 Availability
- **NFR-020**: Core functionality must work offline (except AI analysis)
- **NFR-021**: Application must handle browser refresh without data loss
- **NFR-022**: System must maintain state during navigation

### 7. Compatibility Requirements

#### 7.1 Browser Support
- **NFR-023**: Must support modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **NFR-024**: Must support mobile browsers on iOS and Android
- **NFR-025**: Camera access must work across supported browsers

#### 7.2 Device Support
- **NFR-026**: Must support desktop computers with webcams
- **NFR-027**: Must support mobile devices with cameras
- **NFR-028**: Must adapt to various screen sizes (320px to 1920px width)

### 8. Compliance Requirements

#### 8.1 Medical Compliance
- **NFR-029**: All outputs must include appropriate medical disclaimers
- **NFR-030**: System must not provide definitive medical diagnoses
- **NFR-031**: Recommendations must emphasize professional medical consultation
- **NFR-032**: System must comply with medical software guidelines for screening tools

#### 8.2 Data Compliance
- **NFR-033**: Must comply with local data protection regulations
- **NFR-034**: Must provide clear privacy policy and terms of use
- **NFR-035**: Must allow users to control their data (view, edit, delete)

## Technical Constraints

### 9. Technology Stack
- **TC-001**: Frontend must use Next.js 16+ with React 19+
- **TC-002**: Database must use SQLite with Prisma ORM
- **TC-003**: Styling must use Tailwind CSS
- **TC-004**: UI components must use Radix UI primitives
- **TC-005**: TypeScript must be used for type safety

### 10. External Dependencies
- **TC-006**: Hugging Face Gradio Client for vision model integration
- **TC-007**: Google Generative AI SDK for LLM integration
- **TC-008**: Browser MediaDevices API for camera access
- **TC-009**: Canvas API for image processing
- **TC-010**: File API for image upload handling

## Success Criteria

### 11. Acceptance Criteria
- **AC-001**: Users can successfully capture and analyze skin lesions end-to-end
- **AC-002**: AI analysis provides meaningful risk assessments and recommendations
- **AC-003**: All analyses are properly saved and retrievable from history
- **AC-004**: PDF reports contain all necessary information and disclaimers
- **AC-005**: Application works reliably across target devices and browsers
- **AC-006**: High-risk cases properly trigger doctor locator functionality
- **AC-007**: System handles AI service failures without crashing
- **AC-008**: Multi-language support works correctly
- **AC-009**: Database operations complete successfully with proper error handling
- **AC-010**: Application meets performance benchmarks for response times

## Future Enhancements

### 12. Potential Features
- **FE-001**: Integration with additional AI models for improved accuracy
- **FE-002**: Telemedicine integration for direct doctor consultations
- **FE-003**: Progress tracking for lesion monitoring over time
- **FE-004**: Advanced analytics and reporting dashboard
- **FE-005**: Cloud synchronization for multi-device access
- **FE-006**: Integration with electronic health records (EHR)
- **FE-007**: Machine learning model training on user feedback
- **FE-008**: Advanced image preprocessing and enhancement
- **FE-009**: Integration with wearable devices for automated monitoring
- **FE-010**: Social features for sharing with healthcare providers