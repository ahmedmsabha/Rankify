import { useState } from "react";
import FileUploader from "~/components/file-uploader";
import { NavBar } from "~/components/nav-bar";

export default function Upload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function handleFileSelected(file: File | null) {
    setFile(file);
  }

  function handleAnalyzeResume({companyName, jobTitle, jobDescription, resume}: {companyName: string, jobTitle: string, jobDescription: string, resume: File}) {
    if (!file) return;

    setIsProcessing(true);
    setStatusText("Uploading the file");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget.closest("form");

    if (!form) return;

    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) return;



    handleAnalyzeResume({companyName, jobTitle, jobDescription, resume: file});
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <NavBar />

      <section className="flex flex-col items-center gap-8 pt-12 max-sm:mx-2 mx-15 pb-5">
        <div className="flex flex-col items-center gap-8 max-w-4xl text-center max-sm:gap-4 py-16">
          <h1>Smart feedback for your job dream</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
              id="upload-form"
            >
              <div className="flex flex-col gap-2 w-full items-start">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  id="company-name"
                  name="company-name"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2 w-full items-start">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  id="job-title"
                  name="job-title"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2 w-full items-start">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  id="job-description"
                  name="job-description"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2 w-full items-start">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelected} />
              </div>

              <button type="submit" className="primary-gradient text-white rounded-full px-4 py-2 cursor-pointer w-full">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
