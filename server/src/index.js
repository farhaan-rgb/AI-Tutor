import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { toFile } from "openai/uploads";

const PORT = process.env.PORT || 8787;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors());
// Photo/audio uploads arrive as base64 data URLs, which run well past
// Express's 100kb default body limit.
app.use(express.json({ limit: "15mb" }));

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
// question's own real evaluative criteria. Accepts EITHER a typed
// `studentAnswer` OR a photo of a handwritten one (`imageDataUrl`) — the
// latter is read by the same model call rather than needing a separate OCR
// step, and its transcription is returned so the client can show what was
// read.
app.post("/api/grade-text", async (req, res) => {
  const { questionText, studentAnswer, imageDataUrl, criteria, groundingNotes } = req.body ?? {};

  if (!questionText || (!studentAnswer && !imageDataUrl) || !Array.isArray(criteria) || criteria.length === 0) {
    return res.status(400).json({
      error: "questionText, one of studentAnswer/imageDataUrl, and a non-empty criteria array are all required",
    });
  }

  try {
    const systemPrompt =
      "You are an AI tutor giving feedback on a student's answer to an open-ended history discussion " +
      "question. This question has no single correct answer — never say the answer is 'correct' or " +
      "'incorrect', and never imply there's one right answer. You will be given the question, the real " +
      "evaluative criteria a strong answer should cover, background notes grounding those criteria in " +
      "the real chapter, and the student's own answer" +
      (imageDataUrl ? " (a photo of their handwritten answer — read it first)" : "") +
      ". Judge how completely and soundly the answer covers the real criteria. For anything missing or " +
      "underdeveloped, name the SPECIFIC real content from the background notes that would complete it " +
      "— the actual fact, quote, or example itself, not a vague 'add more detail.' " +
      'Respond with strict JSON only, in this exact shape: {"feedback": string' +
      (imageDataUrl ? ', "transcribedAnswer": string' : "") +
      "}. Keep feedback to 3-5 sentences, encouraging but specific, written directly to the student." +
      (imageDataUrl ? " transcribedAnswer is your best verbatim transcription of the handwritten answer." : "");

    const questionBlock =
      `Question: ${questionText}\n\n` +
      `Criteria a strong answer should cover:\n${criteria.map((c) => `- ${c}`).join("\n")}\n\n` +
      `Background grounding these criteria in the real chapter:\n${groundingNotes ?? ""}`;

    const messages = imageDataUrl
      ? [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `${questionBlock}\n\nThe student's handwritten answer is in the attached photo.` },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${questionBlock}\n\nStudent's answer:\n${studentAnswer}` },
        ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.json({
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
      transcribedAnswer: typeof parsed.transcribedAnswer === "string" ? parsed.transcribedAnswer : undefined,
    });
  } catch (err) {
    console.error("grade-text failed:", err);
    res.status(502).json({ error: "Grading failed — please try again." });
  }
});

// Generates a real model answer for an analytical question, for a student
// who asks the AI tutor to solve it first. Kept small (framing) + the actual
// substantive answer (the main focus) — never invents beyond groundingNotes.
app.post("/api/model-answer", async (req, res) => {
  const { questionText, criteria, groundingNotes } = req.body ?? {};

  if (!questionText || !Array.isArray(criteria) || criteria.length === 0) {
    return res.status(400).json({ error: "questionText and a non-empty criteria array are required" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI tutor writing a model answer to a real history discussion question, for a " +
            "student to study before attempting their own. You will be given the question, the real " +
            "evaluative criteria a strong answer should cover, and background notes grounding those " +
            "criteria in the real chapter — use ONLY those real facts, never invent history. " +
            'Respond with strict JSON only, in this exact shape: {"framing": string, "answer": string}. ' +
            "framing is 1-2 short sentences on what a strong answer needs to cover (structure, not " +
            "content). answer is the actual substantive model answer — the main focus — written as a " +
            "real, complete answer grounded strictly in the background notes.",
        },
        {
          role: "user",
          content:
            `Question: ${questionText}\n\n` +
            `Criteria a strong answer should cover:\n${criteria.map((c) => `- ${c}`).join("\n")}\n\n` +
            `Background grounding these criteria in the real chapter (use only these real facts):\n${groundingNotes ?? ""}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.json({
      framing: typeof parsed.framing === "string" ? parsed.framing : "",
      answer: typeof parsed.answer === "string" ? parsed.answer : "",
    });
  } catch (err) {
    console.error("model-answer failed:", err);
    res.status(502).json({ error: "Couldn't generate a model answer — please try again." });
  }
});

// Transcribes a student's spoken answer (recorded in-browser via
// MediaRecorder) to text, which the client then submits through the same
// /api/grade-text path as a typed answer. audioDataUrl is decoded from
// base64 into a real file buffer before it's sent to Whisper.
app.post("/api/transcribe-audio", async (req, res) => {
  const { audioDataUrl } = req.body ?? {};
  if (!audioDataUrl) {
    return res.status(400).json({ error: "audioDataUrl is required" });
  }

  try {
    const match = /^data:(audio\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(audioDataUrl);
    if (!match) {
      return res.status(400).json({ error: "audioDataUrl must be a base64 audio data URL" });
    }
    const [, mimeType, base64Data] = match;
    const buffer = Buffer.from(base64Data, "base64");
    const ext = mimeType.split("/")[1]?.split(";")[0] || "webm";
    const file = await toFile(buffer, `answer.${ext}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    res.json({ transcript: transcription.text ?? "" });
  } catch (err) {
    console.error("transcribe-audio failed:", err);
    res.status(502).json({ error: "Transcription failed — please try again." });
  }
});

// Answers a student's typed follow-up question, raised mid-video via the
// "raise hand" control on the Explain whiteboard video (ai-tutor-explain.tsx).
// Grounded in that topic's real narration script — the same explanation the
// student was just given — so the answer reuses the same real numbers/
// examples rather than inventing a parallel one. Real model call, not a
// scripted response (same standard as /api/grade-photo etc.). Answer is
// text only, read on screen — no TTS here; audio in this app is always
// pre-generated offline (see EXPLAIN_NARRATION_RULEBOOK.md), never live.
app.post("/api/ask-tutor", async (req, res) => {
  const { question, topicTitle, context } = req.body ?? {};

  if (!question || !topicTitle || !context) {
    return res.status(400).json({ error: "question, topicTitle, and context are all required" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a friendly AI Maths/Science tutor helping a Class 10 Indian NCERT student who just " +
            "paused a video explanation to ask a follow-up question. You will be given the exact " +
            "explanation (narration script) they were just shown and their question. Answer using that " +
            "same real content and the same real numbers/examples wherever relevant — don't introduce a " +
            "different worked example when the one already shown answers the question. You may draw on " +
            "accurate general math/science knowledge for a genuinely related clarifying question, but " +
            "never contradict the explanation given. Write in plain English for a student who may not be " +
            "fluent in it: no figurative idiom (say 'equals', not 'works out to'; say 'from the start', " +
            "not 'to begin with') — literal, simple sentences. Keep the answer to 2-4 short sentences. " +
            'Respond with strict JSON only, in this exact shape: {"answer": string}.',
        },
        {
          role: "user",
          content: `Topic: ${topicTitle}\n\nExplanation the student was just given:\n${context}\n\nStudent's question: ${question}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.json({ answer: typeof parsed.answer === "string" ? parsed.answer : "" });
  } catch (err) {
    console.error("ask-tutor failed:", err);
    res.status(502).json({ error: "Couldn't reach the tutor — please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`ai-tutor-server listening on http://localhost:${PORT}`);
});
