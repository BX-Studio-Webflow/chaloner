// Unified Job Application System - TypeScript OOP Version
// Combines job listing management with application form handling

// ===== INTERFACES AND TYPES =====
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
}

interface JobDetails extends Job {
  description: string;
}

interface ApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  linkedinUrl: string;
  consent: boolean;
  resume?: File | null;
}

interface JobElements {
  roleSearch: HTMLInputElement | null;
  locationSort: HTMLElement | null;
  roleListWrap: HTMLElement | null;
  roleTemplate: HTMLElement | null;
  rolesSection: HTMLElement | null;
  descriptionSection: HTMLElement | null;
  rolesLoader: HTMLElement | null;
  backToRolesButton: HTMLElement | null;
  backToDescriptionButton: HTMLElement | null;
  applicationSection: HTMLElement | null;
  toApplicationSection: HTMLAnchorElement | null;
  resumeHref: string | null;
  descTitle: HTMLElement | null;
  descCompany: HTMLElement | null;
  descLocation: HTMLElement | null;
  descContent: HTMLElement | null;
}

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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

type SortOrder = "asc" | "desc";
type SortBy = "title" | "location" | "company";

// TypeScript declarations for intl-tel-input
declare global {
  interface Window {
    intlTelInput: any;
    jobApplicationSystem: UnifiedJobApplicationSystem;
  }
}

// ===== UTILITY CLASSES =====
class JobSearchFilter {
  private debounceTimer: NodeJS.Timeout | null = null;

  debounceSearch(callback: () => void, delay: number = 300): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(callback, delay);
  }
}

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

    if (!formData.consent) {
      errors.push("You must consent to be contacted about job opportunities");
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

// ===== MAIN SYSTEM CLASS =====
class UnifiedJobApplicationSystem {
  // Job listing properties
  protected jobs: Job[] = [];
  protected currentJob: JobDetails | null = null;
  protected filteredJobs: Job[] = [];
  protected sortBy: SortBy = "title";
  protected sortOrder: SortOrder = "asc";
  protected jobElements: JobElements = {} as JobElements;

  // Application form properties
  private formElements!: FormElements;
  private uploadedFile: File | null = null;
  private jobId: string | null = null;
  private originalButtonText: string = "";
  private phoneInputInstance: any = null;

  // Utility instances
  private searchFilter: JobSearchFilter;

  // Constants
  private readonly SUCCESS_MESSAGE_DURATION = 5000;
  private readonly ERROR_MESSAGE_DURATION = 8000;

  constructor() {
    this.searchFilter = new JobSearchFilter();
    this.initializeSystem();
  }

  // ===== INITIALIZATION =====
  private async initializeSystem(): Promise<void> {
    try {
      this.initializeJobElements();
      this.initializeFormElements();
      this.bindJobEvents();
      this.bindFormEvents();
      this.setupInitialState();
      this.injectStyles();
      await this.loadJobs();

      // Check for jobId in URL and load specific job if present
      await this.handleInitialJobLoad();
    } catch (error) {
      console.error("Failed to initialize job application system:", error);
      this.showError("System initialization failed. Please refresh the page.");
    }
  }

  private async handleInitialJobLoad(): Promise<void> {
    const urlJobId = this.getJobIdFromURL();

    if (urlJobId) {
      const jobIdNumber = parseInt(urlJobId, 10);

      if (!isNaN(jobIdNumber)) {
        try {
          // Load the specific job details
          await this.loadSpecificJobDetails(jobIdNumber);
        } catch (error) {
          console.error("Failed to load initial job from URL:", error);
          this.showError(
            `Failed to load job ${urlJobId}. Showing all jobs instead.`
          );
          this.showRolesSection();
        }
      } else {
        console.warn("Invalid jobId in URL:", urlJobId);
        this.showRolesSection();
      }
    }
  }

  private initializeJobElements(): void {
    this.jobElements = {
      roleSearch: document.querySelector<HTMLInputElement>(
        '[dev-target="role-search"]'
      ),
      locationSort: document.querySelector<HTMLElement>(
        '[dev-target="location-sort"]'
      ),
      roleListWrap: document.querySelector<HTMLElement>(
        '[dev-target="role-list-wrap"]'
      ),
      roleTemplate: document.querySelector<HTMLElement>(
        '[dev-target="role-template"]'
      ),
      rolesSection: document.querySelector<HTMLElement>(
        '[dev-target="roles-section"]'
      ),
      descriptionSection: document.querySelector<HTMLElement>(
        '[dev-target="description-section"]'
      ),
      backToRolesButton: document.querySelector<HTMLElement>(
        '[dev-target="back-to-roles"]'
      ),
      backToDescriptionButton: document.querySelector<HTMLElement>(
        '[dev-target="back-to-description"]'
      ),
      rolesLoader: document.querySelector<HTMLElement>(
        '[dev-target="roles-loader"]'
      ),
      applicationSection: document.querySelector<HTMLElement>(
        '[dev-target="application-section"]'
      ),
      toApplicationSection: document.querySelector<HTMLAnchorElement>(
        '[dev-target="to-application-section"]'
      ),
      resumeHref:
        document.querySelector<HTMLAnchorElement>(
          '[dev-target="to-application-section"]'
        )?.href || null,
      descTitle: document.querySelector<HTMLElement>(
        '[dev-target="description-section"] [dev-target="title"]'
      ),
      descCompany: document.querySelector<HTMLElement>(
        '[dev-target="description-section"] [dev-target="company"]'
      ),
      descLocation: document.querySelector<HTMLElement>(
        '[dev-target="description-section"] [dev-target="location"]'
      ),
      descContent: document.querySelector<HTMLElement>(
        '[dev-target="description"]'
      ),
    };
  }

  private initializeFormElements(): void {
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

    if (!form || !fileInput || !submitButton) {
      console.warn(
        "Form elements not found. Application form features will be limited."
      );
      return;
    }

    this.formElements = {
      form,
      fileInput,
      fileTemplate: fileTemplate || document.createElement("div"),
      fileContainer:
        (fileTemplate?.parentElement as HTMLElement) ||
        document.createElement("div"),
      uploadSection: uploadSection || document.createElement("div"),
      successMessage: successMessage || document.createElement("div"),
      errorMessage: errorMessage || document.createElement("div"),
      submitButton,
      phoneInput: phoneInput || document.createElement("input"),
    };

    this.originalButtonText = submitButton.value;
    this.jobId = this.getJobIdFromURL();
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
  private bindJobEvents(): void {
    // Search functionality with debouncing
    if (this.jobElements.roleSearch) {
      this.jobElements.roleSearch.addEventListener("input", (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.searchFilter.debounceSearch(() => {
          this.filterJobs(target.value);
        });
      });
    }

    // Location sort functionality
    if (this.jobElements.locationSort) {
      this.jobElements.locationSort.addEventListener("click", () => {
        this.toggleSort();
      });
    }

    // Navigation buttons
    if (this.jobElements.toApplicationSection) {
      this.jobElements.toApplicationSection.addEventListener("click", () => {
        this.showApplicationSection();
      });
    }

    if (this.jobElements.backToRolesButton) {
      this.jobElements.backToRolesButton.addEventListener("click", () => {
        this.showRolesSection();
      });
    }

    if (this.jobElements.backToDescriptionButton) {
      this.jobElements.backToDescriptionButton.addEventListener("click", () => {
        this.showJobDescription();
      });
    }

    // Keyboard navigation
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.showRolesSection();
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener("popstate", (event) => {
      this.handleBrowserNavigation(event);
    });
  }

  private async handleBrowserNavigation(event: PopStateEvent): Promise<void> {
    const jobId = this.getJobIdFromURL();

    if (jobId && event.state?.jobId) {
      // User navigated back to a job description
      const jobIdNumber = parseInt(jobId, 10);
      if (!isNaN(jobIdNumber)) {
        try {
          await this.loadSpecificJobDetails(jobIdNumber);
        } catch (error) {
          console.error("Failed to load job from browser navigation:", error);
          this.showRolesSection();
        }
      }
    } else {
      // User navigated back to job listings
      this.showRolesSection();
    }
  }

  private bindFormEvents(): void {
    if (!this.formElements.form) return;

    // File input change
    if (this.formElements.fileInput) {
      this.formElements.fileInput.addEventListener(
        "change",
        this.handleFileInputChange.bind(this)
      );
    }

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
    if (this.formElements.fileTemplate) {
      this.formElements.fileTemplate.style.display = "none";
    }
    this.hideAllMessages();
  }

  // ===== JOB LISTING FUNCTIONALITY =====
  private async loadJobs(): Promise<void> {
    try {
      this.showLoading();
      const response = await fetch("http://localhost:3000/api/jobs");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.jobs = (await response.json()) as Job[];
      this.filteredJobs = [...this.jobs];
      this.renderJobList();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.showError("Failed to load jobs: " + errorMessage);
    } finally {
      if (this.jobElements.rolesLoader) {
        this.jobElements.rolesLoader.classList.add("hide");
      }
    }
  }

  private async loadJobDetails(
    jobId: number,
    button: HTMLElement
  ): Promise<void> {
    try {
      button.classList.add("loading");
      await this.loadSpecificJobDetails(jobId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.showError("Failed to load job details: " + errorMessage);
    } finally {
      button.classList.remove("loading");
    }
  }

  private async loadSpecificJobDetails(jobId: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Job with ID ${jobId} not found`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    this.currentJob = (await response.json()) as JobDetails;
    this.jobId = jobId.toString();
    this.showJobDescription();
  }

  private filterJobs(searchTerm: string): void {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredJobs = [...this.jobs];
    } else {
      this.filteredJobs = this.jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term) ||
          job.location.toLowerCase().includes(term)
      );
    }

    this.renderJobList();
  }

  private toggleSort(): void {
    if (this.sortBy === "location") {
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
    } else {
      this.sortBy = "location";
      this.sortOrder = "asc";
    }

    this.sortJobs();
    this.renderJobList();
  }

  private sortJobs(): void {
    this.filteredJobs.sort((a, b) => {
      const aValue = a[this.sortBy].toLowerCase();
      const bValue = b[this.sortBy].toLowerCase();

      if (this.sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }

  private renderJobList(): void {
    if (!this.jobElements.roleListWrap) return;

    if (this.filteredJobs.length === 0) {
      this.jobElements.roleListWrap.innerHTML =
        '<div class="loading">No jobs found matching your criteria.</div>';
      return;
    }

    this.jobElements.roleListWrap.innerHTML = "";

    this.filteredJobs.forEach((job) => {
      if (!this.jobElements.roleTemplate) return;

      const jobElement = this.jobElements.roleTemplate.cloneNode(
        true
      ) as HTMLElement;
      jobElement.removeAttribute("dev-target");
      jobElement.classList.remove("hidden");
      jobElement.style.display = "";
      jobElement.setAttribute("data-job-id", job.id.toString());

      // Update content
      const companyElement = jobElement.querySelector<HTMLElement>(
        '[dev-target="company"]'
      );
      const titleElement = jobElement.querySelector<HTMLElement>(
        '[dev-target="title"]'
      );
      const locationElement = jobElement.querySelector<HTMLElement>(
        '[dev-target="location"]'
      );

      if (companyElement) companyElement.textContent = job.company;
      if (titleElement) titleElement.textContent = job.title;
      if (locationElement) locationElement.textContent = job.location;

      // Add click event listener
      const toDescriptionBtn = jobElement.querySelector<HTMLElement>(
        '[dev-target="to-description-section"]'
      );
      if (toDescriptionBtn) {
        toDescriptionBtn.addEventListener("click", (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          this.loadJobDetails(job.id, toDescriptionBtn);
        });
      }

      this.jobElements.roleListWrap?.appendChild(jobElement);
    });
  }

  // ===== NAVIGATION =====
  private showRolesSection(): void {
    if (this.jobElements.rolesSection) {
      this.jobElements.rolesSection.classList.remove("hide");
    }
    if (this.jobElements.descriptionSection) {
      this.jobElements.descriptionSection.classList.add("hide");
    }
    if (this.jobElements.applicationSection) {
      this.jobElements.applicationSection.classList.add("hide");
    }

    // Remove jobId from URL when going back to roles list
    this.removeJobIdFromUrl();
  }

  private showJobDescription(): void {
    if (!this.currentJob || !this.jobElements.descriptionSection) return;

    // Populate job details
    if (this.jobElements.descTitle)
      this.jobElements.descTitle.textContent = this.currentJob.title;
    if (this.jobElements.descCompany)
      this.jobElements.descCompany.textContent = this.currentJob.company;
    if (this.jobElements.descLocation)
      this.jobElements.descLocation.textContent = this.currentJob.location;
    if (this.jobElements.descContent)
      this.jobElements.descContent.innerHTML = this.currentJob.description;
    if (this.jobElements.toApplicationSection) {
      this.jobElements.toApplicationSection.href = `${this.jobElements.resumeHref}?jobId=${this.currentJob.id}`;
    }

    // Update URL with jobId parameter
    this.updateUrlWithJobId(this.currentJob.id);

    // Show description section
    this.jobElements.descriptionSection.classList.remove("hide");
    this.jobElements.rolesSection?.classList.add("hide");
    this.jobElements.applicationSection?.classList.add("hide");
  }

  private showApplicationSection(): void {
    if (this.jobElements.applicationSection) {
      this.jobElements.descriptionSection?.classList.add("hide");
      this.jobElements.applicationSection.classList.remove("hide");
      this.jobElements.rolesSection?.classList.add("hide");
    }

    // Keep jobId in URL when navigating to application section
    if (this.currentJob) {
      this.updateUrlWithJobId(this.currentJob.id);
    }
  }

  // ===== URL MANAGEMENT =====
  private updateUrlWithJobId(jobId: number): void {
    const url = new URL(window.location.href);
    url.searchParams.set("jobId", jobId.toString());

    // Use pushState to update URL without page reload
    window.history.pushState({ jobId }, "", url.toString());
  }

  private removeJobIdFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete("jobId");

    // Use pushState to update URL without page reload
    window.history.pushState({}, "", url.toString());
  }

  // ===== FILE HANDLING =====
  private getJobIdFromURL(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("jobId");
  }

  private handleFileInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      this.handleFileUpload(file);
    }
  }

  private handleFileUpload(file: File): void {
    const validation = FileValidator.validateFile(file);

    if (!validation.isValid) {
      this.showError(validation.errors.join(". "));
      return;
    }

    this.uploadedFile = file;
    this.displayUploadedFile(file);
  }

  private displayUploadedFile(file: File): void {
    if (!this.formElements.fileTemplate || !this.formElements.uploadSection)
      return;

    this.formElements.uploadSection.style.display = "none";

    const fileItem = this.formElements.fileTemplate.cloneNode(
      true
    ) as HTMLElement;
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
      removeButton.addEventListener(
        "click",
        this.removeUploadedFile.bind(this)
      );
    }

    this.formElements.fileContainer.appendChild(fileItem);
  }

  private removeUploadedFile(): void {
    const uploadedFileElement = document.querySelector(
      ".uploaded-file"
    ) as HTMLElement;
    uploadedFileElement?.remove();

    if (this.formElements.uploadSection) {
      this.formElements.uploadSection.style.display = "flex";
    }
    if (this.formElements.fileInput) {
      this.formElements.fileInput.value = "";
    }
    this.uploadedFile = null;
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
      resume: this.uploadedFile,
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

    if (!this.jobId) {
      this.showError("Job ID not found");
      return;
    }

    await this.submitForm(formData);
  }

  private async submitForm(data: ApplicationData): Promise<void> {
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

  private handleSuccessfulSubmission(): void {
    this.showSuccess("Application submitted successfully!");
    this.formElements.form?.reset();
    this.removeUploadedFile();
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
  protected showLoading(message: string = "Loading..."): void {
    if (this.jobElements.roleListWrap) {
      this.jobElements.rolesLoader?.classList.remove("hide");
      this.jobElements.roleListWrap.innerHTML = `<div class="loading">${message}</div>`;
    }
  }

  protected showError(message: string): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error system-message";
    errorDiv.textContent = message;

    // Remove existing error messages
    const existingErrors = document.querySelectorAll(".error.system-message");
    existingErrors.forEach((error) => error.remove());

    // Insert error message at the top of the current visible section
    const visibleSection = this.getCurrentVisibleSection();
    if (visibleSection) {
      visibleSection.insertBefore(errorDiv, visibleSection.firstChild);
    }

    // Auto-remove error after duration
    setTimeout(() => {
      errorDiv.remove();
    }, this.ERROR_MESSAGE_DURATION);
  }

  private showSuccess(message: string): void {
    const successDiv = document.createElement("div");
    successDiv.className = "success system-message";
    successDiv.textContent = message;

    // Remove existing success messages
    const existingSuccess = document.querySelectorAll(
      ".success.system-message"
    );
    existingSuccess.forEach((success) => success.remove());

    // Insert success message in current visible section
    const visibleSection = this.getCurrentVisibleSection();
    if (visibleSection) {
      visibleSection.insertBefore(successDiv, visibleSection.firstChild);
    }

    // Auto-remove success after duration
    setTimeout(() => {
      successDiv.remove();
    }, this.SUCCESS_MESSAGE_DURATION);
  }

  private getCurrentVisibleSection(): HTMLElement | null {
    if (
      this.jobElements.applicationSection &&
      !this.jobElements.applicationSection.classList.contains("hide")
    ) {
      return this.jobElements.applicationSection;
    }
    if (
      this.jobElements.descriptionSection &&
      !this.jobElements.descriptionSection.classList.contains("hide")
    ) {
      return this.jobElements.descriptionSection;
    }
    if (
      this.jobElements.rolesSection &&
      !this.jobElements.rolesSection.classList.contains("hide")
    ) {
      return this.jobElements.rolesSection;
    }
    return null;
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
        margin: 15px 0;
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

      .loading {
        text-align: center;
        padding: 20px;
        color: #6c757d;
      }

      .hide {
        display: none !important;
      }

      button.loading {
        opacity: 0.6;
        pointer-events: none;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // ===== PUBLIC API =====
  public getCurrentJob(): JobDetails | null {
    return this.currentJob;
  }

  public refreshJobs(): Promise<void> {
    return this.loadJobs();
  }

  public clearSearch(): void {
    if (this.jobElements.roleSearch) {
      this.jobElements.roleSearch.value = "";
      this.filterJobs("");
    }
  }

  public async loadJobFromUrl(jobId: string | number): Promise<void> {
    const jobIdNumber = typeof jobId === "string" ? parseInt(jobId, 10) : jobId;

    if (isNaN(jobIdNumber)) {
      throw new Error("Invalid job ID");
    }

    await this.loadSpecificJobDetails(jobIdNumber);
  }

  public reinitialize(): void {
    this.uploadedFile = null;
    this.jobId = this.getJobIdFromURL();
    this.setupInitialState();
  }

  public destroy(): void {
    // Clean up event listeners and instances
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

    // Remove system messages
    const systemMessages = document.querySelectorAll(".system-message");
    systemMessages.forEach((message) => message.remove());
  }
}

// ===== INITIALIZATION AND EXPORT =====

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    window.jobApplicationSystem = new UnifiedJobApplicationSystem();
    console.log("Unified Job Application System initialized successfully");
  } catch (error) {
    console.error(
      "Failed to initialize Unified Job Application System:",
      error
    );
  }
});

// Export for module usage
export {
  UnifiedJobApplicationSystem,
  JobApplicationValidator,
  FileValidator,
  JobSearchFilter,
  type Job,
  type JobDetails,
  type ApplicationData,
  type JobElements,
  type FormElements,
  type ValidationResult,
  type ApiResponse,
  type SortOrder,
  type SortBy,
};
