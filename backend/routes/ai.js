const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const { verifyToken } = require("../middleware/auth");

// Protect the AI route — only authenticated HR/Admin users may trigger AI calls
router.use(verifyToken);

// ─── POST /api/ai/recommend ────────────────────────────────────────────────────
// Pulls all employees from the database and sends their performance data to
// OpenRouter (GPT-4o mini). The AI returns four structured sections:
//   1. Promotion recommendations
//   2. Training / skill-gap suggestions
//   3. Ranked list of all employees
//   4. Individual AI feedback for each employee
router.post("/recommend", async (req, res) => {
  try {
    const employees = await Employee.find({}).sort({ performanceScore: -1 });

    if (!employees.length) {
      return res.status(400).json({
        success: false,
        message: "No employees in the database. Add some employees first.",
      });
    }

    // Build a compact, structured summary for the prompt — avoids token bloat
    const employeeList = employees
      .map(
        (e, i) =>
          `${i + 1}. ${e.name} | Dept: ${e.department} | Score: ${e.performanceScore}/100 | Experience: ${e.experience} yr(s) | Skills: ${e.skills.join(", ") || "None listed"}`
      )
      .join("\n");

    // Clearly-scoped prompt that forces the model to return parseable JSON only
    const prompt = `You are an expert HR analytics AI for a corporate performance management system. Analyze the following employee performance data and generate a comprehensive recommendation report.

EMPLOYEE DATA:
${employeeList}

SCORING GUIDE:
- Score 85–100 → Excellent performer, strong promotion candidate
- Score 70–84  → Good performer, consider for stretch assignments
- Score 50–69  → Average performer, may need targeted training
- Score < 50   → Underperformer, requires an improvement plan

YOUR TASK: Return ONLY a valid JSON object (no markdown, no extra text) in this exact structure:

{
  "promotionCandidates": [
    {
      "name": "Employee Name",
      "department": "Department",
      "score": 92,
      "reason": "2-3 sentence justification for promotion readiness"
    }
  ],
  "trainingRecommendations": [
    {
      "name": "Employee Name",
      "department": "Department",
      "score": 55,
      "skillGaps": ["Skill A", "Skill B"],
      "suggestedCourses": ["Course 1", "Course 2"],
      "trainingPlan": "1-2 sentence personalised improvement roadmap"
    }
  ],
  "employeeRankings": [
    {
      "rank": 1,
      "name": "Employee Name",
      "department": "Department",
      "score": 92,
      "tier": "Excellent",
      "feedback": "1-2 sentence personalised performance feedback"
    }
  ],
  "summary": {
    "totalEmployees": ${employees.length},
    "avgScore": <computed average as a number>,
    "topPerformers": <count with score >= 80>,
    "needsAttention": <count with score < 50>,
    "overallInsight": "2-3 sentence overall team health observation"
  }
}

Tier must be one of: "Excellent" (85-100), "Good" (70-84), "Average" (50-69), "Poor" (<50).
Include ALL employees in employeeRankings, sorted best to worst.
Only include employees with score >= 80 in promotionCandidates.
Only include employees with score < 70 in trainingRecommendations.`;

    // Call OpenRouter — using GPT-4o mini for cost efficiency on exam workloads
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Employee Performance Analytics System",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35, // slightly creative but mostly consistent output
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `OpenRouter API error: ${response.status} — ${errBody}`,
      });
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";

    // Strip markdown code fences if the model wraps the JSON in them
    let recommendations;
    try {
      const cleaned = rawContent.replace(/```json|```/g, "").trim();
      recommendations = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        success: false,
        message: "AI returned unparseable content. Raw: " + rawContent,
      });
    }

    res.json({ success: true, data: recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
