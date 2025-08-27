import { NextRequest } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const input = (text || "").trim();
    if (!input) {
      return new Response(JSON.stringify({ error: "No input text" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const prompt = [
      `You are a professional text formatter. Your job is to take raw speech-to-text output, which usually comes as a single continuous block of words without punctuation, and convert it into clean, readable, and properly punctuated text.`,
      ``,
      `Follow these rules strictly:`,
      `1. **Sentence Detection**: Identify natural sentence boundaries and end them with proper punctuation marks such as a period (.), question mark (?), or exclamation mark (!).`,
      `2. **Grammar and Spacing**: Correct minor grammar issues such as missing capitalization at the start of sentences, incorrect verb forms, or run-on sentences.`,
      `3. **Do Not Summarize**: Keep every word and idea from the input. Do not shorten, remove, or skip any information.`,
      `4. **Do Not Add New Ideas**: Only format and lightly correct grammar. Do not insert your own content.`,
      `5. **Maintain Style**: Keep the natural flow and casual style of the speaker. If the speaker sounds informal, keep it informal.`,
      `6. **Paragraphs**: If the transcript is long, split it into paragraphs for better readability. A paragraph should usually group 2–3 sentences that belong together.`,
      `7. **Output Format**: The output must be a properly formatted transcript with correct punctuation, capitalization, sentence structure, and paragraphing. No extra notes, no explanation—just the final formatted text.`,
      ``,
      `Example:`,
      `Input:`,
      `"yesterday i met john at the coffee shop we talked about the project timeline and he said we should move the deadline to friday can you send the draft by tomorrow morning also i think the design needs a lighter header color what do you think"`,
      ``,
      `Output:`,
      `"Yesterday, I met John at the coffee shop. We talked about the project timeline, and he said we should move the deadline to Friday. Can you send the draft by tomorrow morning? Also, I think the design needs a lighter header color. What do you think?"`,
      ``,
      `Input to format:`,
      input,
      `Output (formatted transcript only):`,
    ].join("\n");

    const { text: out } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    const corrected = (out || "").trim();

    return new Response(JSON.stringify({ text: corrected }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to correct text" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
