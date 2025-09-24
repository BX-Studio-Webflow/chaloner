import { JobResponse } from "@/types/job";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const REVALIDATE_SECONDS = 10 * 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const jobId = (await params).id;
    const baseURL = new URL(`https://app.loxo.co/api/chaloner/jobs/${jobId}`);
    const BEARER_AUTH_HEADER = "Bearer " + process.env.BEARER_AUTH!;

    const response = await fetch(baseURL.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: BEARER_AUTH_HEADER,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: JobResponse = await response.json();

    return NextResponse.json(restructureJobData(data));
  } catch (error) {
    console.error("Error fetching Job:", error);
    return NextResponse.json(
      { error: "Failed to fetch Job details" },
      { status: 500 }
    );
  }
}

function restructureJobData(jobResponse: JobResponse) {
  return {
    id: jobResponse.id,
    title: jobResponse.title,
    company: jobResponse.company.name,
    location: jobResponse.macro_address ?? "Remote",
    description: jobResponse.description,
  };
}
