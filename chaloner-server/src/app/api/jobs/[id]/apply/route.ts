import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const jobId = (await params).id;
    const baseURL = new URL(
      `https://app.loxo.co/api/chaloner/jobs/${jobId}/apply`
    );
    const BEARER_AUTH_HEADER = "Bearer " + process.env.BEARER_AUTH!;

    const formData = await request.formData();
    const email = formData.get("Email") as string;
    const name =
      (formData.get("First-Name") as string) +
      " " +
      (formData.get("Last-Name") as string);
    const phone = formData.get("Phone-Number") as string;
    const linkedin = formData.get("Linkedin-URL") as string;
    const resume = formData.get("Resume") as File;

    console.log({ email, name, phone, linkedin, resume });

    const loxoFormData = new FormData();
    loxoFormData.append("email", email);
    loxoFormData.append("name", name);
    loxoFormData.append("phone", phone);
    loxoFormData.append("linkedin", linkedin);
    loxoFormData.append("resume", resume);

    const response = await fetch(baseURL.toString(), {
      method: "POST",
      headers: {
        Authorization: BEARER_AUTH_HEADER,
      },
      body: loxoFormData,
    });

    if (!response.ok) {
      throw new Error(`Loxo API responded with status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error applying for job:", error);
    return NextResponse.json(
      { error: "Failed to apply for job" },
      { status: 500 }
    );
  }
}
