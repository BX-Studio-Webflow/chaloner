// TypeScript interfaces and types
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
  linkedinUrl: string;
  consent: boolean;
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
  applicationSection: HTMLElement | null;
  toApplicationSection: HTMLAnchorElement | null;
  resumeHref: string | null;
  descTitle: HTMLElement | null;
  descCompany: HTMLElement | null;
  descLocation: HTMLElement | null;
  descContent: HTMLElement | null;
  applicationForm: HTMLFormElement | null;
  fileUpload: HTMLInputElement | null;
  fileWrap: HTMLElement | null;
  checkbox: HTMLElement | null;
  checkboxInput: HTMLInputElement | null;
}

type SortOrder = "asc" | "desc";
type SortBy = "title" | "location" | "company";

class JobListingManager {
  protected jobs: Job[] = [];
  protected currentJob: JobDetails | null = null;
  protected filteredJobs: Job[] = [];
  protected sortBy: SortBy = "title";
  protected sortOrder: SortOrder = "asc";
  protected elements: JobElements = {} as JobElements;

  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.loadJobs();
  }

  private initializeElements(): void {
    // Get all dev-target elements
    this.elements = {
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

      // Description elements
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

      // Form elements
      applicationForm: document.querySelector<HTMLFormElement>(
        ".roles-application-form_wrap"
      ),
      fileUpload: document.querySelector<HTMLInputElement>(
        ".roles-application-form_file_input"
      ),
      fileWrap: document.querySelector<HTMLElement>(
        ".roles-application-form_file_wrap"
      ),
      checkbox: document.querySelector<HTMLElement>(
        ".roles-application-form_checkbox"
      ),
      checkboxInput:
        document.querySelector<HTMLInputElement>('[name="consent"]'),
    };
  }

  private bindEvents(): void {
    // Search functionality
    if (this.elements.roleSearch) {
      this.elements.roleSearch.addEventListener("input", (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.filterJobs(target.value);
      });
    }

    // Location sort functionality
    if (this.elements.locationSort) {
      this.elements.locationSort.addEventListener("click", () => {
        this.toggleSort();
      });
    }

    // Navigate to application section
    if (this.elements.toApplicationSection) {
      this.elements.toApplicationSection.addEventListener("click", () => {
        // this.showApplicationSection();
      });
    }
    // Back to roles button
    if (this.elements.backToRolesButton) {
      this.elements.backToRolesButton.addEventListener("click", () => {
        this.showRolesSection();
      });
    }

    // Form submission
    if (this.elements.applicationForm) {
      this.elements.applicationForm.addEventListener("submit", (e: Event) => {
        this.handleFormSubmission(e);
      });
    }

    // File upload styling
    if (this.elements.fileWrap && this.elements.fileUpload) {
      this.elements.fileWrap.addEventListener("click", () => {
        this.elements.fileUpload?.click();
      });

      this.elements.fileUpload.addEventListener("change", (e: Event) => {
        this.handleFileUpload(e);
      });
    }

    // Custom checkbox
    if (this.elements.checkbox && this.elements.checkboxInput) {
      this.elements.checkbox.addEventListener("click", () => {
        this.toggleCheckbox();
      });
    }
  }

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
      if (this.elements.rolesLoader) {
        this.elements.rolesLoader.classList.add("hide");
      }
    }
  }

  private async loadJobDetails(
    jobId: number,
    button: HTMLElement
  ): Promise<void> {
    try {
      // this.showLoading("Loading job details...");
      button.classList.add("loading");
      const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.currentJob = (await response.json()) as JobDetails;
      this.showJobDescription();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.showError("Failed to load job details: " + errorMessage);
    } finally {
      button.classList.remove("loading");
    }
  }

  filterJobs(searchTerm: string): void {
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
    if (!this.elements.roleListWrap) return;

    if (this.filteredJobs.length === 0) {
      this.elements.roleListWrap.innerHTML =
        '<div class="loading">No jobs found matching your criteria.</div>';
      return;
    }

    // Clear existing jobs
    this.elements.roleListWrap.innerHTML = "";

    // Clone template and populate for each job
    this.filteredJobs.forEach((job) => {
      if (!this.elements.roleTemplate) return;

      // Clone the template
      const jobElement = this.elements.roleTemplate.cloneNode(
        true
      ) as HTMLElement;

      // Remove template-specific attributes and classes
      jobElement.removeAttribute("dev-target");
      jobElement.classList.remove("hidden");
      jobElement.style.display = "";

      // Add job-specific data attribute
      jobElement.setAttribute("data-job-id", job.id.toString());

      // Update content using dev-target selectors
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

      // Add click event listener to the "to-description-section" button
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

      // Append to the job list
      this.elements.roleListWrap?.appendChild(jobElement);
    });
  }

  private showRolesSection(): void {
    if (this.elements.rolesSection) {
      this.elements.rolesSection.classList.remove("hide");
    }
    if (this.elements.descriptionSection)
      this.elements.descriptionSection.classList.add("hide");
    if (this.elements.applicationSection)
      this.elements.applicationSection.classList.add("hide");
  }

  private showJobDescription(): void {
    if (!this.currentJob || !this.elements.descriptionSection) return;

    // Populate job details
    if (this.elements.descTitle)
      this.elements.descTitle.textContent = this.currentJob.title;
    if (this.elements.descCompany)
      this.elements.descCompany.textContent = this.currentJob.company;
    if (this.elements.descLocation)
      this.elements.descLocation.textContent = this.currentJob.location;
    if (this.elements.descContent)
      this.elements.descContent.innerHTML = this.currentJob.description;
    if (this.elements.toApplicationSection)
      this.elements.toApplicationSection.href = `${this.elements.resumeHref}?jobId=${this.currentJob.id}`;

    // Show description section
    this.elements.descriptionSection.classList.remove("hide");
    this.elements.rolesSection?.classList.add("hide");
    // this.elements.descriptionSection.style.display = "block";
    // this.elements.descriptionSection.scrollIntoView({ behavior: "smooth" });
  }

  private showApplicationSection(): void {
    if (this.elements.applicationSection) {
      this.elements.descriptionSection?.classList.add("hide");
      this.elements.applicationSection.classList.remove("hide");
      // this.elements.applicationSection.style.display = "block";
      // this.elements.applicationSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  protected async handleFormSubmission(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.currentJob) {
      this.showError("No job selected for application.");
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const applicationData: ApplicationData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      linkedinUrl: formData.get("linkedinUrl") as string,
      consent: formData.get("consent") === "on",
    };

    // Validate required fields
    if (
      !applicationData.firstName ||
      !applicationData.lastName ||
      !applicationData.email
    ) {
      this.showError("Please fill in all required fields.");
      return;
    }

    if (!applicationData.consent) {
      this.showError("Please consent to be contacted about job opportunities.");
      return;
    }

    try {
      this.showLoading("Submitting application...");

      const response = await fetch(
        `http://localhost:3000/api/jobs/${this.currentJob.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(applicationData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log({ result });
      this.showSuccess("Application submitted successfully!");
      form.reset();
      this.resetCheckbox();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.showError("Failed to submit application: " + errorMessage);
    }
  }

  private handleFileUpload(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.elements.fileWrap) {
      const fileWrapText =
        this.elements.fileWrap.querySelector<HTMLElement>("div:last-child");
      if (fileWrapText) {
        fileWrapText.textContent = `Selected: ${file.name}`;
      }
    }
  }

  private toggleCheckbox(): void {
    if (!this.elements.checkboxInput || !this.elements.checkbox) return;

    const isChecked = this.elements.checkboxInput.checked;
    this.elements.checkboxInput.checked = !isChecked;

    if (!isChecked) {
      this.elements.checkbox.classList.add("checked");
    } else {
      this.elements.checkbox.classList.remove("checked");
    }
  }

  resetCheckbox(): void {
    if (this.elements.checkboxInput) {
      this.elements.checkboxInput.checked = false;
    }
    if (this.elements.checkbox) {
      this.elements.checkbox.classList.remove("checked");
    }
  }

  protected showLoading(message: string = "Loading..."): void {
    if (this.elements.roleListWrap) {
      this.elements.rolesLoader?.classList.remove("hide");
      this.elements.roleListWrap.innerHTML = `<div class="loading">${message}</div>`;
    }
  }

  protected showError(message: string): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.textContent = message;

    // Remove existing error messages
    const existingErrors = document.querySelectorAll(".error");
    existingErrors.forEach((error) => error.remove());

    // Insert error message at the top of the roles section
    const rolesSection = document.querySelector(".roles_section");
    if (rolesSection) {
      rolesSection.insertBefore(errorDiv, rolesSection.firstChild);
    }

    // Auto-remove error after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  protected showSuccess(message: string): void {
    const successDiv = document.createElement("div");
    successDiv.className = "success";
    successDiv.textContent = message;

    // Remove existing success messages
    const existingSuccess = document.querySelectorAll(".success");
    existingSuccess.forEach((success) => success.remove());

    // Insert success message in application section
    const applicationSection = this.elements.applicationSection;
    if (applicationSection) {
      applicationSection.insertBefore(
        successDiv,
        applicationSection.firstChild
      );
    }

    // Auto-remove success after 5 seconds
    setTimeout(() => {
      successDiv.remove();
    }, 5000);
  }
}

// Additional utility classes for enhanced functionality
class JobSearchFilter {
  private jobManager: JobListingManager;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(jobManager: JobListingManager) {
    this.jobManager = jobManager;
  }

  debounceSearch(callback: () => void, delay: number = 300): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(callback, delay);
  }
}

class JobApplicationValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateLinkedInUrl(url: string): boolean {
    if (!url) return true; // Optional field
    const linkedinRegex =
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
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

// Enhanced JobListingManager with additional features
class EnhancedJobListingManager extends JobListingManager {
  private searchFilter: JobSearchFilter;

  constructor() {
    super();
    this.searchFilter = new JobSearchFilter(this);
    this.initializeEnhancements();
  }

  private initializeEnhancements(): void {
    // Override search with debouncing
    if (this.elements.roleSearch) {
      // Remove existing event listener (we need to store reference for proper removal)
      this.elements.roleSearch.addEventListener("input", (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.searchFilter.debounceSearch(() => {
          this.filterJobs(target.value);
        });
      });
    }

    // Add keyboard navigation
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.hideAllSections();
      }
    });
  }

  protected async handleFormSubmission(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.currentJob) {
      this.showError("No job selected for application.");
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const applicationData: ApplicationData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      linkedinUrl: formData.get("linkedinUrl") as string,
      consent: formData.get("consent") === "on",
    };

    // Enhanced validation
    const validationErrors =
      JobApplicationValidator.validateForm(applicationData);
    if (validationErrors.length > 0) {
      this.showError(validationErrors.join(", "));
      return;
    }

    try {
      this.showLoading("Submitting application...");

      const response = await fetch(
        `http://localhost:3000/api/jobs/${this.currentJob.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(applicationData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log({ result });
      this.showSuccess("Application submitted successfully!");
      form.reset();
      this.resetCheckbox();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.showError("Failed to submit application: " + errorMessage);
    }
  }

  private hideAllSections(): void {
    if (this.elements.descriptionSection) {
      this.elements.descriptionSection.style.display = "none";
    }
    if (this.elements.applicationSection) {
      this.elements.applicationSection.style.display = "none";
    }
  }
}

// Declare global variable for TypeScript
declare global {
  interface Window {
    jobManager: EnhancedJobListingManager;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.jobManager = new EnhancedJobListingManager();
});

// Export for potential external use
export {
  JobListingManager,
  EnhancedJobListingManager,
  JobApplicationValidator,
  type Job,
  type JobDetails,
  type ApplicationData,
  type JobElements,
  type SortOrder,
  type SortBy,
};
