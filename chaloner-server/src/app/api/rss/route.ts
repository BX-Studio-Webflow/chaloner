import { JobsResponse } from "@/types/jobs";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const REVALIDATE_SECONDS = 10 * 60;

export async function GET() {
  try {
    if(!process.env.BEARER_AUTH) {
      throw new Error("Missing BEARER_AUTH environment variable");
    }
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
        console.log(response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jobsResponse: JobsResponse = await response.json();
    console.log(jobsResponse)
    const rssXml = generateRSSFeed(jobsResponse);

    return new NextResponse(rssXml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new NextResponse("Failed to generate RSS feed", { status: 500 });
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateRSSFeed(jobsResponse: JobsResponse): string {
  const currentDate = new Date().toUTCString();
  const baseUrl = "https://chaloner.com/open-roles";

  const items = jobsResponse.results
    .map((job) => {
      const title = escapeXml(
        `${job.title}${job.macro_address ? ` (${job.macro_address})` : ""}`
      );
      const location = job.macro_address ?? "Remote";
      const jobUrl = `${baseUrl}/${job.id}`;
      const published_at = new Date(job.published_at).toUTCString();

      return `
    <item>
      <title>${title}</title>
      <link>${jobUrl}</link>
      <guid isPermaLink="true">${jobUrl}</guid>
      <pubDate>${published_at}</pubDate>
      <description><![CDATA[
        <p><strong>Location:</strong> ${escapeXml(location)}</p>
        <p><strong>Job ID:</strong> ${job.id}</p>
      ]]></description>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Chaloner — Open Roles</title>
    <link>${baseUrl}</link>
    <description>Explore open opportunities that match your skills and your passion.</description>
    <language>en-us</language>
    <lastBuildDate>${currentDate}</lastBuildDate>${items}
  </channel>
</rss>`;
}
