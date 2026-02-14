import { GoogleGenAI } from "@google/genai";
import { env } from "@/env";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const WAV_HEADER_SIZE = 44;

function pcmToWav(
	pcmBase64: string,
	sampleRate = 24000,
	channels = 1,
	bitsPerSample = 16,
): Buffer {
	const pcm = Buffer.from(pcmBase64, "base64");
	const header = Buffer.alloc(WAV_HEADER_SIZE);

	const byteRate = (sampleRate * channels * bitsPerSample) / 8;
	const blockAlign = (channels * bitsPerSample) / 8;

	header.write("RIFF", 0);
	header.writeUInt32LE(36 + pcm.length, 4);
	header.write("WAVE", 8);
	header.write("fmt ", 12);
	header.writeUInt32LE(16, 16);
	header.writeUInt16LE(1, 20);
	header.writeUInt16LE(channels, 22);
	header.writeUInt32LE(sampleRate, 24);
	header.writeUInt32LE(byteRate, 28);
	header.writeUInt16LE(blockAlign, 32);
	header.writeUInt16LE(bitsPerSample, 34);
	header.write("data", 36);
	header.writeUInt32LE(pcm.length, 40);

	return Buffer.concat([header, pcm]);
}

/** Returns base64 WAV string, or null if TTS is unavailable. */
export async function generateTTS(text: string): Promise<string | null> {
	try {
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash-preview-tts",
			contents: text,
			config: {
				responseModalities: ["AUDIO"],
				speechConfig: {
					voiceConfig: {
						prebuiltVoiceConfig: { voiceName: "Kore" },
					},
				},
			},
		});

		const audioData =
			response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

		if (!audioData) {
			console.warn("[TTS] No audio data in response");
			return null;
		}

		const wav = pcmToWav(audioData);
		return wav.toString("base64");
	} catch (err) {
		console.warn(
			"[TTS] Generation failed:",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
}
