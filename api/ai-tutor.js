import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mirrors server/src/index.js's /api/ai-tutor — one unified endpoint for
// both answering a doubt about the current chapter and navigating to a
// different real chapter/subject, replacing the earlier separate
// /api/find-content. Keep the two files' catalog and prompts in sync.
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { question, history, chapterContext } = req.body ?? {};
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "question is required" });
  }

  const historyMessages = Array.isArray(history)
    ? history
        .filter((turn) => turn && typeof turn.text === "string")
        .map((turn) => ({ role: turn.role === "tutor" ? "assistant" : "user", content: turn.text }))
    : [];

  const responseShape =
    'Respond with strict JSON only, in this exact shape: {"type": "answer" | "navigate", "answer": string | null, ' +
    '"found": boolean | null, "sku": string | null, "chapterIndex": number | null, "chapterTitle": string | null, ' +
    '"subjectTitle": string | null, "otherChapters": string[], "reasoning": string | null, "urgentTip": string | null}. ' +
    'Use "answer" (leave nav fields null/[]) when type is "answer"; use the nav fields (leave answer null) when type is "navigate".';

  const systemPrompt = chapterContext?.title && chapterContext?.summary
    ? "You are a Class 10 CBSE/NCERT AI tutor, open inside a specific chapter. You do two things, and must " +
      "decide which this message needs: (1) ANSWER — a real doubt about the chapter the student is currently " +
      "viewing, or a closely related general question; ground your answer in the real chapter content given " +
      "below, using the same real numbers/examples wherever relevant, never contradicting it; (2) NAVIGATE — " +
      "when the student names a chapter/topic/exam-scope that ISN'T part of the current chapter, or explicitly " +
      "asks to find/go to/access something else; match against the real catalog below and set found to true " +
      "with sku, chapterIndex, chapterTitle and subjectTitle ALL filled in from the real catalog entry you " +
      "matched — never leave those null just because reasoning already names the chapter in prose; only set " +
      "found to false when nothing in the catalog genuinely matches. Never invent a subject or chapter that " +
      "isn't listed. Prefer the single most central chapter for a wide exam scope and list the rest in " +
      "otherChapters — but leave otherChapters EMPTY for a single, focused request naming just one real " +
      "topic/chapter; only populate it when the request genuinely spans multiple chapters (e.g. 'everything " +
      "up to polynomials'). Fill urgentTip only when the request signals real time pressure. When type is " +
      "'navigate', reasoning must ALWAYS be a real, non-empty sentence — even for an obvious one-word match " +
      "like 'Federalism', still say a sentence like 'Federalism is covered in this real chapter' — never " +
      "leave it blank just because the match feels self-evident. Write plain English " +
      "for a student who may not be fluent in it — literal phrasing, not idiom. " +
      responseShape +
      `\n\nCurrent chapter: ${chapterContext.title}\nReal content in this chapter:\n${chapterContext.summary}` +
      `\n\nReal catalog for navigation:\n${catalogPromptBlock()}`
    : "You help a Class 10 CBSE/NCERT student find the right chapter in their study app, from a free-text " +
      "description — this may be a chapter/topic name, a concept ('coordinate geometry'), an exam scope " +
      "('everything up to polynomials'), or something urgent ('test tomorrow on X'). Always respond with " +
      'type "navigate" — there is no specific chapter open right now to answer a content doubt about. Match ' +
      "against the REAL catalog below — pick the single best sku + chapter index. Never invent a subject or " +
      "chapter that isn't listed. If the request spans multiple chapters (a wide exam scope), return the " +
      "single most central/foundational one as the primary target and list the rest by title in " +
      "otherChapters. If you genuinely cannot match anything real in the catalog, set found to false and " +
      "explain what's missing in reasoning — never guess. reasoning must ALWAYS be a real, non-empty " +
      "sentence when found is true — even for an obvious one-word match like 'Federalism', still say a " +
      "sentence like 'Federalism is covered in this real chapter' — never leave it blank just because the " +
      "match feels self-evident. If the request signals time pressure (an exam " +
      "soon, 'tomorrow', 'test', 'quiz'), fill urgentTip with one short, encouraging sentence on what to " +
      "prioritize first once they arrive (practicing real exercises over re-reading concepts) — otherwise " +
      "leave it null. " +
      responseShape +
      `\n\nReal catalog:\n${catalogPromptBlock()}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: question },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    if (parsed.type === "answer") {
      return res.status(200).json({ type: "answer", answer: typeof parsed.answer === "string" ? parsed.answer : "" });
    }

    const subject = ACCESS_CATALOG.find((s) => s.sku === parsed.sku);
    const chapterIndex = Number.isInteger(parsed.chapterIndex) ? parsed.chapterIndex : -1;
    const valid =
      parsed.found === true &&
      VALID_SKUS.has(parsed.sku) &&
      subject &&
      chapterIndex >= 0 &&
      chapterIndex < subject.chapters.length;

    if (!valid) {
      return res.status(200).json({
        type: "navigate",
        found: false,
        reasoning:
          typeof parsed.reasoning === "string" && parsed.reasoning
            ? parsed.reasoning
            : "I couldn't match that to a real chapter — try naming the subject or a specific topic.",
      });
    }

    const chapterTitle = subject.chapters[chapterIndex];
    res.status(200).json({
      type: "navigate",
      found: true,
      sku: parsed.sku,
      chapterIndex,
      chapterTitle,
      subjectTitle: subject.subject,
      otherChapters: Array.isArray(parsed.otherChapters) ? parsed.otherChapters.filter((c) => typeof c === "string") : [],
      // Defensive fallback, not just a prompt instruction — the model has
      // returned an empty string here for an obvious one-word match (real
      // bug, real screenshot: a "Go to Federalism" button with nothing
      // above it), so this can never reach the client blank regardless of
      // how well the prompt is followed.
      reasoning: typeof parsed.reasoning === "string" && parsed.reasoning.trim() ? parsed.reasoning : `${chapterTitle} is the real chapter that matches what you asked.`,
      urgentTip: typeof parsed.urgentTip === "string" ? parsed.urgentTip : null,
    });
  } catch (err) {
    console.error("ai-tutor failed:", err);
    res.status(502).json({ error: "Couldn't reach the tutor — please try again." });
  }
}
