import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("🟢 API Hit: /api/analyze (Auto-Discovery + Pro Prompt)");

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API Key Missing" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { image, symptoms, visionAnalysis } = body;

    // --- STEP 1: AUTO-DISCOVER VALID MODELS (Same logic as before) ---
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const modelsResponse = await fetch(modelsUrl);
    const modelsData = await modelsResponse.json();

    if (!modelsData.models) {
      return NextResponse.json({ error: "Could not fetch model list." }, { status: 500 });
    }

    const validModel = modelsData.models.find((m: any) => 
      m.supportedGenerationMethods.includes("generateContent") &&
      !m.name.includes("gemini-1.0") 
    );

    if (!validModel) throw new Error("No valid Vision models found.");
    const modelName = validModel.name.replace("models/", "");
    console.log(`🟢 Using Model: ${modelName}`);

    // --- STEP 2: PREPARE DATA ---
    let visionContext = "No visual analysis provided.";
    if (visionAnalysis && visionAnalysis.label) {
      const score = visionAnalysis.confidences?.[0]?.confidence 
        ? (visionAnalysis.confidences[0].confidence * 100).toFixed(1) + "%"
        : "High";
      visionContext = `${visionAnalysis.label} (Confidence: ${score})`;
    }

    const userSymptoms = Array.isArray(symptoms) ? symptoms.join(", ") : symptoms || "None Reported";

    // --- STEP 3: THE "APPEALING" PROMPT UPGRADE 🎨 ---
    const promptText = `
      You are DermaVision AI, an advanced dermatological assistant.
      
      PATIENT CONTEXT:
      - Visual AI Scan: ${visionContext}
      - Reported Symptoms: ${userSymptoms}
      
      TASK:
      Generate a highly detailed, professional, and empathetic medical report. 
      Use Markdown formatting to make it visually appealing.
      
      STRUCTURE THE REPORT EXACTLY LIKE THIS:

      ## 🔎 Clinical Observation
      (Describe the visual appearance of the lesion/skin in detail: color, borders, texture, size relative to image, and symmetry. Be precise.)

      ## 🧠 Diagnostic Analysis
      **AI Model Result:** ${visionContext}
      
      (Provide a detailed medical reasoning. Explain WHY the lesion appears benign or suspicious based on the "ABCDE" rule of melanoma if applicable. Connect the visual features to the symptoms provided.)

      ## 📋 Actionable Recommendations
      (Give specific, step-by-step advice. Do not just say "see a doctor". Give preventive care tips, what signs to watch out for, and lifestyle adjustments.)

      ---
      ## 🚨 Risk Assessment
      | Metric | Assessment |
      | :--- | :--- |
      | **Urgency Level** | (Low / Medium / High) |
      | **Primary Concern** | (Name of potential condition or "Benign") |
      | **Next Step** | (e.g., "Routine Checkup" or "Urgent Biopsy") |

      *Disclaimer: This is an AI-generated screening, not a diagnosis. Consult a dermatologist.*
    `;

    // --- STEP 4: SEND TO GOOGLE ---
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          { inline_data: { mime_type: "image/jpeg", data: base64Data } }
        ]
      }]
    };

    const response = await fetch(generateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message }, { status: 500 });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json({ result: text });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}