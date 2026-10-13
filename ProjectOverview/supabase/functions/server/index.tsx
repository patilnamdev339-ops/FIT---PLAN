import { Hono } from "npm:hono"
import { cors } from "npm:hono/cors"
import { logger } from "npm:hono/logger"
import * as kv from "./kv_store.tsx"
const app = new Hono()

// Enable logger
app.use("*", logger(console.log))

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
)

// Health check endpoint
app.get("/make-server-e047e250/health", (c) => {
  return c.json({ status: "ok" })
})

interface OpenAIFoodItem {
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

const isValidImage = (value: unknown): value is string =>
  typeof value === "string" &&
  /^data:image\/(jpeg|png|webp);base64,/.test(value) &&
  value.length <= 8_000_000

app.post("/make-server-e047e250/analyze-food-image", async (c) => {
  try {
    const { image } = await c.req.json()
    if (!isValidImage(image)) {
      return c.json(
        { error: "Upload a JPEG, PNG, or WebP image smaller than 6 MB." },
        400,
      )
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY")
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not configured")
      return c.json({ error: "Food analysis is not configured yet." }, 503)
    }

    const openAIResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          max_tokens: 1200,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "food_analysis",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  mealName: { type: "string" },
                  foods: {
                    type: "array",
                    minItems: 1,
                    maxItems: 12,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        name: { type: "string" },
                        servingSize: { type: "string" },
                        calories: { type: "number" },
                        protein: { type: "number" },
                        carbs: { type: "number" },
                        fat: { type: "number" },
                      },
                      required: [
                        "name",
                        "servingSize",
                        "calories",
                        "protein",
                        "carbs",
                        "fat",
                      ],
                    },
                  },
                },
                required: ["mealName", "foods"],
              },
            },
          },
          messages: [
            {
              role: "system",
              content:
                "You are a nutrition image analysis assistant. Identify each distinct visible food and estimate its consumed portion and nutrition. Return calories in kcal and protein, carbs, and fat in grams. Include cooking oils, sauces, and drinks when visible. Use concise familiar food names and practical serving descriptions. Be realistic about uncertainty; do not claim medical precision.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this meal photo. Estimate every visible food item, portion, calories, protein, carbs, and fat. Give the meal a short descriptive name.",
                },
                {
                  type: "image_url",
                  image_url: { url: image, detail: "high" },
                },
              ],
            },
          ],
        }),
      },
    )

    const openAIData = await openAIResponse.json()
    if (!openAIResponse.ok) {
      console.error(
        "OpenAI food analysis failed:",
        openAIResponse.status,
        openAIData?.error?.type,
        openAIData?.error?.code,
      )
      return c.json(
        {
          error: "We couldn't analyze this photo right now. Please try again.",
        },
        502,
      )
    }

    const content = openAIData?.choices?.[0]?.message?.content
    if (typeof content !== "string") {
      console.error("OpenAI returned no food analysis content")
      return c.json(
        { error: "No food could be identified in this photo." },
        422,
      )
    }

    const parsed = JSON.parse(content) as {
      mealName: string
      foods: OpenAIFoodItem[]
    }
    const foods = parsed.foods
      .filter((food) => food.name.trim())
      .map((food) => ({
        ...food,
        calories: Math.max(0, Math.round(Number(food.calories) || 0)),
        protein: Math.max(0, Math.round((Number(food.protein) || 0) * 10) / 10),
        carbs: Math.max(0, Math.round((Number(food.carbs) || 0) * 10) / 10),
        fat: Math.max(0, Math.round((Number(food.fat) || 0) * 10) / 10),
      }))

    if (foods.length === 0) {
      return c.json(
        { error: "No food could be identified in this photo." },
        422,
      )
    }

    return c.json({
      mealName: parsed.mealName?.trim() || "Scanned Meal",
      foods,
    })
  } catch (error) {
    console.error("Food image analysis error:", error)
    return c.json(
      { error: "Something went wrong while analyzing the photo." },
      500,
    )
  }
})

Deno.serve(app.fetch)
