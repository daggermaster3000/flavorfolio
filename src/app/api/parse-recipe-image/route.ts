// file: app/api/parse-recipe-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define the expected structure of the parsed recipe data
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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // 1. Get the uploaded image file from the request
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // 2. Convert the image file to a base64 string
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = imageFile.type;

    // 3. Craft the prompt for the AI model
    const prompt = `
      You are a precise recipe parser. Extract structured information from the image provided, which contains a recipe.

      ⚠️ Rules:
      - Output **only valid JSON** with the exact keys listed below.
      - Do not include any commentary or text outside the JSON.
      - If a value is missing (protein, calories, servings), make a reasonable estimate.
      - Preserve **all steps from the recipe** in the same logical order, even if they seem redundant.
      - If steps are unclear or merged, split them into clear cooking actions.

      Formatting rules:
      - title: short string
      - description: a concise one-liner based on the recipe's image and text, with an edgy joke.
      - ingredients: array of strings (include relevant emojis for each item)
      - steps: array of concise cooking instructions (cover every step, no skipping)
      - prep_time: number (minutes)
      - cook_time: number (minutes)
      - servings: number
      - tags: array of up to 3 strings (e.g., cuisine, style, diet)
      - protein: number (grams)
      - calories: number (Cal)
      `;

    // 4. Call the OpenAI GPT-4o vision model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    // 5. Parse and return the response
    const rawContent = response.choices[0].message.content;
    if (!rawContent) {
      return NextResponse.json({ error: "AI did not return any content." }, { status: 500 });
    }
    
    const recipeData = JSON.parse(rawContent);

    console.log(recipeData);
    return NextResponse.json(recipeData);

  } catch (error) {
    console.error("Error parsing recipe from image:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}