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
          You are an AI designed to extract specific details from resumes.
          Extract the candidate's Name and Skills only.
          Based on the extracted skills, provide the following details for each skill:
          1. Job demand and market percentage for each skill.
          2. Suggestions for improving the resume based on the extracted data.
          3. General insights about the candidate's skills and their potential career trajectory.
          Format your response as a structured JSON object with the following properties:
          - 'name': The candidate's name.
          - 'skills': A list of extracted skills.
          - 'skills_details': A list of objects, each containing the skill name, job demand percentage, and recommendations for improvement.
          - 'resume_improvement_suggestions': Suggestions for improving the resume based on the extracted data.
          - 'insights': General insights about the candidate's skills and career trajectory.
        `,
        },
        {
          role: "user",
          content: `${extractedData}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1700,
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
