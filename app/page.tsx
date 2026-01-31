"use client"

import React, { useState, useRef, useCallback, memo } from "react"
import {
  Activity,
  CheckCircle,
  ArrowRight,
  Upload,
  X,
  Stethoscope,
  FileText,
  MapPin
} from "lucide-react"
import { type Language, translations } from "@/lib/translations"
import { LanguageSelector } from "@/components/language-selector"
import { SplashScreen } from "@/components/splash-screen"
import Image from "next/image"
import { InformationPage } from "@/components/information-page"
import { AboutPage } from "@/components/about-page"
import SkinScanner from "@/components/SkinScanner"
import { Client } from "@gradio/client";

// --- CONFIGURATION ---
const RED_FLAG_SUGGESTIONS = [
  "Bleeding", "Itching", "Fast Growth", "Pain", "Color Changes",
  "Irregular Borders", "Asymmetrical", "Oozing", "Non-healing",
  "Scaly", "Raised", "Tender"
]

type Screen = "landing" | "scan" | "triage" | "results" | "information" | "about"

interface ScanSession {
  symptoms: string[]
  risk_score: number
  image_url: string | null
  vision_result?: { label: string; confidences: { label: string; confidence: number }[] } | null
  llm_report?: string
  error?: string
}

const base64ToBlob = async (base64: string): Promise<Blob> => {
  const res = await fetch(base64);
  return await res.blob();
}

// --- TRIAGE COMPONENT ---
const TriagePage = memo(({ 
  symptomsInput,
  handleSymptomsChange,
  toggleSymptom,
  removeSymptomsTag,
  proceedToResults,
  isAnalyzingVision,
  t
}: {
  symptomsInput: string
  handleSymptomsChange: (text: string) => void
  toggleSymptom: (symptom: string) => void
  removeSymptomsTag: (idx: number) => void
  proceedToResults: () => void
  isAnalyzingVision: boolean
  t: any
}) => (
  <div className="min-h-screen bg-derma-yellow/20 flex flex-col">
    <header className="p-6 bg-derma-white shadow-sm border-b border-derma-cream">
      <h2 className="text-2xl font-bold text-black">{t.symptomAssessment}</h2>
    </header>
    <main className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Vision Status */}
      <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${isAnalyzingVision ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
        {isAnalyzingVision ? (
          <>
            <Activity className="w-4 h-4 animate-spin" />
            Analyzing image with AI Model...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Image Analysis Complete
          </>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-black">{t.clinicalSymptoms}</h3>
        <p className="text-sm text-gray-600">Describe your symptoms in detail, or select from suggestions below:</p>
        
        <div className="relative">
          <textarea
            value={symptomsInput}
            onChange={(e) => handleSymptomsChange(e.target.value)}
            placeholder="e.g., Itching, redness, bleeding, fast growth..."
            className="w-full p-4 border-2 border-derma-teal/30 rounded-xl focus:border-derma-teal focus:outline-none resize-none transition-all"
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Quick suggestions - Click to add:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {RED_FLAG_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => toggleSymptom(suggestion)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  symptomsInput.includes(suggestion)
                    ? "bg-derma-teal text-white border-derma-teal"
                    : "bg-white border-2 border-derma-teal/30 text-black hover:border-derma-teal"
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {symptomsInput && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Entered symptoms:</p>
            <div className="flex flex-wrap gap-2">
              {symptomsInput.split(",").map((symptom, idx) => {
                const trimmed = symptom.trim();
                return trimmed ? (
                  <div key={`symptom-${idx}`} className="bg-derma-teal/20 border border-derma-teal text-black px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {trimmed}
                    <button onClick={() => removeSymptomsTag(idx)} className="text-derma-teal hover:text-derma-teal-dark font-bold">×</button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </main>
    <div className="p-6 bg-white border-t">
      <button 
        onClick={proceedToResults} 
        disabled={isAnalyzingVision} 
        className="btn-primary w-full bg-derma-teal-dark text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzingVision ? "Waiting for AI..." : t.generateReport} 
        {!isAnalyzingVision && <ArrowRight className="w-5 h-5" />}
      </button>
    </div>
  </div>
))

// --- MAIN APP COMPONENT ---
export default function DermaVisionApp() {
  const [language, setLanguage] = useState<Language>("en")
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isVisionLoading, setIsVisionLoading] = useState(false)

  const [scanSession, setScanSession] = useState<ScanSession>({
    symptoms: [],
    risk_score: 0,
    image_url: null,
    vision_result: null
  })
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [symptomsInput, setSymptomsInput] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = translations[language]

  const navigateToScreen = (screen: Screen) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentScreen(screen)
      setIsTransitioning(false)
    }, 300)
  }

  // --- VISION AI (HUGGING FACE) ---
  const analyzeWithVisionAI = async (imageSrc: string) => {
    setIsVisionLoading(true);
    try {
      const blob = await base64ToBlob(imageSrc);
      console.log("Connecting to Hugging Face Model...");
      const app = await Client.connect("Heckur0009/dermascan-api"); 
      
      console.log("Sending image...");
      const result = await app.predict("/predict", [blob]) as { data: any[] };
      console.log("Vision AI Result:", result.data);
      
      setScanSession((prev) => ({
        ...prev,
        vision_result: result.data[0] as any 
      }));

    } catch (error) {
      console.warn("⚠️ Vision AI is sleeping or unreachable:", error);
    } finally {
      setIsVisionLoading(false);
    }
  };

  // --- IMAGE HANDLING ---
  const performAnalysis = async (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setScanSession((prev) => ({ ...prev, image_url: imageSrc }));
    analyzeWithVisionAI(imageSrc); 
    navigateToScreen("triage");
  }

  const handleWebcamCapture = (imageSrc: string) => performAnalysis(imageSrc);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const result = event.target?.result as string
        performAnalysis(result);
      }
      reader.readAsDataURL(file)
    }
  }

  // --- SYMPTOM HANDLING ---
  const toggleSymptom = useCallback((symptom: string) => {
    setSymptomsInput((prev) => {
      if (prev.includes(symptom)) {
        return prev.replace(symptom, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim()
      } else {
        return prev ? `${prev}, ${symptom}` : symptom
      }
    })
  }, [])

  const handleSymptomsChange = useCallback((text: string) => {
    setSymptomsInput(text)
  }, [])

  const removeSymptomsTag = useCallback((idx: number) => {
    setSymptomsInput((prev) => prev.split(",").filter((_, i) => i !== idx).join(","))
  }, [])

  // --- API CALL ---
  const proceedToResults = async () => {
    const symptoms = symptomsInput.split(",").map((s) => s.trim()).filter((s) => s);
    if (symptoms.length === 0) {
      alert("Please enter at least one symptom");
      return;
    }

    setScanSession((prev) => ({ ...prev, symptoms: symptoms }));
    navigateToScreen("results");
    
    setTimeout(async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: capturedImage,
            symptoms: symptoms,
            visionAnalysis: scanSession.vision_result 
          })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();

        if (data.result) {
          setScanSession(prev => ({ ...prev, llm_report: data.result }));
        }
      } catch (error: any) {
        console.error("LLM Error", error);
        setScanSession(prev => ({ ...prev, error: error.message }));
      }
    }, 500);
  }

  const resetSession = () => {
    setScanSession({ symptoms: [], risk_score: 0, image_url: null, vision_result: null })
    setSymptomsInput("")
    setCapturedImage(null)
    setIsAnalyzing(false)
    setIsVisionLoading(false)
    navigateToScreen("landing")
  }

  // --- SCREENS ---
  const LandingPage = () => (
    <div className="min-h-screen bg-derma-white flex flex-col relative">
      <div className="absolute inset-0 z-0 opacity-30 bg-[url('/images/hospital-bg.png')] bg-cover bg-center" />
      <header className="p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Image src="/images/dermavision-logo.png" alt="Logo" width={48} height={48} className="rounded-xl shadow-md" />
          <span className="text-2xl font-bold text-derma-teal-dark">DermaVision AI</span>
        </div>
        <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} compact />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-4xl font-extrabold text-black">{t.heroTitle}</h2>
          <p className="text-lg text-gray-700">{t.heroSubtitle}</p>
          <button onClick={() => navigateToScreen("scan")} className="btn-primary w-full bg-derma-teal-dark text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2">
            {t.startScan} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  )

  const ScanPage = () => (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="p-4 flex items-center justify-between bg-black/30 backdrop-blur-sm z-50">
        <button onClick={() => navigateToScreen("landing")} className="text-white p-2"><X className="w-6 h-6" /></button>
        <h2 className="text-white font-bold">{t.captureLesion}</h2>
      </header>
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
          <SkinScanner onCapture={handleWebcamCapture} />
          <div className="my-6 w-full max-w-md flex items-center gap-2 text-gray-500 text-sm">
             <div className="h-px bg-gray-700 flex-1" /> OR <div className="h-px bg-gray-700 flex-1" />
          </div>
          <button onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing} className="btn-secondary w-full max-w-md bg-gray-800 text-white py-4 rounded-xl font-bold text-lg border border-gray-700 shadow-lg flex items-center justify-center gap-2">
            {isAnalyzing ? <Activity className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isAnalyzing ? "Analyzing..." : t.uploadGallery}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      </div>
    </div>
  )

  const ResultsPage = () => {
    // Check if report indicates HIGH or MEDIUM urgency
    const isRisky = scanSession.llm_report 
      ? /High|Medium|Urgent|Malignant|Carcinoma|Consult a dermatologist/i.test(scanSession.llm_report)
      : false;

    const findDoctors = () => {
      window.open("https://www.google.com/maps/search/dermatologists+near+me", "_blank");
    }

    const downloadPDF = () => {
        if (!scanSession.llm_report) { alert("No analysis available"); return; }
        const date = new Date().toLocaleDateString();
        const time = new Date().toLocaleTimeString();
        const reportId = Math.floor(Math.random() * 100000);
        const printWindow = window.open('', '', 'height=900,width=800');
        if (!printWindow) return;
    
        const styles = `
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #0d9488; padding-bottom: 20px; margin-bottom: 40px; }
            .brand { font-size: 28px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -1px; }
            .brand span { color: #0d9488; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .meta-item { display: flex; flex-direction: column; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; }
            .value { font-size: 14px; font-weight: 600; color: #334155; }
            .scan-image-box { margin-bottom: 40px; text-align: center; }
            .scan-img { height: 180px; border-radius: 12px; border: 4px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .report-body { line-height: 1.7; font-size: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background-color: #f1f5f9; }
            strong { color: #0f172a; font-weight: 700; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
            .badge { display: inline-block; background: #ccfbf1; color: #115e59; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
          </style>
        `;
    
        const htmlContent = `
          <html>
          <head>
            <title>DermaVision Report #${reportId}</title>
            ${styles}
            </head>
          <body>
            <div class="header">
              <div class="brand">Derma<span>Vision</span> AI</div>
              <div style="text-align: right;">
                <div class="label">Generated On</div>
                <div class="value">${date} at ${time}</div>
              </div>
            </div>
            <div class="meta-grid">
               <div class="meta-item"><span class="label">Report ID</span><span class="value">#${reportId}</span></div>
               <div class="meta-item"><span class="label">Analysis Type</span><span class="value">Hybrid Vision + Clinical LLM</span></div>
               <div class="meta-item"><span class="label">Reported Symptoms</span><span class="value">${scanSession.symptoms.join(", ") || "None Reported"}</span></div>
               <div class="meta-item"><span class="label">Status</span><span class="value"><span class="badge">COMPLETED</span></span></div>
            </div>
            ${capturedImage ? `<div class="scan-image-box"><div class="label" style="margin-bottom:10px;">Analyzed Specimen</div><img src="${capturedImage}" class="scan-img"/></div>` : ''}
            <div class="report-body">
               <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Clinical Assessment</h3>
               <div style="white-space: pre-wrap;">${scanSession.llm_report}</div>
            </div>
            <div class="footer">
              <p><strong>DISCLAIMER:</strong> Screening only. Not a diagnosis. Consult a dermatologist.</p>
              <p>© 2026 DermaVision AI • Powered by Google Gemini 2.5</p>
            </div>
          </body>
          </html>
        `;
    
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      };

    return (
      <div className="min-h-screen bg-derma-cream/30 flex flex-col">
        <header className="p-6 bg-white shadow-sm border-b border-derma-cream">
          <h2 className="text-2xl font-bold text-black">{t.riskAssessment}</h2>
        </header>
        <main className="flex-1 p-6 space-y-6 overflow-y-auto pb-40">
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-md border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-indigo-900">Final Verdict</h3>
            </div>
            
            {!scanSession.llm_report ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 mb-2 font-semibold">Generating Medical Report...</p>
                <p className="text-gray-500 text-xs">Integrating Vision Model results with your symptoms...</p>
              </div>
            ) : (
              <div className="bg-white/60 p-6 rounded-xl">
                <div className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed">{scanSession.llm_report}</div>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs text-gray-700">
              <strong>Disclaimer:</strong> Educational purposes only. Consult a dermatologist.
            </p>
          </div>
        </main>
        
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t space-y-3">
          {/* 📍 NEW: Doctor Locator (Only if Risky) */}
          {isRisky && (
            <button 
              onClick={findDoctors}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 animate-pulse"
            >
              <MapPin className="w-5 h-5" />
              Locate Nearby Dermatologist
            </button>
          )}

          <button 
            onClick={downloadPDF} 
            disabled={!scanSession.llm_report}
            className="w-full bg-derma-teal text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileText className="w-5 h-5" />
            Download PDF Report
          </button>
          
          <button onClick={resetSession} className="btn-primary w-full bg-derma-teal-dark text-white py-4 rounded-xl font-bold">{t.newScan}</button>
        </div>
      </div>
    )
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "landing": return <LandingPage />
      case "scan": return <ScanPage />
      case "triage": return <TriagePage 
        symptomsInput={symptomsInput}
        handleSymptomsChange={handleSymptomsChange}
        toggleSymptom={toggleSymptom}
        removeSymptomsTag={removeSymptomsTag}
        proceedToResults={proceedToResults}
        isAnalyzingVision={isVisionLoading} 
        t={t}
      />
      case "results": return <ResultsPage />
      case "information": return <InformationPage onBack={() => navigateToScreen("landing")} />
      case "about": return <AboutPage onBack={() => navigateToScreen("landing")} />
      default: return <LandingPage />
    }
  }

  return <SplashScreen><div className={`transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>{renderScreen()}</div></SplashScreen>
}