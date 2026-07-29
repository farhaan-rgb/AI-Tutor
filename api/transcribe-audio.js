import OpenAI from "openai";
import { toFile } from "openai/uploads";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: { sizeLimit: "4.5mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

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

    res.status(200).json({ transcript: transcription.text ?? "" });
  } catch (err) {
    console.error("transcribe-audio failed:", err);
    res.status(502).json({ error: "Transcription failed — please try again." });
  }
}
