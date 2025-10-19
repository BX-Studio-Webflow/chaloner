import { ApplyResponse } from "@/types/apply";
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
    const phone = (formData.get("Phone-Number") || "00000000000") as string;
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

    // console.log({
    //   email,
    //   name,
    //   phone,
    //   linkedin,
    //   resume,
    //   allAdditionalFiles,
    //   allAdditionalFilesLength: allAdditionalFiles.length,
    // });

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

    const result = (await response.json()) as ApplyResponse;
    // console.log({ result });
    if (
      result.ok &&
      (coverLetter ||
        additionalFiles.length > 0 ||
        desiredSalary ||
        desiredAdditionalCompensation)
    ) {
      const updatePersonFormData = new FormData();
      if (desiredSalary) {
        updatePersonFormData.append("person[salary]", desiredSalary);
      }
      if (desiredAdditionalCompensation) {
        updatePersonFormData.append(
          "person[bonus]",
          desiredAdditionalCompensation
        );
      }
      if (allAdditionalFiles.length > 0) {
        updatePersonFormData.append(`person[document]`, allAdditionalFiles[0]);
      }

      const personId = result.person.id;
      const updatePersonURL = `https://app.loxo.co/api/chaloner/people/${personId}`;
      const updateResponse = await fetch(updatePersonURL, {
        method: "PUT",
        headers: {
          Authorization: BEARER_AUTH_HEADER,
        },
        body: updatePersonFormData,
      });

      if (!updateResponse.ok) {
        throw new Error(
          `Loxo Person Update API responded with status: ${updateResponse.status}`
        );
      }
      const updateResult = await updateResponse.json();
      // console.log({ updateResult });
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
              `Failed to upload additional file ${i + 1}: ${
                fileResponse.status
              }`
            );
          } else {
            const fileResult = await fileResponse.json();
            // console.log(`Successfully uploaded additional file ${i + 1}`, {
            //   fileResult,
            // });
          }
        }
      }
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error applying for job:", error);
    return NextResponse.json(
      { error: "Failed to apply for job" },
      { status: 500 }
    );
  }
}
