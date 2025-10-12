// Job Application Form System - TypeScript OOP Version
// Handles application form submission and validation

// ===== INTERFACES AND TYPES =====
interface ApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  linkedinUrl: string;
  consent: boolean;
  resume?: File | null;
  coverLetter?: File | null;
  additionalFiles?: File[] | null;
  desiredSalary: string;
  desiredAdditionalCompensation: string;
}

interface FormElements {
  form: HTMLFormElement;
  fileInputSections: NodeListOf<HTMLElement>;
  successMessage: HTMLElement;
  errorMessage: HTMLElement;
  submitButton: HTMLInputElement;
  phoneInput: HTMLInputElement;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// TypeScript declarations for intl-tel-input
declare global {
  interface Window {
    intlTelInput: any;
    jobApplicationForm: JobApplicationForm;
  }
}

// ===== UTILITY CLASSES =====
class JobApplicationValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly LINKEDIN_REGEX =
    /^https?:\/\/(www\.)?linkedin\.com\/.+/i;

  static validateEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  static validateLinkedInUrl(url: string): boolean {
    if (!url) return true; // Optional field
    return this.LINKEDIN_REGEX.test(url);
  }

  static validateForm(formData: ApplicationData): string[] {
    const errors: string[] = [];

    if (!formData.firstName?.trim()) {
      errors.push("First name is required");
    }

    if (!formData.lastName?.trim()) {
      errors.push("Last name is required");
    }

    if (!formData.email?.trim()) {
      errors.push("Email is required");
    } else if (!this.validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (!formData.phoneNumber?.trim()) {
      errors.push("Phone number is required");
    }

    if (
      formData.linkedinUrl &&
      !this.validateLinkedInUrl(formData.linkedinUrl)
    ) {
      errors.push("Please enter a valid LinkedIn URL");
    }

    return errors;
  }
}

class FileValidator {
  private static readonly ALLOWED_FILE_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  static validateFile(file: File): ValidationResult {
    const errors: string[] = [];

    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push("Please upload a PDF, DOC, DOCX, or TXT file");
    }

    if (file.size > this.MAX_FILE_SIZE) {
      errors.push("File size must be less than 5MB");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// ===== MAIN FORM CLASS =====
class JobApplicationForm {
  private formElements!: FormElements;
  private uploadedResumeFile: File | null = null;
  private uploadedCoverLetterFile: File | null = null;
  private uploadedAdditionalFiles: File[] = [];
  private originalButtonText: string = "";
  private phoneInputInstance: any = null;

  private readonly SUCCESS_MESSAGE_DURATION = 5000;
  private readonly ERROR_MESSAGE_DURATION = 8000;

  constructor() {
    this.initializeForm();
  }

  // ===== INITIALIZATION =====
  private async initializeForm(): Promise<void> {
    try {
      this.initializeFormElements();
      this.bindFormEvents();
      this.setupInitialState();
      this.injectStyles();
    } catch (error) {
      console.error("Failed to initialize job application form:", error);
      this.showError("Form initialization failed. Please refresh the page.");
    }
  }

  private initializeFormElements(): void {
    const form = document.getElementById("email-form-2") as HTMLFormElement;
    const successMessage = document.querySelector(
      '[dev-target="form-success"]'
    ) as HTMLElement;
    const errorMessage = document.querySelector(".w-form-fail") as HTMLElement;
    const submitButton = form?.querySelector(
      'input[type="submit"]'
    ) as HTMLInputElement;
    const phoneInput = document.getElementById(
      "Phone-Number"
    ) as HTMLInputElement;

    if (!form || !submitButton) {
      throw new Error("Required form elements not found");
    }

    this.formElements = {
      form,
      fileInputSections: document.querySelectorAll(
        '[dev-target="files-section"]'
      ),
      successMessage: successMessage || document.createElement("div"),
      errorMessage: errorMessage || document.createElement("div"),
      submitButton,
      phoneInput: phoneInput || document.createElement("input"),
    };

    this.originalButtonText = submitButton.value;
    this.initializePhoneInput();
  }

  private initializePhoneInput(): void {
    if (
      !this.formElements.phoneInput ||
      typeof window.intlTelInput === "undefined"
    ) {
      console.warn("Phone input or intlTelInput library not available");
      return;
    }

    try {
      this.phoneInputInstance = window.intlTelInput(
        this.formElements.phoneInput,
        {
          initialCountry: "gb",
          preferredCountries: ["gb", "us", "ca", "au"],
          separateDialCode: true,
          autoPlaceholder: "aggressive",
          utilsScript:
            "https://cdn.jsdelivr.net/npm/intl-tel-input@25.10.12/build/js/utils.js",
          validationNumberType: "MOBILE",
        }
      );

      this.formElements.phoneInput.addEventListener("countrychange", () => {
        this.clearPhoneError();
      });
    } catch (error) {
      console.error("Failed to initialize intl-tel-input:", error);
    }
  }

  // ===== EVENT BINDING =====
  private bindFormEvents(): void {
    if (!this.formElements.form) return;

    // File input sections
    this.formElements.fileInputSections.forEach((section) => {
      const sectionInput = section.querySelector('input[type="file"]');
      const sectionFileTemplate = section.querySelector<HTMLElement>(
        "[dev-target=file-item-template]"
      );
      const sectionFileTemplateContainer = sectionFileTemplate?.parentElement;
      const sectionUploadSection = section.querySelector<HTMLElement>(
        ".roles-application-form_file_contain"
      );

      if (
        sectionInput &&
        sectionUploadSection &&
        sectionFileTemplateContainer
      ) {
        section.addEventListener("change", (event) =>
          this.handleFileInputChange(
            event,
            sectionFileTemplate,
            sectionUploadSection,
            sectionFileTemplateContainer
          )
        );
      }
    });

    // Form submission
    this.formElements.form.addEventListener(
      "submit",
      this.handleFormSubmit.bind(this)
    );

    // Input change for validation feedback
    this.formElements.form.addEventListener(
      "input",
      this.handleInputChange.bind(this)
    );
  }

  private setupInitialState(): void {
    if (this.formElements.fileInputSections) {
      this.formElements.fileInputSections.forEach((section) => {
        const fileTemplate = section.querySelector<HTMLElement>(
          "[dev-target=file-item-template]"
        );
        if (fileTemplate) fileTemplate.style.display = "none";
      });
    }
    this.hideAllMessages();
  }

  // ===== FILE HANDLING =====

  private handleFileInputChange(
    event: Event,
    sectionFileTemplate: HTMLElement,
    sectionUploadSection: HTMLElement,
    sectionFileTemplateContainer: HTMLElement
  ): void {
    const fileInput = event.target as HTMLInputElement;
    const inputName = fileInput.name;
    const files = fileInput.files;

    if (files && files.length > 0) {
      Array.from(files)
        .slice(0, 3)
        .forEach((file) => {
          this.handleFileUpload(
            fileInput,
            file,
            inputName,
            sectionFileTemplate,
            sectionUploadSection,
            sectionFileTemplateContainer
          );
        });
    }
  }

  private handleFileUpload(
    fileInput: HTMLInputElement,
    file: File,
    inputName: string,
    sectionFileTemplate: HTMLElement,
    sectionUploadSection: HTMLElement,
    sectionFileTemplateContainer: HTMLElement
  ): void {
    const validation = FileValidator.validateFile(file);

    if (!validation.isValid) {
      this.showError(validation.errors.join(". "));
      return;
    }

    if (inputName === "Resume") {
      this.uploadedResumeFile = file;
    } else if (inputName === "cover_letter") {
      this.uploadedCoverLetterFile = file;
    } else {
      if (this.uploadedAdditionalFiles.length < 3) {
        this.uploadedAdditionalFiles.push(file);
        if (this.uploadedAdditionalFiles.length === 3) {
          sectionUploadSection.classList.add("hide");
        }
      } else {
        this.showError("You can only upload up to 3 additional files.");
        return;
      }
    }

    this.displayUploadedFile(
      fileInput,
      file,
      sectionFileTemplate,
      sectionUploadSection,
      sectionFileTemplateContainer
    );
  }

  private displayUploadedFile(
    fileInput: HTMLInputElement,
    file: File,
    sectionFileTemplate: HTMLElement,
    sectionUploadSection: HTMLElement,
    sectionFileTemplateContainer: HTMLElement
  ): void {
    if (
      !sectionFileTemplate ||
      !sectionUploadSection ||
      !sectionFileTemplateContainer
    )
      return;

    const hasMultiple = fileInput.hasAttribute("multiple");
    if (hasMultiple && this.uploadedAdditionalFiles.length < 3) {
      sectionUploadSection.classList.remove("hide");
    } else {
      sectionUploadSection.classList.add("hide");
    }

    const fileItem = sectionFileTemplate.cloneNode(true) as HTMLElement;
    fileItem.style.display = "flex";
    fileItem.classList.add("uploaded-file");

    const fileName = fileItem.querySelector(
      '[dev-target="file-name"]'
    ) as HTMLElement;
    if (fileName) fileName.textContent = file.name;

    const removeButton = fileItem.querySelector(
      '[dev-target="file-remove-button"]'
    ) as HTMLElement;
    if (removeButton) {
      removeButton.addEventListener("click", (e) =>
        this.removeUploadedFile(
          file,
          fileInput,
          e.target as HTMLElement,
          sectionUploadSection
        )
      );
    }

    sectionFileTemplateContainer.appendChild(fileItem);
  }

  private removeUploadedFile(
    userFile: File,
    fileInput: HTMLInputElement,
    element: HTMLElement,
    sectionUploadSection: HTMLElement
  ): void {
    const uploadedFileElement = element.closest(
      ".uploaded-file"
    ) as HTMLElement;
    uploadedFileElement?.remove();

    sectionUploadSection.classList.remove("hide");
    fileInput.value = "";

    if (fileInput.name === "Resume") {
      this.uploadedResumeFile = null;
    } else if (fileInput.name === "cover_letter") {
      this.uploadedCoverLetterFile = null;
    } else {
      this.uploadedAdditionalFiles = this.uploadedAdditionalFiles.filter(
        (file) => file !== userFile
      );
    }
  }

  private removeAllUploadedFiles(): void {
    this.uploadedResumeFile = null;
    this.uploadedCoverLetterFile = null;
    this.uploadedAdditionalFiles = [];

    this.formElements.fileInputSections.forEach((section) => {
      const uploadedFileElements = section.querySelectorAll(".uploaded-file");
      uploadedFileElements.forEach((el) => el.remove());
    });
  }

  // ===== FORM HANDLING =====
  private collectFormData(): ApplicationData {
    return {
      firstName:
        (document.getElementById("First-Name") as HTMLInputElement)?.value ||
        "",
      lastName:
        (document.getElementById("Last-Name") as HTMLInputElement)?.value || "",
      email:
        (document.getElementById("Email") as HTMLInputElement)?.value || "",
      phoneNumber:
        (document.getElementById("Phone-Number") as HTMLInputElement)?.value ||
        "",
      linkedinUrl:
        (document.getElementById("Linkedin-URL") as HTMLInputElement)?.value ||
        "",
      consent:
        (document.querySelector('input[name="consent"]') as HTMLInputElement)
          ?.checked || false,
      resume: this.uploadedResumeFile,
      coverLetter: this.uploadedCoverLetterFile,
      additionalFiles: this.uploadedAdditionalFiles,
      desiredSalary:
        (document.getElementById("Desired-Salary") as HTMLInputElement)
          ?.value || "",
      desiredAdditionalCompensation:
        (
          document.getElementById(
            "Desired-Additional-Compensation"
          ) as HTMLInputElement
        )?.value || "",
    };
  }

  private validateFormData(data: ApplicationData): ValidationResult {
    const errors = JobApplicationValidator.validateForm(data);

    // Additional file validation
    if (!data.resume) {
      errors.push("Please upload your resume");
    }

    // Mark invalid fields
    const requiredFields = this.formElements.form?.querySelectorAll(
      "[required]"
    ) as NodeListOf<HTMLInputElement>;
    requiredFields?.forEach((field) => {
      if (!field.value.trim()) {
        field.classList.add("error");
      } else {
        field.classList.remove("error");
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const formData = this.collectFormData();
    const validation = this.validateFormData(formData);
    if (!validation.isValid) {
      this.showError(validation.errors.join(". "));
      return;
    }
    await this.submitForm(formData);
  }

  private async submitForm(data: ApplicationData): Promise<void> {
    this.setLoadingState(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("First-Name", data.firstName);
      formDataObj.append("Last-Name", data.lastName);
      formDataObj.append("Email", data.email);
      formDataObj.append("Phone-Number", data.phoneNumber);
      formDataObj.append("Linkedin-URL", data.linkedinUrl);
      formDataObj.append("desiredSalary", data.desiredSalary);
      formDataObj.append(
        "desiredAdditionalCompensation",
        data.desiredAdditionalCompensation
      );

      if (data.resume) {
        formDataObj.append("Resume", data.resume);
      }

      if (data.coverLetter) {
        formDataObj.append("cover_letter", data.coverLetter);
      }

      if (data.additionalFiles) {
        data.additionalFiles.forEach((file) => {
          formDataObj.append(`additionalFile`, file);
        });
      }

      const response = await fetch(`http://localhost:3000/api/people`, {
        method: "POST",
        body: formDataObj,
      });

      const result: ApiResponse = await response.json();

      if (response.ok && result.success) {
        this.handleSuccessfulSubmission();
      } else {
        throw new Error(result.error || "Failed to submit application");
      }
    } catch (error) {
      console.error("Submission error:", error);
      this.showError("Failed to submit application. Please try again.");
    } finally {
      this.setLoadingState(false);
    }
  }

  private handleSuccessfulSubmission(): void {
    this.showSuccess();
    this.formElements.form?.reset();

    this.formElements.fileInputSections.forEach((section) => {
      const uploadSection = section.querySelector<HTMLElement>(
        ".roles-application-form_file_contain"
      );
      if (uploadSection) {
        uploadSection.classList.remove("hide");
      }
    });

    this.formElements.form
      .querySelector(".w-checkbox-input.w--redirected-checked")
      ?.classList.remove("w--redirected-checked");

    this.removeAllUploadedFiles();
  }

  private setLoadingState(isLoading: boolean): void {
    if (!this.formElements.submitButton) return;

    if (isLoading) {
      this.formElements.submitButton.value = "Applying...";
      this.formElements.submitButton.disabled = true;
    } else {
      this.formElements.submitButton.value = this.originalButtonText;
      this.formElements.submitButton.disabled = false;
    }
  }

  private handleInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.classList.contains("error")) {
      target.classList.remove("error");
    }
  }

  private clearPhoneError(): void {
    if (this.formElements.phoneInput) {
      this.formElements.phoneInput.classList.remove("error");
      const phoneContainer = this.formElements.phoneInput.closest(
        ".roles-application-form_input_wrap"
      );
      phoneContainer?.classList.remove("error");
    }
  }

  // ===== UI FEEDBACK =====
  private showError(message: string): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error system-message";
    errorDiv.textContent = message;

    const existingErrors = document.querySelectorAll(".error.system-message");
    existingErrors.forEach((error) => error.remove());

    this.formElements.form?.parentElement?.after(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, this.ERROR_MESSAGE_DURATION);
  }

  private showSuccess(): void {
    const successDiv = this.formElements.successMessage.cloneNode(
      true
    ) as HTMLElement;
    successDiv.style.display = "block";

    this.formElements.form.classList.add("hide");
    this.formElements.form?.parentElement?.appendChild(successDiv);

    setTimeout(() => {
      successDiv.remove();
      this.formElements.form.classList.remove("hide");
    }, this.SUCCESS_MESSAGE_DURATION);
  }

  private hideAllMessages(): void {
    if (this.formElements.successMessage) {
      this.formElements.successMessage.style.display = "none";
    }
    if (this.formElements.errorMessage) {
      this.formElements.errorMessage.style.display = "none";
    }
  }

  private injectStyles(): void {
    const styles = `
      .roles-application-form_input.error,
      .roles-application-form_file_input.error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
      }

      .uploaded-file {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        margin-top: 8px;
      }

      .uploaded-file [dev-target="file-name"] {
        flex: 1;
        margin-left: 8px;
        font-size: 14px;
        color: #333;
      }

      .uploaded-file [dev-target="file-remove-button"] {
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .uploaded-file [dev-target="file-remove-button"]:hover {
        opacity: 0.7;
      }

      .system-message {
        margin: 0px;
        padding: 15px;
        border-radius: 4px;
        font-size: 14px;
      }

      .system-message.success {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }

      .system-message.error {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }

      .hide {
        display: none !important;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // ===== PUBLIC API =====
  public reinitialize(): void {
    this.uploadedResumeFile = null;
    this.uploadedCoverLetterFile = null;
    this.uploadedAdditionalFiles = [];
    this.setupInitialState();
  }

  public destroy(): void {
    if (this.phoneInputInstance) {
      try {
        this.phoneInputInstance.destroy();
        this.phoneInputInstance = null;
      } catch (error) {
        console.warn("Error destroying phone input instance:", error);
      }
    }

    const uploadedFileElements = document.querySelectorAll(".uploaded-file");
    uploadedFileElements.forEach((el) => el.remove());

    const systemMessages = document.querySelectorAll(".system-message");
    systemMessages.forEach((message) => message.remove());
  }
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  try {
    window.jobApplicationForm = new JobApplicationForm();
    console.log("Job Application Form initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Job Application Form:", error);
  }
});

// Export for module usage
export {
  JobApplicationForm,
  JobApplicationValidator,
  FileValidator,
  type ApplicationData,
  type FormElements,
  type ValidationResult,
  type ApiResponse,
};
