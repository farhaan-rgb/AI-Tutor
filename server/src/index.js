import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const PORT = process.env.PORT || 8787;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors());
// Photo uploads arrive as base64 data URLs, which run well past Express's
// 100kb default body limit.
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Grades a photo of a student's worked answer against the real problem it's
// meant to solve. Returns a verdict + feedback the client can show directly;
// on "incorrect" the client is expected to route into the existing
// step-by-step Explain flow (this endpoint only judges, it doesn't teach).
app.post("/api/grade-photo", async (req, res) => {
  const { imageDataUrl, questionText, correctAnswer } = req.body ?? {};

  if (!imageDataUrl || !questionText || !correctAnswer) {
    return res.status(400).json({
      error: "imageDataUrl, questionText, and correctAnswer are all required",
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are grading a student's handwritten math working, photographed and uploaded. " +
            "You will be given the question, the correct final answer, and a photo of the student's work. " +
            "Judge whether the student's answer and working are correct — minor notation differences are fine, " +
            "but the method and final result must be mathematically correct. " +
            'Respond with strict JSON only, in this exact shape: {"correct": boolean, "feedback": string}. ' +
            "Keep feedback to 1-2 short sentences, written directly to the student.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Question: ${questionText}\n\nCorrect answer: ${correctAnswer}`,
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.json({
      correct: Boolean(parsed.correct),
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
    });
  } catch (err) {
    console.error("grade-photo failed:", err);
    res.status(502).json({ error: "Grading failed — please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`ai-tutor-server listening on http://localhost:${PORT}`);
});
