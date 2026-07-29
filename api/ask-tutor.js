import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { question, topicTitle, context, history } = req.body ?? {};
  if (!question || !topicTitle || !context) {
    return res.status(400).json({ error: "question, topicTitle, and context are all required" });
  }

  try {
    const historyMessages = Array.isArray(history)
      ? history
          .filter((turn) => turn && typeof turn.text === "string")
          .map((turn) => ({ role: turn.role === "tutor" ? "assistant" : "user", content: turn.text }))
      : [];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a friendly AI tutor helping a Class 10 Indian NCERT student who just " +
            "paused a video explanation to ask a follow-up question — this may be a fresh question or a " +
            "continuation of a conversation already in progress; treat prior turns as real context, not " +
            "restarts. You will be given the exact explanation (narration script) they were originally " +
            "shown and their question(s). Answer using that same real content and the same real numbers/" +
            "examples wherever relevant — don't introduce a different worked example when the one already " +
            "shown answers the question. You may draw on accurate general subject knowledge for a " +
            "genuinely related clarifying question, but never contradict the explanation given. Write in " +
            "plain English for a student who may not be fluent in it: no figurative idiom (say 'equals', " +
            "not 'works out to'; say 'from the start', not 'to begin with') — literal, simple sentences. " +
            "Keep each answer to 2-4 short sentences. " +
            'Respond with strict JSON only, in this exact shape: {"answer": string}.\n\n' +
            `Topic: ${topicTitle}\n\nExplanation the student was originally shown:\n${context}`,
        },
        ...historyMessages,
        { role: "user", content: question },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.status(200).json({ answer: typeof parsed.answer === "string" ? parsed.answer : "" });
  } catch (err) {
    console.error("ask-tutor failed:", err);
    res.status(502).json({ error: "Couldn't reach the tutor — please try again." });
  }
}
