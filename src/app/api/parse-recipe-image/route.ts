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
      - If multiple parts of the recipe are specified in the description or the ingredients (eg. batter, sauce, ...), specify in steps by providing the part in parentheses.

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
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    // 5. Validate and parse the response
    if (!response || !response.choices || response.choices.length === 0) {
      console.error("OpenAI API returned empty choices array:", response);
      return NextResponse.json({ error: "AI did not return any content. Please try again." }, { status: 500 });
    }

    const firstChoice = response.choices[0];
    if (!firstChoice || !firstChoice.message) {
      console.error("OpenAI API response missing message:", response);
      return NextResponse.json({ error: "AI response was malformed. Please try again." }, { status: 500 });
    }

    const rawContent = firstChoice.message.content;
    if (!rawContent || rawContent.trim().length === 0) {
      console.error("OpenAI API returned empty content:", response);
      return NextResponse.json({ error: "AI did not return any content. Please try again with a clearer image." }, { status: 500 });
    }

    // 6. Parse the JSON response
    let recipeData: ParsedRecipeData;
    try {
      recipeData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", rawContent, parseError);
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again." }, { status: 500 });
    }

    console.log("Successfully parsed recipe data:", recipeData);
    return NextResponse.json(recipeData);

  } catch (error) {
    console.error("Error parsing recipe from image:", error);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      // Check for OpenAI API specific errors
      if (error.message.includes('API key')) {
        return NextResponse.json({ error: "OpenAI API key is missing or invalid." }, { status: 500 });
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 });
      }
      if (error.message.includes('invalid image')) {
        return NextResponse.json({ error: "Invalid image format. Please upload a valid image file." }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || "Failed to parse recipe from image." }, { status: 500 });
    }
    
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 });
  }
}