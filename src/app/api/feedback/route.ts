import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Extract form data from the request body
    const { name, email, message } = await req.json();

    // Perform server-side validation (optional)
    if (!name || !email || !message) {
      return NextResponse.json(
        { status: "error", message: "All fields are required." },
        { status: 400 }
      );
    }
    // Respond with a success message
    return NextResponse.json({ status: "success", message: "Feedback received" });
  } catch (error: unknown) {
    const e = error as Error;
    return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
  }
}
