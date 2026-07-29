import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Vercel functions default to a 4.5mb request body cap (Hobby plan) —
// lower than server/src/index.js's local 15mb Express limit. Most photo
// uploads land under this; very large/high-res photos may fail here where
// the local server would accept them.
export const config = { api: { bodyParser: { sizeLimit: "4.5mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

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
            { type: "text", text: `Question: ${questionText}\n\nCorrect answer: ${correctAnswer}` },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.status(200).json({
      correct: Boolean(parsed.correct),
      feedback: typeof parsed.feedback === "string" ? parsed.feedback : "",
    });
  } catch (err) {
    console.error("grade-photo failed:", err);
    res.status(502).json({ error: "Grading failed — please try again." });
  }
}
