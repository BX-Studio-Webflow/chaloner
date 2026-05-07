console.log("hi");class d{elements;uploadedFile=null;jobId=null;originalButtonText="";phoneInputInstance=null;ALLOWED_FILE_TYPES=["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain"];MAX_FILE_SIZE=5*1024*1024;SUCCESS_MESSAGE_DURATION=5e3;ERROR_MESSAGE_DURATION=8e3;constructor(){this.initializeElements(),this.initializeEventListeners(),this.setupInitialState()}initializeElements(){const t=document.getElementById("email-form-2"),e=document.querySelector('input[name="Resume"]'),i=document.querySelector('[dev-target="file-item-template"]'),n=document.querySelector(".roles-application-form_file_contain"),s=document.querySelector('[dev-target="form-success"]'),o=document.querySelector(".w-form-fail"),l=t?.querySelector('input[type="submit"]'),a=document.getElementById("Phone-Number");if(!t||!e||!i||!n||!s||!o||!l||!a)throw new Error("Required form elements not found");this.elements={form:t,fileInput:e,fileTemplate:i,fileContainer:i.parentElement,uploadSection:n,successMessage:s,errorMessage:o,submitButton:l,phoneInput:a},this.originalButtonText=l.value,this.jobId=this.getJobIdFromURL(),this.initializePhoneInput()}initializeEventListeners(){this.elements.fileInput.addEventListener("change",this.handleFileInputChange.bind(this)),this.elements.form.addEventListener("submit",this.handleFormSubmit.bind(this)),this.elements.form.addEventListener("input",this.handleInputChange.bind(this))}setupInitialState(){this.elements.fileTemplate.style.display="none",this.hideAllMessages(),this.injectStyles()}initializePhoneInput(){if(typeof window.intlTelInput>"u"){console.warn("intlTelInput library not loaded. Phone validation will be basic.");return}try{this.phoneInputInstance=window.intlTelInput(this.elements.phoneInput,{initialCountry:"gb",preferredCountries:["gb","us","ca","au"],separateDialCode:!0,autoPlaceholder:"aggressive",utilsScript:"https://cdn.jsdelivr.net/npm/intl-tel-input@25.10.12/build/js/utils.js",validationNumberType:"MOBILE"}),this.elements.phoneInput.addEventListener("countrychange",()=>{this.clearPhoneError()})}catch(t){console.error("Failed to initialize intl-tel-input:",t)}}clearPhoneError(){this.elements.phoneInput.classList.remove("error"),this.elements.phoneInput.closest(".roles-application-form_input_wrap")?.classList.remove("error")}getJobIdFromURL(){return new URLSearchParams(window.location.search).get("jobId")}handleFileInputChange(t){const i=t.target.files?.[0];i&&this.handleFileUpload(i)}handleFileUpload(t){const e=this.validateFile(t);if(!e.isValid){this.showError(e.errors.join(". "));return}this.uploadedFile=t,this.displayUploadedFile(t)}validateFile(t){const e=[];return this.ALLOWED_FILE_TYPES.includes(t.type)||e.push("Please upload a PDF, DOC, DOCX, or TXT file"),t.size>this.MAX_FILE_SIZE&&e.push("File size must be less than 5MB"),{isValid:e.length===0,errors:e}}displayUploadedFile(t){this.elements.uploadSection.style.display="none";const e=this.elements.fileTemplate.cloneNode(!0);e.style.display="flex",e.classList.add("uploaded-file");const i=e.querySelector('[dev-target="file-name"]');i.textContent=t.name,e.querySelector('[dev-target="file-remove-button"]').addEventListener("click",this.removeUploadedFile.bind(this)),this.elements.fileContainer.appendChild(e)}removeUploadedFile(){document.querySelector(".uploaded-file")?.remove(),this.elements.uploadSection.style.display="flex",this.elements.fileInput.value="",this.uploadedFile=null}collectFormData(){return{firstName:document.getElementById("First-Name").value,lastName:document.getElementById("Last-Name").value,email:document.getElementById("Email").value,phoneNumber:document.getElementById("Phone-Number").value,linkedinUrl:document.getElementById("Linkedin-URL").value,resume:this.uploadedFile}}validateFormData(t){const e=[];this.elements.form.querySelectorAll("[required]").forEach(s=>{s.value.trim()?s.classList.remove("error"):(s.classList.add("error"),e.push(`${s.getAttribute("data-name")||s.name} is required`))});const n=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;return t.email&&!n.test(t.email)&&(document.getElementById("Email").classList.add("error"),e.push("Please enter a valid email address")),t.linkedinUrl&&(/^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(t.linkedinUrl)||(document.getElementById("Linkedin-URL").classList.add("error"),e.push("Please enter a valid LinkedIn URL"))),t.resume||e.push("Please upload your resume"),{isValid:e.length===0,errors:e}}async handleFormSubmit(t){t.preventDefault(),t.stopPropagation();const e=this.collectFormData(),i=this.validateFormData(e);if(!i.isValid){this.showError(i.errors.join(". "));return}if(!this.jobId){this.showError("Job ID not found in URL");return}await this.submitForm(e)}async submitForm(t){this.setLoadingState(!0);try{const e=new window.FormData;e.append("First-Name",t.firstName),e.append("Last-Name",t.lastName),e.append("Email",t.email),e.append("Phone-Number",t.phoneNumber),e.append("Linkedin-URL",t.linkedinUrl),t.resume&&e.append("Resume",t.resume);const i=await fetch(`http://localhost:3000/api/jobs/${this.jobId}/apply`,{method:"POST",body:e}),n=await i.json();if(i.ok&&n.success)this.handleSuccessfulSubmission();else throw new Error(n.error||"Failed to submit application")}catch(e){console.error("Submission error:",e),this.showError("Failed to submit application. Please try again.")}finally{this.setLoadingState(!1)}}handleSuccessfulSubmission(){this.showSuccess(),this.elements.form.reset(),this.removeUploadedFile()}setLoadingState(t){t?(this.elements.submitButton.value="Applying...",this.elements.submitButton.disabled=!0):(this.elements.submitButton.value=this.originalButtonText,this.elements.submitButton.disabled=!1)}handleInputChange(t){const e=t.target;e.classList.contains("error")&&e.classList.remove("error")}showSuccess(){this.hideAllMessages(),this.elements.successMessage.style.display="block",this.elements.successMessage.scrollIntoView({behavior:"smooth"}),setTimeout(()=>{this.elements.successMessage.style.display="none"},this.SUCCESS_MESSAGE_DURATION)}showError(t){this.hideAllMessages();const e=this.elements.errorMessage.querySelector("div");e.textContent=t,this.elements.errorMessage.style.display="block",this.elements.errorMessage.scrollIntoView({behavior:"smooth"}),setTimeout(()=>{this.elements.errorMessage.style.display="none"},this.ERROR_MESSAGE_DURATION)}hideAllMessages(){this.elements.successMessage.style.display="none",this.elements.errorMessage.style.display="none"}injectStyles(){const t=`
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
    `,e=document.createElement("style");e.textContent=t,document.head.appendChild(e)}reinitialize(){this.uploadedFile=null,this.jobId=this.getJobIdFromURL(),this.setupInitialState()}destroy(){if(this.elements.fileInput.removeEventListener("change",this.handleFileInputChange.bind(this)),this.elements.form.removeEventListener("submit",this.handleFormSubmit.bind(this)),this.elements.form.removeEventListener("input",this.handleInputChange.bind(this)),this.phoneInputInstance)try{this.phoneInputInstance.destroy(),this.phoneInputInstance=null}catch(e){console.warn("Error destroying phone input instance:",e)}document.querySelector(".uploaded-file")?.remove()}}document.addEventListener("DOMContentLoaded",()=>{try{new d}catch(r){console.error("Failed to initialize JobApplicationForm:",r)}});
//# sourceMappingURL=form.js.map
