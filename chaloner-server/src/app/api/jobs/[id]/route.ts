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
  const customQuestions = extractCustomQuestions(jobResponse);

  return {
    id: jobResponse.id,
    title: jobResponse.title,
    company: jobResponse.company_hidden
      ? "Confidential Company"
      : jobResponse.company?.name ?? "Confidential Company",
    company_hidden: jobResponse.company_hidden,
    location: jobResponse.macro_address ?? "Remote",
    description: jobResponse.description,
    status: jobResponse.status?.name ?? "Unknown",
    is_active: jobResponse.status?.id === 79157,
    custom_questions: customQuestions,
  };
}

function extractCustomQuestions(jobResponse: JobResponse) {
  const source = jobResponse as unknown as Record<string, unknown>;
  const candidateArrays = [
    source.custom_questions,
    source.application_questions,
    source.questions,
    source.screening_questions,
  ];

  for (const candidate of candidateArrays) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item, index) => normalizeQuestion(item, index))
        .filter(Boolean);
    }
  }

  return [];
}

function normalizeQuestion(question: unknown, index: number) {
  if (!question || typeof question !== "object") {
    return null;
  }

  const candidate = question as Record<string, unknown>;
  const label = String(
    candidate.label ??
      candidate.question ??
      candidate.title ??
      candidate.name ??
      ""
  ).trim();

  if (!label) {
    return null;
  }

  const optionsValue = candidate.options ?? candidate.choices ?? [];
  const options = Array.isArray(optionsValue)
    ? optionsValue.map((option) =>
        typeof option === "string"
          ? option
          : String((option as Record<string, unknown>).label ?? "")
      )
    : [];

  return {
    id: String(candidate.id ?? candidate.key ?? candidate.field ?? index),
    label,
    required: Boolean(candidate.required),
    type: String(candidate.type ?? "text"),
    field_key: String(
      candidate.field_key ?? candidate.key ?? candidate.field ?? index
    ),
    options: options.filter(Boolean),
  };
}
