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

// Real Class 10 catalog — kept as a self-contained snapshot here (same
// duplication tradeoff as the Vercel /api/*.js mirrors of this file) rather
// than importing src/shared/classroom-catalog.ts, since that would pull a
// TS/React-adjacent module into a plain Node server for a handful of static
// title arrays. Every chapter title here is the same real, verified data
// already in classroom-catalog.ts — keep the two in sync if a chapter list
// changes there.
const ACCESS_CATALOG = [
  { sku: "ncert-10-maths", subject: "Mathematics", chapters: ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"] },
  { sku: "ncert-10-science", subject: "Science", chapters: ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds", "Life Processes", "Control and Coordination", "How do Organisms Reproduce?", "Heredity", "Light – Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Our Environment"] },
  { sku: "ncert-10-history", subject: "History (Social Science)", chapters: ["The Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "The Age of Industrialisation", "Print Culture and the Modern World"] },
  { sku: "ncert-10-geography", subject: "Geography (Social Science)", chapters: ["Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources", "Manufacturing Industries", "Lifelines of National Economy"] },
  { sku: "ncert-10-political-science", subject: "Political Science (Social Science)", chapters: ["Power-sharing", "Federalism", "Gender, Religion and Caste", "Political Parties", "Outcomes of Democracy"] },
  { sku: "ncert-10-economics", subject: "Economics (Social Science)", chapters: ["Development", "Sectors of the Indian Economy", "Money and Credit", "Globalisation and the Indian Economy", "Consumer Rights"] },
  { sku: "ncert-10-english", subject: "English", chapters: ["A Letter to God", "Nelson Mandela: Long Walk to Freedom", "Two Stories about Flying", "From the Diary of Anne Frank", "Glimpses of India", "Mijbil the Otter", "Madam Rides the Bus", "The Sermon at Benares", "The Proposal", "A Triumph of Surgery", "The Thief's Story", "The Midnight Visitor", "A Question of Trust", "Footprints without Feet", "The Making of a Scientist", "The Necklace", "Bholi", "The Book That Saved the Earth"] },
  { sku: "ncert-10-hindi", subject: "Hindi", chapters: ["सूरदास", "तुलसीदास", "जयशंकर प्रसाद", "सूर्यकांत त्रिपाठी 'निराला'", "नागार्जुन", "मंगलेश डबराल", "नेताजी का चश्मा", "बालगोबिन भगत", "लखनवी अंदाज़", "एक कहानी यह भी", "नौबतखाने में इबादत", "संस्कृति", "माता का अँचल", "साना-साना हाथ जोड़ि...", "मैं क्यों लिखता हूँ?"] },
];

function catalogPromptBlock() {
  return ACCESS_CATALOG.map(
    (s) => `${s.subject} (sku: "${s.sku}"):\n` + s.chapters.map((c, i) => `  ${i}: ${c}`).join("\n")
  ).join("\n\n");
}

const VALID_SKUS = new Set(ACCESS_CATALOG.map((s) => s.sku));

// Helps a student locate the real chapter/subject they need from a free-text
// description — "I have a test on coordinate geometry tomorrow," a concept
// name, an exam scope ("everything up to polynomials"), or a Social Science
// topic without knowing which of the four books it's in. Real navigation
// target only (a real sku + real chapterIndex from ACCESS_CATALOG, validated
// server-side before returning) — never an invented chapter.
app.post("/api/find-content", async (req, res) => {
  const { query } = req.body ?? {};
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "query is required" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You help a Class 10 CBSE/NCERT student find the right chapter in their study app, from a " +
            "free-text description — this may be a chapter/topic name, a concept ('coordinate geometry'), " +
            "an exam scope ('everything up to polynomials'), or something urgent ('test tomorrow on X'). " +
            "Match against the REAL catalog below — pick the single best sku + chapter index. Never invent " +
            "a subject or chapter that isn't listed. If the request spans multiple chapters (a wide exam " +
            "scope), return the single most central/foundational one as the primary target and list the " +
            "rest by title in otherChapters. If you genuinely cannot match anything real in the catalog, " +
            "set found to false and explain what's missing in reasoning — never guess. If the request " +
            "signals time pressure (an exam soon, 'tomorrow', 'test', 'quiz'), fill urgentTip with one " +
            "short, encouraging sentence on what to prioritize first once they arrive (practicing real " +
            "exercises over re-reading concepts, for a student short on time) — otherwise leave it null. " +
            'Respond with strict JSON only, in this exact shape: {"found": boolean, "sku": string|null, ' +
            '"chapterIndex": number|null, "chapterTitle": string|null, "subjectTitle": string|null, ' +
            '"otherChapters": string[], "reasoning": string, "urgentTip": string|null}. reasoning is 1-2 ' +
            "short sentences written directly to the student, plain language, explaining why this chapter " +
            "matches what they described.\n\n" +
            `Real catalog:\n${catalogPromptBlock()}`,
        },
        { role: "user", content: query },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    // Never trust the model's navigation target blindly — re-validate
    // against the real catalog before letting it drive a deep link.
    const subject = ACCESS_CATALOG.find((s) => s.sku === parsed.sku);
    const chapterIndex = Number.isInteger(parsed.chapterIndex) ? parsed.chapterIndex : -1;
    const valid =
      parsed.found === true &&
      VALID_SKUS.has(parsed.sku) &&
      subject &&
      chapterIndex >= 0 &&
      chapterIndex < subject.chapters.length;

    if (!valid) {
      return res.json({
        found: false,
        reasoning:
          typeof parsed.reasoning === "string" && parsed.reasoning
            ? parsed.reasoning
            : "I couldn't match that to a real chapter — try naming the subject or a specific topic.",
      });
    }

    res.json({
      found: true,
      sku: parsed.sku,
      chapterIndex,
      chapterTitle: subject.chapters[chapterIndex],
      subjectTitle: subject.subject,
      otherChapters: Array.isArray(parsed.otherChapters) ? parsed.otherChapters.filter((c) => typeof c === "string") : [],
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      urgentTip: typeof parsed.urgentTip === "string" ? parsed.urgentTip : null,
    });
  } catch (err) {
    console.error("find-content failed:", err);
    res.status(502).json({ error: "Couldn't search right now — please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`ai-tutor-server listening on http://localhost:${PORT}`);
});
