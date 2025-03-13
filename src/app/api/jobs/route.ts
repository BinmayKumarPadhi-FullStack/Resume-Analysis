import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const jobsPerPage = searchParams.get("results_per_page") || "10";
    const skills = searchParams.get("what") || "";

    // ✅ Ensure API keys are loaded
    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
    const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;

    if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
      return NextResponse.json({ error: "Missing Adzuna API credentials" }, { status: 500 });
    }

    const api_url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=${jobsPerPage}&what=${skills}&content-type=application/json`;

    const response = await fetch(api_url);
    const data = await response.json();

    // ✅ Check if Adzuna returns an authorization error
    if (data.exception === "AUTH_FAIL") {
      console.error("🚨 Adzuna Authorization Failed:", data);
      return NextResponse.json({ error: "Authorization failed. Check API credentials." }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("🚨 API Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
