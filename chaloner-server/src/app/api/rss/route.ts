import { JobsResponse } from "@/types/jobs";
import { JobResponse } from "@/types/job";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const REVALIDATE_SECONDS = 24 * 60 * 60; // 1 day in seconds

export async function GET() {
  try {
    const BEARER_AUTH = process.env.BEARER_AUTH;
    if(!BEARER_AUTH) {
      throw new Error("Missing BEARER_AUTH environment variable");
    }
    const baseURL = new URL(`https://app.loxo.co/api/chaloner/jobs`);
    baseURL.searchParams.append("published", "true");
    baseURL.searchParams.append("job_status_id", "79157");
    baseURL.searchParams.append("per_page", "100");
    const BEARER_AUTH_HEADER = "Bearer " + BEARER_AUTH;
    const fetchDescription = true;
    
    const response = await fetch(baseURL.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: BEARER_AUTH_HEADER,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
        console.error(response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jobsResponse: JobsResponse = await response.json();
    
    // Fetch full job details with descriptions using Promise.all
    let jobsWithDescriptions: (JobResponse | JobsResponse['results'][0])[] = jobsResponse.results;
    
    if (fetchDescription) {
      const jobDetailsPromises = jobsResponse.results.map(async (job) => {
        try {
          const jobDetailResponse = await fetch(
            `https://app.loxo.co/api/chaloner/jobs/${job.id}`,
            {
              headers: {
                Accept: "application/json",
                Authorization: BEARER_AUTH_HEADER,
              },
              next: { revalidate: REVALIDATE_SECONDS },
            }
          );
          
          if (jobDetailResponse.ok) {
            const jobDetail: JobResponse = await jobDetailResponse.json();
            // Merge original job data with detailed data to preserve fields like updated_at
            return { ...job, ...jobDetail };
          }
          return job;
        } catch (error) {
          console.error(`Error fetching job ${job.id}:`, error);
          return job;
        }
      });
      
      jobsWithDescriptions = await Promise.all(jobDetailsPromises);
    }
  
    const rssXml = generateRSSFeed(jobsWithDescriptions);

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

function formatDateISO(date: Date | string): string {
  const d = new Date(date);
  const offset = -d.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? "+" : "-";
  const pad = (num: number) => String(num).padStart(2, "0");
  
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offsetSign}${pad(offsetHours)}:${pad(offsetMinutes)}`;
}

function generateRSSFeed(jobs: any[]): string {
  const currentDate = new Date().toUTCString();
  const baseUrl = "https://chaloner.com/open-roles";
  
  const items = jobs
    .map((job) => {
      console.log(job);
      const title = escapeXml(
        `${job.title}${job.macro_address ? ` (${job.macro_address})` : ""}`
      );
      const location = job.macro_address ?? "Remote";
      const jobUrl = `${baseUrl}?jobId=${job.id}`;
      
      const date = new Date();
      const firstOfYear = new Date(date.getFullYear(), 0, 1);
      
      // Use full description if available
      const description = job.description || "";
      
      // Additional job data
      const city = job.city || "";
      const state = job.state_code || "";
      const country = job.country_code === "US" ? "USA" : job.country_code || "";
      const datePosted = job.published_at ? formatDateISO(job.published_at) : "";
      const dateEntered = job.created_at ? formatDateISO(job.created_at) : "";
      const updated_at = job.updated_at ? formatDateISO(job.updated_at) : "";
      const salary = job.salary ? `$${job.salary}` : "";
      const remote = job.remote_work_allowed ? "Full" : "Not Specified";

      return `
    <item>
      <title>${title}</title>
      <link>${jobUrl}</link>
      <guid isPermaLink="true">${jobUrl}</guid>
      <pubDate>${updated_at}</pubDate>
      <published>${datePosted}</published>
      <description><![CDATA[${description}]]></description>
      <city><![CDATA[${city}]]></city>
      <state><![CDATA[${state}]]></state>
      <country><![CDATA[${country}]]></country>
      <salary><![CDATA[${salary}]]></salary>
      <remote><![CDATA[${remote}]]></remote>
      <jobid><![CDATA[${job.id}]]></jobid>
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
