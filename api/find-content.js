import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mirrors server/src/index.js's /api/find-content — same real catalog
// snapshot, same validation. Keep both in sync if a chapter list changes.
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
        found: false,
        reasoning:
          typeof parsed.reasoning === "string" && parsed.reasoning
            ? parsed.reasoning
            : "I couldn't match that to a real chapter — try naming the subject or a specific topic.",
      });
    }

    res.status(200).json({
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
}
