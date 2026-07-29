import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

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
            "You are an AI tutor writing a model answer to a real discussion question, for a " +
            "student to study before attempting their own. You will be given the question, the real " +
            "evaluative criteria a strong answer should cover, and background notes grounding those " +
            "criteria in the real chapter — use ONLY those real facts, never invent content. " +
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
    res.status(200).json({
      framing: typeof parsed.framing === "string" ? parsed.framing : "",
      answer: typeof parsed.answer === "string" ? parsed.answer : "",
    });
  } catch (err) {
    console.error("model-answer failed:", err);
    res.status(502).json({ error: "Couldn't generate a model answer — please try again." });
  }
}
