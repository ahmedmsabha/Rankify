import { useState } from "react";
import FileUploader from "~/components/file-uploader";
import { NavBar } from "~/components/nav-bar";
import { usePuterStore } from "~/lib/puter";
import { prepareInstructions } from '../../constants/index';
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";

export default function Upload() {
  const {auth, isLoading, fs, ai, kv} = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function handleFileSelected(file: File | null) {
    setFile(file);
  }

  async function handleAnalyzeResume({companyName, jobTitle, jobDescription, resume}: {companyName: string, jobTitle: string, jobDescription: string, resume: File}) {
    setIsProcessing(true);

    setStatusText("Uploading the file...");
    const uploadedFile = await fs.upload([resume]);

    if (!uploadedFile) return setStatusText("Error: Failed to upload file");

    setStatusText("Converting to image...");
    const imageFile = await convertPdfToImage(resume)

    if (!imageFile.file) return setStatusText("Error: Failed to convert PDF to image");

    setStatusText("Uploading the image...");
    const uploadedImage = await fs.upload([imageFile.file]);

    if (!uploadedImage) return setStatusText("Error: Failed to upload image");

    setStatusText("Preparing data...");
    const uuid = generateUUID()

    const data = {
      id:uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: ''
    }

    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    setStatusText('Analyzing...');

    const feedback = await ai.feedback(
      uploadedFile.path,
      prepareInstructions({jobTitle, jobDescription})
    )

    if (!feedback)
     return setStatusText("Error: Failed to analyze resume");


    const feedbackText = typeof feedback.message.content === "string" ? feedback.message.content : feedback.message.content[0].text;
    data.feedback = JSON.parse(feedbackText);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));

    setStatusText("Analysis complete, Redirecting...");
    setIsProcessing(false);
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
