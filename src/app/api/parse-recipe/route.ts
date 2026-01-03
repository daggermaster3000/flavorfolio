import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

interface ParsedRecipeData {
  title?: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
  prep_time?: number | string;
  cook_time?: number | string;
  servings?: number | string;
  tags?: string[];
  calories?: number | string;
  protein?: number | string;
}

/**
 * Resolve TikTok short URL to final URL
 */
async function resolveTikTokUrl(shortUrl: string): Promise<string | null> {
  try {
    const response = await fetch(shortUrl, {
      method: "HEAD",
      redirect: "follow",
    });
    return response.url;
  } catch (err) {
    console.error("Error resolving TikTok link:", err);
    return null;
  }
}

/**
 * Get TikTok description via oEmbed API
 */
async function getTikTokDescription(videoUrl: string): Promise<string | null> {
  try {
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const res = await fetch(endpoint, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch TikTok oEmbed:", res.status);
      return null;
    }

    const data: { title?: string } = await res.json();
    return data.title ?? null;
  } catch (err) {
    console.error("Error fetching TikTok description:", err);
    return null;
  }
}

/**
 * Download TikTok video and return as buffer
 */
async function downloadTikTokVideo(videoUrl: string): Promise<Buffer | null> {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(videoUrl, { waitUntil: "networkidle2" });

    // Extract video src
    const videoSrc: string | null = await page.evaluate(() => {
      const video = document.querySelector("video");
      return video?.src ?? null;
    });

    await browser.close();

    if (!videoSrc) {
      console.error("No video src found on TikTok page");
      return null;
    }

    const res = await fetch(videoSrc);
    const videoBuffer = Buffer.from(await res.arrayBuffer());
    return videoBuffer;
  } catch (err) {
    console.error("Error downloading TikTok video:", err);
    return null;
  }
}

/**
 * Transcribe video/audio buffer using OpenAI Whisper
 */
async function transcribeWithWhisper(videoBuffer: Buffer): Promise<string | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY");

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([new Uint8Array(videoBuffer)], { type: "audio/mp4" }),
      "tiktok_video.mp4"
    );
    formData.append("model", "gpt-4o-mini-transcribe");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: formData as unknown as BodyInit,
    });

    if (!res.ok) {
      console.error("Whisper API error:", await res.text());
      return null;
    }

    const data: { text?: string } = await res.json();
    return data.text ?? null;
  } catch (err) {
    console.error("Error transcribing audio:", err);
    return null;
  }
}


/**
 * Check if text contains keywords indicating a recipe
 */
function looksLikeRecipe(text: string): boolean {
  const recipeKeywords = ["recipe", "ingredients", "cook", "bake", "boil", "serve"];
  return recipeKeywords.some((word) => text.toLowerCase().includes(word));
}

export async function POST(request: NextRequest) {
  try {
    const { tiktokUrl } = (await request.json()) as { tiktokUrl?: string };
    if (!tiktokUrl) {
      return NextResponse.json({ error: "TikTok URL is required" }, { status: 400 });
    }

    // Step 1: Resolve TikTok URL
    const resolvedUrl = await resolveTikTokUrl(tiktokUrl);
    if (!resolvedUrl) {
      return NextResponse.json({ error: "Could not resolve TikTok link" }, { status: 400 });
    }

    // Step 2: Get description
    const description: string | null = await getTikTokDescription(resolvedUrl);
    let recipeSource: string | null = null;

    if (description && looksLikeRecipe(description)) {
      recipeSource = description;
    } else {
      // Fallback to audio transcription
      const videoBuffer = await downloadTikTokVideo(resolvedUrl);
      if (videoBuffer) {
        const transcript = await transcribeWithWhisper(videoBuffer);
        if (transcript && looksLikeRecipe(transcript)) {
          recipeSource = transcript;
        }
      }
    }

    if (!recipeSource) {
      return NextResponse.json({ error: "No recipe found in description or audio" }, { status: 400 });
    }

    const tiktokDescription = `Recipe from TikTok:\n${recipeSource}\n\nVideo URL: ${resolvedUrl}`;

    // Step 3: Call OpenAI to parse recipe (keep your original prompt)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY");

    const prompt = `
You are a precise recipe parser. Extract structured information from the following TikTok recipe description.  

⚠️ Rules:
- Output **only valid JSON** with the exact keys listed below.
- Do not include any commentary or text outside the JSON.
- If a value is missing (protein, calories, servings), make a reasonable estimate.
- Preserve **all steps from the recipe** in the same logical order, even if they seem redundant.
- If steps are unclear or merged, split them into clear cooking actions.

Formatting rules:
- title: short string
- description: playful one-liner with an edgy joke
- ingredients: array of strings (include relevant emojis for each item)
- steps: array of concise cooking instructions (cover every step, no skipping)
- prep_time: number (minutes)
- cook_time: number (minutes)
- servings: number
- tags: array of up to 3 strings (e.g., cuisine, style, diet)
- protein: number (grams)
- calories: number (Cal)

TikTok description and URL:
${tiktokDescription}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return NextResponse.json({ error: "Failed to parse recipe with AI" }, { status: 500 });
    }

    const data = await response.json();
    const recipeData: ParsedRecipeData = JSON.parse(data.choices[0].message.content);
    const finalData = { ...recipeData, tiktok_url: resolvedUrl };

    return NextResponse.json(finalData);
  } catch (error) {
    console.error("Error parsing recipe:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
