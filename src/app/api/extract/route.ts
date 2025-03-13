import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { extractedData } = await req.json();

    if (!extractedData || extractedData.trim() === "") {
      return NextResponse.json({ error: "Resume text is required and cannot be empty." }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            You are an AI that extracts key information from resumes. 
             Identify the candidate's Name, Experience, Skills, Projects and Education. 
             Format the response as a structured JSON object.
            `,
        },
        {
          role: "user",
          content: `${extractedData}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    // ✅ Ensure the response is a valid JSON object before returning
    if (!response.choices || response.choices.length === 0) {
      throw new Error("Invalid OpenAI response format");
    }

    return NextResponse.json(response.choices[0].message.content); // ✅ Return parsed JSON
  } catch (error) {
    console.error("🚨 OpenAI API Error:", error);
    return NextResponse.json({ error: "Failed to process resume", details: error }, { status: 500 });
  }
}
