console.log("hi");
// Job Application Form Handler - TypeScript OOP Version

interface FormElements {
  form: HTMLFormElement;
  fileInput: HTMLInputElement;
  fileTemplate: HTMLElement;
  fileContainer: HTMLElement;
  uploadSection: HTMLElement;
  successMessage: HTMLElement;
  errorMessage: HTMLElement;
  submitButton: HTMLInputElement;
  phoneInput: HTMLInputElement;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  linkedinUrl: string;
  resume: File | null;
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
  }
}

class JobApplicationForm {
  private elements!: FormElements;
  private uploadedFile: File | null = null;
  private jobId: string | null = null;
  private originalButtonText: string = "";
  private phoneInputInstance: any = null;

  private readonly ALLOWED_FILE_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly SUCCESS_MESSAGE_DURATION = 5000;
  private readonly ERROR_MESSAGE_DURATION = 8000;

  constructor() {
    this.initializeElements();
    this.initializeEventListeners();
    this.setupInitialState();
  }

  /**
   * Initialize DOM elements and validate their existence
   */
  private initializeElements(): void {
    const form = document.getElementById("email-form-2") as HTMLFormElement;
    const fileInput = document.querySelector(
      'input[name="Resume"]'
    ) as HTMLInputElement;
    const fileTemplate = document.querySelector(
      '[dev-target="file-item-template"]'
    ) as HTMLElement;
    const uploadSection = document.querySelector(
      ".roles-application-form_file_contain"
    ) as HTMLElement;
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

    // Validate required elements exist
    if (
      !form ||
      !fileInput ||
      !fileTemplate ||
      !uploadSection ||
      !successMessage ||
      !errorMessage ||
      !submitButton ||
      !phoneInput
    ) {
      throw new Error("Required form elements not found");
    }

    this.elements = {
      form,
      fileInput,
      fileTemplate,
      fileContainer: fileTemplate.parentElement as HTMLElement,
      uploadSection,
      successMessage,
      errorMessage,
      submitButton,
      phoneInput,
    };

    this.originalButtonText = submitButton.value;
    this.jobId = this.getJobIdFromURL();

    // Initialize international phone input
    this.initializePhoneInput();
  }

  /**
   * Set up all event listeners
   */
  private initializeEventListeners(): void {
    this.elements.fileInput.addEventListener(
      "change",
      this.handleFileInputChange.bind(this)
    );
    this.elements.form.addEventListener(
      "submit",
      this.handleFormSubmit.bind(this)
    );
    this.elements.form.addEventListener(
      "input",
      this.handleInputChange.bind(this)
    );
  }

  /**
   * Setup initial state of the form
   */
  private setupInitialState(): void {
    this.elements.fileTemplate.style.display = "none";
    this.hideAllMessages();
    this.injectStyles();
  }

  /**
   * Initialize international phone input
   */
  private initializePhoneInput(): void {
    // Check if intlTelInput is available
    if (typeof window.intlTelInput === "undefined") {
      console.warn(
        "intlTelInput library not loaded. Phone validation will be basic."
      );
      return;
    }

    try {
      this.phoneInputInstance = window.intlTelInput(this.elements.phoneInput, {
        initialCountry: "gb", // Default to UK since user is in Hatfield, England
        preferredCountries: ["gb", "us", "ca", "au"],
        separateDialCode: true,
        autoPlaceholder: "aggressive",
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@25.10.12/build/js/utils.js",
        validationNumberType: "MOBILE",
      });

      // Add event listener for country change
      this.elements.phoneInput.addEventListener("countrychange", () => {
        this.clearPhoneError();
      });
    } catch (error) {
      console.error("Failed to initialize intl-tel-input:", error);
    }
  }

  /**
   * Clear phone input error styling
   */
  private clearPhoneError(): void {
    this.elements.phoneInput.classList.remove("error");
    const phoneContainer = this.elements.phoneInput.closest(
      ".roles-application-form_input_wrap"
    );
    phoneContainer?.classList.remove("error");
  }

  /**
   * Extract job ID from URL parameters
   */
  private getJobIdFromURL(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("jobId");
  }

  /**
   * Handle file input change event
   */
  private handleFileInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      this.handleFileUpload(file);
    }
  }

  /**
   * Process file upload with validation
   */
  private handleFileUpload(file: File): void {
    const validation = this.validateFile(file);

    if (!validation.isValid) {
      this.showError(validation.errors.join(". "));
      return;
    }

    this.uploadedFile = file;
    this.displayUploadedFile(file);
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): ValidationResult {
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

  /**
   * Display uploaded file using template
   */
  private displayUploadedFile(file: File): void {
    this.elements.uploadSection.style.display = "none";

    const fileItem = this.elements.fileTemplate.cloneNode(true) as HTMLElement;
    fileItem.style.display = "flex";
    fileItem.classList.add("uploaded-file");

    const fileName = fileItem.querySelector(
      '[dev-target="file-name"]'
    ) as HTMLElement;
    fileName.textContent = file.name;

    const removeButton = fileItem.querySelector(
      '[dev-target="file-remove-button"]'
    ) as HTMLElement;
    removeButton.addEventListener("click", this.removeUploadedFile.bind(this));

    this.elements.fileContainer.appendChild(fileItem);
  }

  /**
   * Remove uploaded file and reset UI
   */
  private removeUploadedFile(): void {
    const uploadedFileElement = document.querySelector(
      ".uploaded-file"
    ) as HTMLElement;
    uploadedFileElement?.remove();

    this.elements.uploadSection.style.display = "flex";
    this.elements.fileInput.value = "";
    this.uploadedFile = null;
  }

  /**
   * Collect form data
   */
  private collectFormData(): FormData {
    return {
      firstName: (document.getElementById("First-Name") as HTMLInputElement)
        .value,
      lastName: (document.getElementById("Last-Name") as HTMLInputElement)
        .value,
      email: (document.getElementById("Email") as HTMLInputElement).value,
      phoneNumber: (document.getElementById("Phone-Number") as HTMLInputElement)
        .value,
      linkedinUrl: (document.getElementById("Linkedin-URL") as HTMLInputElement)
        .value,
      resume: this.uploadedFile,
    };
  }

  /**
   * Validate form data
   */
  private validateFormData(data: FormData): ValidationResult {
    const errors: string[] = [];
    const requiredFields = this.elements.form.querySelectorAll(
      "[required]"
    ) as NodeListOf<HTMLInputElement>;

    // Check required fields
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        field.classList.add("error");
        errors.push(
          `${field.getAttribute("data-name") || field.name} is required`
        );
      } else {
        field.classList.remove("error");
      }
    });

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      const emailField = document.getElementById("Email") as HTMLInputElement;
      emailField.classList.add("error");
      errors.push("Please enter a valid email address");
    }

    // LinkedIn URL validation (optional but if provided, should be valid)
    if (data.linkedinUrl) {
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.+/i;
      if (!linkedinRegex.test(data.linkedinUrl)) {
        const linkedinField = document.getElementById(
          "Linkedin-URL"
        ) as HTMLInputElement;
        linkedinField.classList.add("error");
        errors.push("Please enter a valid LinkedIn URL");
      }
    }

    // File validation
    if (!data.resume) {
      errors.push("Please upload your resume");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const formData = this.collectFormData();
    const validation = this.validateFormData(formData);

    if (!validation.isValid) {
      this.showError(validation.errors.join(". "));
      return;
    }

    if (!this.jobId) {
      this.showError("Job ID not found in URL");
      return;
    }

    await this.submitForm(formData);
  }

  /**
   * Submit form to API
   */
  private async submitForm(data: FormData): Promise<void> {
    this.setLoadingState(true);

    try {
      const formDataObj = new window.FormData();
      formDataObj.append("First-Name", data.firstName);
      formDataObj.append("Last-Name", data.lastName);
      formDataObj.append("Email", data.email);
      formDataObj.append("Phone-Number", data.phoneNumber);
      formDataObj.append("Linkedin-URL", data.linkedinUrl);

      if (data.resume) {
        formDataObj.append("Resume", data.resume);
      }

      const response = await fetch(
        `http://localhost:3000/api/jobs/${this.jobId}/apply`,
        {
          method: "POST",
          body: formDataObj,
        }
      );

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

  /**
   * Handle successful form submission
   */
  private handleSuccessfulSubmission(): void {
    this.showSuccess();
    this.elements.form.reset();
    this.removeUploadedFile();
  }

  /**
   * Set loading state for submit button
   */
  private setLoadingState(isLoading: boolean): void {
    if (isLoading) {
      this.elements.submitButton.value = "Applying...";
      this.elements.submitButton.disabled = true;
    } else {
      this.elements.submitButton.value = this.originalButtonText;
      this.elements.submitButton.disabled = false;
    }
  }

  /**
   * Handle input change events for real-time validation
   */
  private handleInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.classList.contains("error")) {
      target.classList.remove("error");
    }
  }

  /**
   * Show success message
   */
  private showSuccess(): void {
    this.hideAllMessages();
    this.elements.successMessage.style.display = "block";
    this.elements.successMessage.scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      this.elements.successMessage.style.display = "none";
    }, this.SUCCESS_MESSAGE_DURATION);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.hideAllMessages();
    const errorDiv = this.elements.errorMessage.querySelector(
      "div"
    ) as HTMLElement;
    errorDiv.textContent = message;
    this.elements.errorMessage.style.display = "block";
    this.elements.errorMessage.scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      this.elements.errorMessage.style.display = "none";
    }, this.ERROR_MESSAGE_DURATION);
  }

  /**
   * Hide all messages
   */
  private hideAllMessages(): void {
    this.elements.successMessage.style.display = "none";
    this.elements.errorMessage.style.display = "none";
  }

  /**
   * Inject CSS styles
   */
  private injectStyles(): void {
    const errorStyles = `
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

      .w-form-done,
      .w-form-fail {
        display: none;
        margin-top: 20px;
        padding: 15px;
        border-radius: 4px;
      }

      .w-form-done {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }

      .w-form-fail {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = errorStyles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Public method to reinitialize the form (useful for SPA)
   */
  public reinitialize(): void {
    this.uploadedFile = null;
    this.jobId = this.getJobIdFromURL();
    this.setupInitialState();
  }

  /**
   * Public method to destroy the form instance
   */
  public destroy(): void {
    this.elements.fileInput.removeEventListener(
      "change",
      this.handleFileInputChange.bind(this)
    );
    this.elements.form.removeEventListener(
      "submit",
      this.handleFormSubmit.bind(this)
    );
    this.elements.form.removeEventListener(
      "input",
      this.handleInputChange.bind(this)
    );

    if (this.phoneInputInstance) {
      try {
        this.phoneInputInstance.destroy();
        this.phoneInputInstance = null;
      } catch (error) {
        console.warn("Error destroying phone input instance:", error);
      }
    }

    // Clean up uploaded file display
    const uploadedFileElement = document.querySelector(".uploaded-file");
    uploadedFileElement?.remove();
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    new JobApplicationForm();
  } catch (error) {
    console.error("Failed to initialize JobApplicationForm:", error);
  }
});

// Export for module usage
export { JobApplicationForm };
