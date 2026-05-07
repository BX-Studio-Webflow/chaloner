class m{static EMAIL_REGEX=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;static LINKEDIN_REGEX=/^(https?:\/\/)?(www\.)?linkedin\.com\/.+/i;static validateEmail(t){return this.EMAIL_REGEX.test(t)}static validateLinkedInUrl(t){if(!t)return!1;const e=t.trim().replace(/^['"]|['"]$/g,"");return/^n\/a$/i.test(e)?!0:this.LINKEDIN_REGEX.test(t)}static validateForm(t){const e=[];return t.firstName?.trim()||e.push("First name is required"),t.lastName?.trim()||e.push("Last name is required"),t.email?.trim()?this.validateEmail(t.email)||e.push("Please enter a valid email address"):e.push("Email is required"),this.validateLinkedInUrl(t.linkedinUrl)||e.push("Please enter a valid LinkedIn URL or type 'N/A' if not applicable"),e}}class c{static ALLOWED_FILE_TYPES=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain"];static MAX_FILE_SIZE=5*1024*1024;static validateFile(t){const e=[];return this.ALLOWED_FILE_TYPES.includes(t.type)||e.push("Please upload a PDF, DOC, DOCX, or TXT file"),t.size>this.MAX_FILE_SIZE&&e.push("File size must be less than 5MB"),{isValid:e.length===0,errors:e}}}class p{formElements;uploadedResumeFile=null;uploadedCoverLetterFile=null;uploadedAdditionalFiles=[];originalButtonText="";phoneInputInstance=null;apiUrl="http://localhost:3000/api/people";ERROR_MESSAGE_DURATION=8e3;constructor(){this.initializeForm()}async initializeForm(){try{this.initializeFormElements(),this.bindFormEvents(),this.setupInitialState(),this.injectStyles()}catch(t){console.error("Failed to initialize job application form:",t),this.showError("Form initialization failed. Please refresh the page.")}}initializeFormElements(){const t=document.querySelector("[dev-target=submit-resume-form]"),e=document.querySelector('[dev-target="form-success"]'),i=document.querySelector(".w-form-fail"),s=t?.querySelector('input[type="submit"]'),o=document.getElementById("Phone-Number");if(!t||!s)throw new Error("Required form elements not found");this.formElements={form:t,fileInputSections:document.querySelectorAll('[dev-target="files-section"]'),successMessage:e||document.createElement("div"),errorMessage:i||document.createElement("div"),submitButton:s,phoneInput:o||document.createElement("input")},this.originalButtonText=s.value,this.initializePhoneInput()}initializePhoneInput(){if(!this.formElements.phoneInput||typeof window.intlTelInput>"u"){console.warn("Phone input or intlTelInput library not available");return}try{this.phoneInputInstance=window.intlTelInput(this.formElements.phoneInput,{initialCountry:"us",preferredCountries:["gb","us","ca","au"],separateDialCode:!0,autoPlaceholder:"aggressive",utilsScript:"https://cdn.jsdelivr.net/npm/intl-tel-input@25.10.12/build/js/utils.js",validationNumberType:"MOBILE"}),this.formElements.phoneInput.addEventListener("countrychange",()=>{this.clearPhoneError()})}catch(t){console.error("Failed to initialize intl-tel-input:",t)}}bindFormEvents(){if(!this.formElements.form)return;this.formElements.fileInputSections.forEach(e=>{const i=e.querySelector('input[type="file"]'),s=e.querySelector("[dev-target=file-item-template]"),o=s?.parentElement,r=e.querySelector(".roles-application-form_file_contain");i&&r&&o&&e.addEventListener("change",l=>this.handleFileInputChange(l,s,r,o))}),this.formElements.form.addEventListener("submit",this.handleFormSubmit.bind(this)),this.formElements.form.addEventListener("input",this.handleInputChange.bind(this));const t=document.getElementById("Linkedin-URL");t&&t.addEventListener("blur",()=>this.validateLinkedInField(t))}setupInitialState(){this.formElements.fileInputSections&&this.formElements.fileInputSections.forEach(t=>{const e=t.querySelector("[dev-target=file-item-template]");e&&(e.style.display="none")}),this.hideAllMessages()}handleFileInputChange(t,e,i,s){const o=t.target,r=o.name,l=o.files;l&&l.length>0&&Array.from(l).slice(0,3).forEach(a=>{this.handleFileUpload(o,a,r,e,i,s)})}handleFileUpload(t,e,i,s,o,r){const l=c.validateFile(e);if(!l.isValid){this.showError(l.errors.join(". "));return}if(i==="Resume")this.uploadedResumeFile=e;else if(i==="cover_letter")this.uploadedCoverLetterFile=e;else if(this.uploadedAdditionalFiles.length<3)this.uploadedAdditionalFiles.push(e),this.uploadedAdditionalFiles.length===3&&o.classList.add("hide");else{this.showError("You can only upload up to 3 additional files.");return}this.displayUploadedFile(t,e,s,o,r)}validateLinkedInField(t){const e=t.value.trim();m.validateLinkedInUrl(e)?t.setCustomValidity(""):t.setCustomValidity("Please enter a valid LinkedIn URL or type 'N/A' if not applicable"),t.reportValidity()}displayUploadedFile(t,e,i,s,o){if(!i||!s||!o)return;t.hasAttribute("multiple")&&this.uploadedAdditionalFiles.length<3?s.classList.remove("hide"):s.classList.add("hide");const l=i.cloneNode(!0);l.style.display="flex",l.classList.add("uploaded-file");const a=l.querySelector('[dev-target="file-name"]');a&&(a.textContent=e.name);const d=l.querySelector('[dev-target="file-remove-button"]');d&&d.addEventListener("click",u=>this.removeUploadedFile(e,t,u.target,s)),o.appendChild(l)}removeUploadedFile(t,e,i,s){i.closest(".uploaded-file")?.remove(),s.classList.remove("hide"),e.value="",e.name==="Resume"?this.uploadedResumeFile=null:e.name==="cover_letter"?this.uploadedCoverLetterFile=null:this.uploadedAdditionalFiles=this.uploadedAdditionalFiles.filter(r=>r!==t)}removeAllUploadedFiles(){this.uploadedResumeFile=null,this.uploadedCoverLetterFile=null,this.uploadedAdditionalFiles=[],this.formElements.fileInputSections.forEach(t=>{t.querySelectorAll(".uploaded-file").forEach(i=>i.remove())})}collectFormData(){return{firstName:document.getElementById("First-Name")?.value||"",lastName:document.getElementById("Last-Name")?.value||"",email:document.getElementById("Email")?.value||"",phoneNumber:document.getElementById("Phone-Number")?.value||"",linkedinUrl:document.getElementById("Linkedin-URL")?.value||"",consent:document.querySelector('input[name="consent"]')?.checked||!1,resume:this.uploadedResumeFile,coverLetter:this.uploadedCoverLetterFile,additionalFiles:this.uploadedAdditionalFiles,desiredSalary:document.getElementById("Desired-Salary")?.value||"",desiredAdditionalCompensation:document.getElementById("Desired-Additional-Compensation")?.value||""}}validateFormData(t){const e=m.validateForm(t);return t.resume||e.push("Please upload your resume"),this.formElements.form?.querySelectorAll("[required]")?.forEach(s=>{s.value.trim()?s.classList.remove("error"):s.classList.add("error")}),{isValid:e.length===0,errors:e}}async handleFormSubmit(t){const e=this.collectFormData(),i=this.validateFormData(e);if(!i.isValid){this.showError(i.errors.join(". "));return}await this.submitForm(e)}async submitForm(t){this.setLoadingState(!0);try{const e=new FormData;e.append("First-Name",t.firstName),e.append("Last-Name",t.lastName),e.append("Email",t.email),e.append("Phone-Number",t.phoneNumber),e.append("Linkedin-URL",t.linkedinUrl),e.append("desiredSalary",t.desiredSalary),e.append("desiredAdditionalCompensation",t.desiredAdditionalCompensation),t.resume&&e.append("Resume",t.resume),t.coverLetter&&e.append("cover_letter",t.coverLetter),t.additionalFiles&&t.additionalFiles.forEach(o=>{e.append("additionalFile",o)});const i=await fetch(this.apiUrl,{method:"POST",body:e}),s=await i.json();if(i.ok&&s.success)this.handleSuccessfulSubmission();else throw new Error(s.error||"Failed to submit application")}catch(e){console.error("Submission error:",e),this.showError("Failed to submit application. Please try again.")}finally{this.setLoadingState(!1)}}handleSuccessfulSubmission(){this.formElements.form?.reset(),this.formElements.fileInputSections.forEach(t=>{const e=t.querySelector(".roles-application-form_file_contain");e&&e.classList.remove("hide")}),this.formElements.form.querySelector(".w-checkbox-input.w--redirected-checked")?.classList.remove("w--redirected-checked"),this.removeAllUploadedFiles()}setLoadingState(t){this.formElements.submitButton&&(t?(this.formElements.submitButton.value="Applying...",this.formElements.submitButton.disabled=!0):(this.formElements.submitButton.value=this.originalButtonText,this.formElements.submitButton.disabled=!1))}handleInputChange(t){const e=t.target;e.classList.contains("error")&&e.classList.remove("error")}clearPhoneError(){this.formElements.phoneInput&&(this.formElements.phoneInput.classList.remove("error"),this.formElements.phoneInput.closest(".roles-application-form_input_wrap")?.classList.remove("error"))}showError(t){const e=document.createElement("div");e.className="error system-message",e.textContent=t,document.querySelectorAll(".error.system-message").forEach(s=>s.remove()),this.formElements.form?.parentElement?.after(e),setTimeout(()=>{e.remove()},this.ERROR_MESSAGE_DURATION)}hideAllMessages(){this.formElements.successMessage&&(this.formElements.successMessage.style.display="none"),this.formElements.errorMessage&&(this.formElements.errorMessage.style.display="none")}injectStyles(){const t=`
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
    `,e=document.createElement("style");e.textContent=t,document.head.appendChild(e)}reinitialize(){this.uploadedResumeFile=null,this.uploadedCoverLetterFile=null,this.uploadedAdditionalFiles=[],this.setupInitialState()}destroy(){if(this.phoneInputInstance)try{this.phoneInputInstance.destroy(),this.phoneInputInstance=null}catch(i){console.warn("Error destroying phone input instance:",i)}document.querySelectorAll(".uploaded-file").forEach(i=>i.remove()),document.querySelectorAll(".system-message").forEach(i=>i.remove())}}document.addEventListener("DOMContentLoaded",()=>{try{window.jobApplicationForm=new p,console.log("Job Application Form initialized successfully")}catch(n){console.error("Failed to initialize Job Application Form:",n)}});
//# sourceMappingURL=resume-form.js.map
