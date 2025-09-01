import { NextRequest, NextResponse } from 'next/server';
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
async function resolveTikTokUrl(shortUrl: string): Promise<string | null> {
  try {
    const response = await fetch(shortUrl, {
      method: "HEAD", // only request headers, not full HTML
      redirect: "follow",
    });
    return response.url; // final resolved TikTok video URL
  } catch (err) {
    console.error("Error resolving TikTok link:", err);
    return null;
  }
}



async function getTikTokDescription(videoUrl: string): Promise<string | null> {
  try {
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const res = await fetch(endpoint, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch TikTok oEmbed:", res.status);
      return null;
    }

    const data = await res.json();
    return data.title || null; // `title` contains the video description

  } catch (err) {
    console.error("Error fetching TikTok description:", err);
    return null;
  }
}



export async function POST(request: NextRequest) {
  try {
    const { tiktokUrl } = await request.json();
    if (!tiktokUrl) {
      return NextResponse.json({ error: "TikTok URL is required" }, { status: 400 });
    }

    // Step 1: Resolve vm.tiktok.com → full TikTok URL
    const resolvedUrl = await resolveTikTokUrl(tiktokUrl);
    console.log(resolvedUrl)
    if (!resolvedUrl) {
      return NextResponse.json({ error: "Could not resolve TikTok link" }, { status: 400 });
    }

    // Step 2: Extract description
   // Step 2: Extract actual description from TikTok page
  const description = await getTikTokDescription(resolvedUrl);
  if (!description) {
    console.log('bite')
    return NextResponse.json({ error: "Could not extract TikTok description" }, { status: 400 });
  }

  const tiktokDescription = `Recipe from TikTok:\n${description} , url:\n${resolvedUrl}`;
  

    // Step 3: Call OpenAI to parse recipe
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const prompt = `
      Parse the following TikTok recipe description and return only a JSON object with these keys (if protein and calories are lacking, estimate from the rest of the recipe). Feature emojis in the ingredients and for the description use a borderline joke:
      - title (string)
      - description (string)
      - ingredients (array of strings)
      - steps (array of strings)
      - prep_time (number, minutes)
      - cook_time (number, minutes)
      - servings (number)
      - tags (array of strings, maximum 3)
      - protein (grams)
      - calories (Cal)

      TikTok description + url link:
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
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return NextResponse.json({ error: "Failed to parse recipe with AI" }, { status: 500 });
    }

    const data = await response.json();
    const recipeData = JSON.parse(data.choices[0].message.content);
    console.log(recipeData)
    return NextResponse.json(recipeData);
  } catch (error) {
    console.error("Error parsing recipe:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

