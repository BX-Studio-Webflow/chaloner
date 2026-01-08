import { JobsResponse } from "@/types/jobs";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const REVALIDATE_SECONDS = 10 * 60;

export async function GET() {
  try {
    const baseURL = new URL(`https://app.loxo.co/api/chaloner/jobs`);
    baseURL.searchParams.append("published", "true");
    baseURL.searchParams.append("job_status_id", "79157");
    baseURL.searchParams.append("per_page", "100");
    const BEARER_AUTH_HEADER = "Bearer " + process.env.BEARER_AUTH!;

    const response = await fetch(baseURL.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: BEARER_AUTH_HEADER,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jobsResponse: JobsResponse = await response.json();

    return NextResponse.json(restructureJobsData(jobsResponse));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

function restructureJobsData(jobsResponse: JobsResponse) {
  return jobsResponse.results.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company.name,
    location: job.macro_address ?? "Remote",
    published_at: job.published_at,
    updated_at: job.updated_at,
    opened_at: job.opened_at,
  }));
}
