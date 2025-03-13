/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
// import OpenAI from "openai";
import pdfToText from "react-pdftotext";
import {
  uploadResumeStart,
  uploadResumeFailure,
  uploadResumeSuccess,
} from "../../store/resumeSlice";
import { RootState } from "@/store";
import Image from "next/image";
// import axios from "axios";

// Define the interfaces for the form data and parsed resume data
interface Experience {
  Company: string;
  Location: string;
  Position: string;
  Duration: string;
  Responsibilities: string;
}

interface Projects {
  Name: string;
  Description: string;
}

interface Education {
  Institution: string;
  Degree: string;
  Duration: string;
}

interface ResumeData {
  Name: string;
  Experience: Experience[];
  Skills: string[];
  Education: Education;
  Projects: Projects[];
}

interface ResumeFormData {
  resume: FileList;
  Name: string;
  Experience: Experience[];
  Skills: string[];
  Education: Education;
  Projects: Projects[];
}

// interface JobsData {
//   data: {
//     results: [];
//   };
// }

interface jobDetails {
  id: string;
  company: {
    display_name: string;
  };
  title: string;
  description: string;
  redirect_url: string;
  contract_type: string;
  location: {
    display_name: string;
  };
}

export default function ResumeAnalysis() {
  const { register, setValue, control } = useForm<ResumeFormData>({
    defaultValues: {
      Experience: [
        {
          Company: "",
          Location: "",
          Position: "",
          Duration: "",
          Responsibilities: "",
        },
      ],
      Projects: [
        {
          Name: "",
          Description: "",
        },
      ],
      Skills: [],
      Education: { Institution: "", Degree: "", Duration: "" },
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "Experience",
  });

  const { fields: projectFields } = useFieldArray({
    control,
    name: "Projects",
  });

  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.resume);
  const [extractedData, setExtractedData] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ResumeData | null>(null);
  const [jobsData, setJobsData] = useState<jobDetails[]>([]);
  const [userSkillsSet, setUserSkillsSet] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(10); // Show 10 jobs per page
  const [loadingMessage, setLoadingMessage] = useState(
    "Fetching employee details..."
  );
  const [selectedFile, setSelectedFile] = useState("");
  // Create a reference to the job section
  // const jobsSectionRef = useRef<HTMLDivElement>(null);

  const extractText = async (file: File) => {
    try {
      const text = await pdfToText(file); // Extract texts from the resume
      setExtractedData(text); // Update state after extracting text
    } catch (error) {
      console.error("Failed to extract text from PDF: ", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingMessage("Looking for Job Recommedations...");
    }, 6000); // After 3 seconds, change message

    // const secondTimer = setTimeout(() => {
    //   setLoadingMessage("Almost done...");
    // }, 9000); // After 6 seconds, change message again

    return () => {
      clearTimeout(timer);
      // clearTimeout(secondTimer);
    };
  }, []);

  useEffect(() => {
    if (extractedData) {
      dispatch(uploadResumeStart());
      const callOpenAI = async () => {
        try {
          const responseOne = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ extractedData }),
          });
          const dataOne = await responseOne.json();
          const string = dataOne; // ✅ Convert JSON to string safely
          if (string) {
            const cleanedString: string = string
              .replace(/^```json\n|\n```$/g, "")
              .trim();

            if (cleanedString) {
              try {
                dispatch(uploadResumeSuccess(string));
                const data: ResumeData = JSON.parse(cleanedString);
                setParsedData(data);
                setValue("Name", data.Name);
                setValue("Experience", data.Experience);
                setValue("Projects", data.Projects);
                setValue("Skills", data.Skills);
                setValue("Education", data.Education);
                // getJobListings(data, currentPage);
                setUserSkillsSet(data?.Skills);
                const firstThreeSkills =
                  data?.Skills?.length > 2
                    ? data?.Skills.slice(0, 3)
                    : data?.Skills;
                // const skills = firstThreeSkills.join(",");
                fetchJobs(currentPage, jobsPerPage, firstThreeSkills);
              } catch (error) {
                console.error("Error parsing JSON", error);
              }
            }
          }
        } catch (error) {
          console.error("Error during OpenAI API call:", error);
        }
      };

      callOpenAI();
    }
  }, [extractedData]);

  const handleSkillClick = (skill: string) => {
    const updatedSkills = [...selectedSkills];
    const skillIndex = updatedSkills.indexOf(skill);
    if (skillIndex === -1) {
      updatedSkills.push(skill);
    } else {
      updatedSkills.splice(skillIndex, 1);
    }
    setSelectedSkills(updatedSkills);
    fetchJobs(currentPage, jobsPerPage, updatedSkills);
  };

  const fetchJobs = async (
    page: number,
    jobsPerPage: number,
    skills: string[]
  ) => {
    dispatch(uploadResumeStart());
    try {
      const response = await fetch(
        `/api/jobs?page=${page}&results_per_page=${jobsPerPage}&what=${encodeURIComponent(
          skills.join(" ")
        )}`
      );

      const data = await response.json();

      if (!Array.isArray(data.results)) {
        console.error("API response is not an array:", data);
        setJobsData([]); // ✅ Ensure it is always an array
        dispatch(uploadResumeSuccess(""));
        return [];
      }

      setJobsData(data.results); // ✅ Use `data.results` if Adzuna API returns jobs under `results`
      // Scroll to the jobs section after the jobs are fetched
      // if (jobsSectionRef.current) {
      //   jobsSectionRef.current.scrollIntoView({
      //     behavior: "smooth", // Smooth scroll
      //     block: "start", // Scroll to the top of the section
      //   });
      // }
      dispatch(uploadResumeSuccess(""));
      return data.results;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobsData([]); // ✅ Ensure default empty array on error
      dispatch(uploadResumeSuccess(""));
      return [];
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchJobs(page, jobsPerPage, selectedSkills);
  };

  // const onSubmit: SubmitHandler<ResumeFormData> = async (data) => {
  //   const file = data.resume[0];

  //   try {
  //     extractText(file);
  //   } catch (error) {
  //     console.error("Error uploading resume:", error);
  //     dispatch(uploadResumeFailure());
  //   }
  // };

  // const resetData = () => {
  //   setExtractedData("");
  //   setParsedData({
  //     Name: "",
  //     Experience: [],
  //     Skills: [],
  //     Education: {
  //       Institution: "",
  //       Degree: "",
  //       Duration: "",
  //     },
  //     Projects: [],
  //   });
  //   setJobsData([]);
  //   setUserSkillsSet([]);
  //   setSelectedSkills([]);
  //   setCurrentPage(1);
  //   setLoadingMessage("Fetching employee details...");
  //   setValue("Name", "");
  //   setValue("Experience", []);
  //   setValue("Projects", []);
  //   setValue("Skills", []);
  //   setValue("Education", {
  //     Institution: "",
  //     Degree: "",
  //     Duration: "",
  //   });
  // };
  const handleFileChange = async (event: any) => {
    const file = event.target.files[0];
    setSelectedFile(file.name);
    try {
      await extractText(file);
    } catch (error) {
      console.error("Error uploading resume:", error);
      dispatch(uploadResumeFailure());
    }
  };
  return (
    <div className="container">
      {/* Overlay Loader */}
      {loading && (
        <div className="overlay">
          <div className="loader-container">
            {/* Gradient Spinning Loader */}
            <div className="loader"></div>
            <p className="loading-message">{loadingMessage}</p>
          </div>
        </div>
      )}
      {/* Left Side (Upload Form) */}
      <div className="upload-form-container">
        <h1 className="heading">AI Resume Analyzer</h1>
        <form className="form">
          {/* Container for the label and download icon */}
          <label htmlFor="file-upload" className="file-upload-label">
            {/* Download Icon inside the box */}
            <Image
              src="/images/download-1.png" // Path to your image in public directory
              alt="download"
              width={40} // Specify width
              height={40} // Specify height
            />

            {/* File upload text */}
            <div className="file-upload-text">
              {selectedFile && selectedFile.length > 1
                ? selectedFile
                : "Upload your Resume"}
            </div>
          </label>

          {/* Hidden file input */}
          <input
            type="file"
            id="file-upload"
            {...register("resume", { required: true })}
            className="input-file"
            accept=".pdf"
            onChange={handleFileChange} // Handle file selection
          />

          {/* Submit button */}
          {/* <div className="submit-section">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? "Analyzing..." : "Upload Resume"}
            </button>
          </div> */}
        </form>

        {/* Right Side (Parsed Data Form) */}
        <div className="parsed-data-container scrollbar-color">
          <h1 className="heading">Employee Details</h1>
          {parsedData ? (
            <form>
              <div className="form-group">
                <label htmlFor="Name" className="label">
                  Name
                </label>
                <input
                  {...register("Name", { required: true })}
                  id="Name"
                  className="input"
                  defaultValue={parsedData.Name}
                />
              </div>

              {/* Experience Fields */}
              {fields.map((exp, index) => (
                <div key={exp.id}>
                  <h3 className="experience-heading">Experience {index + 1}</h3>
                  <div className="form-group">
                    <label
                      htmlFor={`Experience.${index}.Company`}
                      className="label"
                    >
                      Company
                    </label>
                    <input
                      {...register(`Experience.${index}.Company`, {
                        required: true,
                      })}
                      id={`Experience.${index}.Company`}
                      className="input"
                      defaultValue={exp.Company}
                    />
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor={`Experience.${index}.Duration`}
                      className="label"
                    >
                      Duration
                    </label>
                    <input
                      {...register(`Experience.${index}.Duration`, {
                        required: true,
                      })}
                      id={`Experience.${index}.Duration`}
                      className="input"
                      defaultValue={exp.Duration}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      htmlFor={`Experience.${index}.Responsibilities`}
                      className="label"
                    >
                      Responsibilities
                    </label>
                    <textarea
                      {...register(`Experience.${index}.Responsibilities`)}
                      id={`Experience.${index}.Responsibilities`}
                      className="input"
                      defaultValue={exp.Responsibilities}
                    />
                  </div>
                </div>
              ))}

              {/* Project Fields */}
              {projectFields.map((field, index) => (
                <div key={field.id} className="form-group">
                  <h3 className="project-heading">Project {index + 1}</h3>
                  <label htmlFor={`Projects.${index}.Name`} className="label">
                    Name
                  </label>
                  <input
                    id={`Projects.${index}.Name`}
                    defaultValue={field?.Name}
                    className="input"
                    {...register(`Projects.${index}.Name`, {
                      required: true,
                    })}
                  />
                  <div className="form-group">
                    <label
                      htmlFor={`Projects.${index}.Description`}
                      className="label"
                    >
                      Description
                    </label>
                    <input
                      defaultValue={field?.Description}
                      id={`Projects.${index}.Name`}
                      className="input"
                      {...register(`Projects.${index}.Description`, {
                        required: true,
                      })}
                    />
                  </div>
                </div>
              ))}

              {/* Skills */}
              <div className="form-group">
                <label htmlFor="Skills" className="label">
                  Skills
                </label>
                <input
                  {...register("Skills", { required: true })}
                  id="Skills"
                  className="input"
                  defaultValue={parsedData.Skills.join(", ")}
                />
              </div>

              {/* Education Fields */}
              <div className="form-group">
                <label htmlFor="Education.Institution" className="label">
                  Institution
                </label>
                <input
                  {...register("Education.Institution", { required: true })}
                  id="Education.Institution"
                  className="input"
                  defaultValue={parsedData.Education.Institution}
                />
              </div>
              <div className="form-group">
                <label htmlFor="Education.Degree" className="label">
                  Degree
                </label>
                <input
                  {...register("Education.Degree", { required: true })}
                  id="Education.Degree"
                  className="input"
                  defaultValue={parsedData.Education.Degree}
                />
              </div>
              <div className="form-group">
                <label htmlFor="Education.Duration" className="label">
                  Duration
                </label>
                <input
                  {...register("Education.Duration", { required: true })}
                  id="Education.Duration"
                  className="input"
                  defaultValue={parsedData.Education.Duration}
                />
              </div>
            </form>
          ) : (
            <p className="message">
              {loading
                ? "Loading Employee Details..."
                : "Upload Resume to extract employee details"}
            </p>
          )}
        </div>
      </div>
      {/* Right Side (Job Listings) */}
      <div className="job-listings-container">
        <h1 className="heading">Recommended Jobs</h1>
        {/* Skills as buttons */}
        {parsedData ? (
          <div className="skills-buttons">
            {userSkillsSet?.map((skill, index) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={index}
                  onClick={() => handleSkillClick(skill)}
                  className={`skill-button ${isSelected ? "selected" : ""}`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="message">
            {loading
              ? "Fetching Recommended Jobs..."
              : "Upload Resume to get Recommended Jobs"}
          </p>
        )}

        {/* Job Listings - Scrollable */}
        <div className="job-listings-scroll scrollbar-color">
          {jobsData?.map((item, index) => {
            return (
              <div key={index} className="job-listing">
                <h5 className="job-title">{item.title}</h5>
                <h6 className="company-name">{item.company.display_name}</h6>
                <p className="job-description">{item.description}</p>
                <div className="job-location">
                  <span>Location: {item.location.display_name}</span>
                  <span>Contract Type: {item.contract_type}</span>
                </div>
                <a
                  href={item.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apply-button"
                >
                  Apply Here
                </a>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {jobsData.length > 0 && (
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              Previous
            </button>
            <span className="page-number">{currentPage}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={jobsData.length < jobsPerPage}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
