import { PersonResponse } from "@/types/person";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const baseURL = new URL(`https://app.loxo.co/api/chaloner/people`);
    const BEARER_AUTH_HEADER = "Bearer " + process.env.BEARER_AUTH!;
    console.log(BEARER_AUTH_HEADER);

    const formData = await request.formData();
    const email = formData.get("Email") as string;
    const name =
      (formData.get("First-Name") as string) +
      " " +
      (formData.get("Last-Name") as string);
    const phone = formData.get("Phone-Number") as string;
    const linkedin = formData.get("Linkedin-URL") as string;
    const resume = formData.get("Resume") as File;
    const desiredSalary = formData.get("desiredSalary") as string;
    const desiredAdditionalCompensation = formData.get(
      "desiredAdditionalCompensation"
    ) as string;
    const coverLetter = formData.get("cover_letter") as File;
    const additionalFiles = formData.getAll("additionalFile") as File[];
    const allAdditionalFiles = coverLetter
      ? [coverLetter, ...additionalFiles]
      : additionalFiles;

    const loxoFormData = new FormData();
    loxoFormData.append("person[email]", email);
    loxoFormData.append("person[name]", name);
    loxoFormData.append("person[phone]", phone);
    loxoFormData.append("person[linkedin_url]", linkedin);
    loxoFormData.append("person[resume]", resume);
    if (desiredSalary) {
      loxoFormData.append("person[salary]", desiredSalary);
    }
    if (desiredAdditionalCompensation) {
      loxoFormData.append("person[bonus]", desiredAdditionalCompensation);
    }
    if (allAdditionalFiles.length > 0) {
      loxoFormData.append(`person[document]`, allAdditionalFiles[0]);
    }

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

    const result = (await response.json()) as PersonResponse;
    const personId = result.person.id;
    const updatePersonURL = `https://app.loxo.co/api/chaloner/people/${personId}`;

    if (allAdditionalFiles.length > 1) {
      for (let i = 1; i < allAdditionalFiles.length; i++) {
        const fileFormData = new FormData();
        fileFormData.append(`person[document]`, allAdditionalFiles[i]);
        const fileResponse = await fetch(updatePersonURL, {
          method: "PUT",
          headers: {
            Authorization: BEARER_AUTH_HEADER,
          },
          body: fileFormData,
        });
        if (!fileResponse.ok) {
          console.error(
            `Failed to upload additional file ${i + 1}: ${fileResponse.status}`
          );
        } else {
          const fileResult = await fileResponse.json();
          console.log(`Successfully uploaded additional file ${i + 1}`, {
            fileResult,
          });
        }
      }
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 }
    );
  }
}
