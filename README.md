# 🩺 DermaVision AI  
### Skin Disease & Early Skin Cancer Detection using Hybrid Intelligence

<p align="center">
  <img src="https://img.shields.io/badge/AI-Medical-blue" />
  <img src="https://img.shields.io/badge/Status-Active-success" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

> **Early detection saves lives.**  
> DermaVision AI is a multimodal skin lesion screening system that combines a deep learning vision model with a large language model to deliver **accurate, explainable, and accessible** early skin cancer risk assessment.

---

## 🚨 Problem Statement
Skin cancer—especially **melanoma**—is highly treatable when detected early.  
Yet millions suffer due to:

- Limited access to dermatologists (rural & semi-urban regions)
- Long waiting times for specialist consultations
- Anxiety caused by benign moles mistaken as cancer
- General practitioners lacking instant triage tools

This leads to delayed diagnosis, panic, and preventable health risks.

---

## 👥 Users & Use Cases

### 🎯 Target Users
- Individuals concerned about skin lesions  
- Rural and semi-urban populations  
- General Practitioners (GPs) and primary healthcare workers  

### 🧪 Use Cases
- 📱 **Home screening** using a smartphone camera  
- 🏥 **Preliminary clinic screening** before dermatologist referral  
- 🩺 **Second opinion system** to assist doctors or reassure patients  
- ⚡ **Rapid triage** to prioritize high-risk cases  

> ⚠️ *DermaVision AI does NOT replace a dermatologist. It acts as a screening and second-opinion support tool.*

---

## 💡 Solution Overview — Hybrid Intelligence Architecture

DermaVision AI follows a **Human-Inspired Diagnostic Flow** by combining vision and reasoning.

### 👁️ The Eye — Vision Model
A fine-tuned **EfficientNet-B2 CNN** analyzes dermoscopic images using the **ABCDE Rule of Melanoma**:

- **A – Asymmetry**
- **B – Border irregularity**
- **C – Color variation**
- **D – Diameter**
- **E – Evolution**

The model outputs:
- Lesion class
- Confidence score
- Risk probability distribution

---

### 🧠 The Brain — Multimodal LLM
**Google Gemini 2.5 (Free Tier)** acts as the reasoning engine:

- Examines the **same image**
- Interprets **CNN confidence scores**
- Analyzes **patient-reported symptoms**
- Generates **explainable, empathetic medical reports**

---

## 🏗️ System Architecture

Skin Image
   ↓
(1) Your CNN / ViT model → prediction + confidence
   ↓
(2) Multimodal LLM → looks at the SAME image + model output
   ↓
Clinical + visual explanation


---

## 🧰 Tech Stack

### 🎨 Frontend
![React](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3)

### ⚙️ Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python)

### 🤖 AI / ML
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow)
![Keras](https://img.shields.io/badge/Keras-D00000?style=for-the-badge&logo=keras)
![Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google)

---

## 📊 Models & Data

### 🧪 Vision Model (CNN)
- **Architecture:** EfficientNet-B2  
- **Framework:** TensorFlow / Keras  
- **Dataset:** HAM10000 (10,000+ dermatoscopic images)  
- **Classes:**  
  `akiec, bcc, bkl, df, mel, nv, vasc, other`

### ⚙️ Training Configuration
##```python
BATCH_SIZE = 32
TOTAL_EPOCHS = 15
NUM_CLASSES = 8

Optimized for medical sensitivity

Class imbalance handled

Fine-tuned on dermoscopic features

###🧠 Large Language Model (LLM)

Engine: Google Gemini 2.5 (Free Tier via AI Studio)

Capabilities:

Image understanding

Medical reasoning

Risk explanation

Patient-friendly reporting

Role: Converts raw predictions into actionable insights

###🛡️ Evaluation & Guardrails
✅ Two-Key Hybrid Verification

The system cross-checks:

CNN confidence score

Patient-reported symptoms

Example:
Vision says “Benign” but symptom = bleeding → Risk elevated

###🚫 Hallucination Mitigation

LLM is restricted to:

Vision output

User-provided symptoms

No invented medical history

###🚑 Urgency Guardrails

High-risk outputs trigger:

Visual alerts

“Locate Doctor” CTA

Encourages immediate professional consultation

###⚠️ Known Limitations

Reduced accuracy with poor lighting or blurry images

Not a substitute for biopsy or dermatologist diagnosis

Requires internet for API access

###🚀 Setup & Run
Prerequisites

Node.js v18+

##Clone Repository
git clone https://github.com/yashbhure009/DermaVision09.git
cd DermaVision09

##Install Dependencies
npm install
npm install @gradio/client react-webcam

##Environment Setup

Create .env.local:

GEMINI_API_KEY=your_api_key_here

##Run Application
npm run dev


Open 👉 http://localhost:3000

###🧑‍💻 Team

Yash Bhure — 9823010260 — bhureyash444@gmail.com
Yash Adhav — 9921365808 — yash15272426@gmail.com
