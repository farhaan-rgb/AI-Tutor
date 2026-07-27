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

// Grades an open-response (analytical/argumentative) answer — e.g. History's
// "Discuss" and "Write in brief" questions, which have no single determinate
// answer. Unlike /api/grade-photo, this deliberately never returns a
// correct/incorrect verdict (see CONTENT_RULEBOOK.md rule 0's Analytical
// row) — only qualitative feedback on completeness/soundness against the
// question's own real evaluative criteria.
app.post("/api/grade-text", async (req, res) => {
  const { questionText, studentAnswer, criteria, groundingNotes } = req.body ?? {};

  if (!questionText || !studentAnswer || !Array.isArray(criteria) || criteria.length === 0) {
    return res.status(400).json({
      error: "questionText, studentAnswer, and a non-empty criteria array are all required",
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
            "You are an AI tutor giving feedback on a student's written answer to an open-ended " +
            "history discussion question. This question has no single correct answer — never say " +
            "the answer is 'correct' or 'incorrect', and never imply there's one right answer. " +
            "You will be given the question, the real evaluative criteria a strong answer should " +
            "cover, background notes grounding those criteria in the real chapter, and the " +
            "student's own answer. Judge how completely and soundly the student's answer covers " +
            "the real criteria — name what they covered well and what's missing or underdeveloped, " +
            "using the grounding notes to be specific rather than generic. " +
            'Respond with strict JSON only, in this exact shape: {"feedback": string}. ' +
            "Keep feedback to 2-4 sentences, encouraging but specific, written directly to the student.",
        },
        {
          role: "user",
          content:
            `Question: ${questionText}\n\n` +
            `Criteria a strong answer should cover:\n${criteria.map((c) => `- ${c}`).join("\n")}\n\n` +
            `Background grounding these criteria in the real chapter:\n${groundingNotes ?? ""}\n\n` +
            `Student's answer:\n${studentAnswer}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.json({
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
    });
  } catch (err) {
    console.error("grade-text failed:", err);
    res.status(502).json({ error: "Grading failed — please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`ai-tutor-server listening on http://localhost:${PORT}`);
});
