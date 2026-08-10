import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Hospital Census & EHR Report Generator API" });
  });

  // AI Administrative Census Insights route (Gemini)
  app.post("/api/ai/census-insights", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "GEMINI_API_KEY environment variable is not configured in the workspace secrets."
        });
      }

      const { reportTitle, department, totalRecords, summaryMetrics, topSampleData } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `
You are an expert Chief Medical Officer and Healthcare Administrative Analyst reviewing hospital census and LIS/EHR reporting data.

Report Information:
- Title: ${reportTitle}
- Department: ${department}
- Total Records Generated: ${totalRecords}
- Key Summary Metrics: ${JSON.stringify(summaryMetrics, null, 2)}
- Sample Data Excerpt: ${JSON.stringify(topSampleData, null, 2)}

Provide a structured, executive hospital administration briefing covering:
1. Executive Summary & Occupancy/Volume Overview
2. Turnaround Time (TAT) & Operational Bottlenecks
3. Critical Values & High-Risk Patient Patient Safety Highlights
4. Actionable Administrative Recommendations for Bed Allocation & Staffing

Format your output as a clean JSON object matching this schema:
{
  "occupancyAnalysis": "string short summary paragraph",
  "tatBottlenecks": ["string bullet 1", "string bullet 2"],
  "departmentHighlights": ["string highlight 1", "string highlight 2"],
  "administrativeRecommendations": ["action 1", "action 2"],
  "criticalAlertsCount": number
}
Return ONLY valid JSON.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const insights = JSON.parse(responseText);

      return res.json({ success: true, insights });
    } catch (error: any) {
      console.error("Gemini AI census analysis error:", error);
      return res.status(500).json({
        error: "Failed to generate AI insights",
        details: error?.message || String(error)
      });
    }
  });

  // Vite middleware for development vs production static serve
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
