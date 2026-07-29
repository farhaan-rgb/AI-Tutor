import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: { sizeLimit: "4.5mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { questionText, studentAnswer, imageDataUrl, criteria, groundingNotes } = req.body ?? {};
  if (!questionText || (!studentAnswer && !imageDataUrl) || !Array.isArray(criteria) || criteria.length === 0) {
    return res.status(400).json({
      error: "questionText, one of studentAnswer/imageDataUrl, and a non-empty criteria array are all required",
    });
  }

  try {
    const systemPrompt =
      "You are an AI tutor giving feedback on a student's answer to an open-ended discussion " +
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
    res.status(200).json({
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
      transcribedAnswer: typeof parsed.transcribedAnswer === "string" ? parsed.transcribedAnswer : undefined,
    });
  } catch (err) {
    console.error("grade-text failed:", err);
    res.status(502).json({ error: "Grading failed — please try again." });
  }
}
