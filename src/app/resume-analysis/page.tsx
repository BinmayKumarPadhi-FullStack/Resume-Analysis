/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import pdfToText from "react-pdftotext";
import {
  uploadResumeStart,
  uploadResumeFailure,
  uploadResumeSuccess,
} from "../../store/resumeSlice";
import { RootState } from "@/store";
import Image from "next/image";
import ErrorPopup from "../components/ErrorPopup";
import FeedbackForm from "../components/FeedbackForm";

// Define the interfaces for the form data and parsed resume data
interface SkillDetails {
  job_demand_percentage: number;
  recommendations: string;
  skill: string;
}

interface ResumeData {
  name: string;
  skills: string[];
  insights: string;
  resume_improvement_suggestions: string;
  skills_details: SkillDetails[];
}

interface ResumeFormData {
  resume: FileList;
  name: string;
  insights: string;
  skills: string[];
  resume_improvement_suggestions: string;
  skills_details: SkillDetails[];
}

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
  created: string;
}

interface JobData {
  results: jobDetails[]; // Array of jobDetails
}

export default function ResumeAnalysis() {
  const { register } = useForm<ResumeFormData>({
    defaultValues: {
      skills_details: [
        {
          job_demand_percentage: 0,
          recommendations: "",
          skill: "",
        },
      ],
      skills: [],
    },
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
    "Fetching resume overview..."
  );
  const [selectedFile, setSelectedFile] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const extractText = async (file: File) => {
    try {
      const text = await pdfToText(file); // Extract texts from the resume
      setExtractedData(text); // Update state after extracting text
    } catch (error) {
      console.error("Failed to extract text from PDF: ", error);
    }
  };
  const [error, setError] = useState("");
  const [isFeedbackButtonClicked, setIsFeedbackButtonClicked] = useState(false);
  const [firstSkill, setFirstSkill] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingMessage("Looking for Job Recommedations...");
    }, 6000); // After 3 seconds, change message
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // convert extracted data to json
  const parseJSONSafely = (str: string) => {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error(error);
      return null; // Return null if parsing fails
    }
  };

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
                resetData();
                const isJsonData = parseJSONSafely(cleanedString);
                if (isJsonData) {
                  const data: ResumeData = JSON.parse(cleanedString);
                  setParsedData(data);
                  setUserSkillsSet(data?.skills);
                  setMissingFields(missingFields);
                  const firstThreeSkills =
                    data?.skills?.length > 2
                      ? data?.skills.slice(0, 1)
                      : data?.skills;
                  if (data?.skills?.length > 0) {
                    setFirstSkill(data?.skills.slice(0, 1));
                  }
                  fetchJobs(currentPage, jobsPerPage, firstThreeSkills);
                } else {
                  setError("Something went wrong! Please try again later.");
                }
              } catch (error) {
                console.error("Error parsing JSON", error);
              }
            }
          }
        } catch (error) {
          setError("Something went wrong! Please try again later.");
          console.error("Error during OpenAI API call:", error);
        }
      };

      callOpenAI();
    }
  }, [extractedData]);

  const handleSkillClick = (skill: string) => {
    setCurrentPage(1)
    const updatedSkills = [...selectedSkills];
    const skillIndex = updatedSkills.indexOf(skill);
    if (skillIndex === -1) {
      updatedSkills.push(skill);
    } else {
      updatedSkills.splice(skillIndex, 1);
    }
    setSelectedSkills(updatedSkills);
    if (updatedSkills.length > 0) {
      fetchJobs(currentPage, jobsPerPage, updatedSkills);
    } else {
      fetchJobs(currentPage, jobsPerPage, firstSkill);
    }
  };

  const fetchJobs = async (
    page: number,
    jobsPerPage: number,
    skills: string[]
  ) => {
    dispatch(uploadResumeStart());
    scrollToSection("job-listing");
    try {
      const response = await fetch(
        `/api/jobs?page=${page}&results_per_page=${jobsPerPage}&what=${encodeURIComponent(
          skills.join(" ")
        )}`
      );

      const data = await response.json();

      if (!Array.isArray(data.results)) {
        setError("Something went wrong! Please try again later.");
        console.error("API response is not an array:", data);
        setJobsData([]); // ✅ Ensure it is always an array
        dispatch(uploadResumeSuccess(""));
        return [];
      }
      const sorted = sortedJobs(data);
      setJobsData(sorted); // ✅ Use `data.results` if Adzuna API returns jobs under `results`
      dispatch(uploadResumeSuccess(""));
      return data.results;
    } catch (error) {
      setError("Something went wrong! Please try again later.");
      console.error("Error fetching jobs:", error);
      setJobsData([]); // ✅ Ensure default empty array on error
      dispatch(uploadResumeSuccess(""));
      return [];
    }
  };

  const sortedJobs = (data: JobData): jobDetails[] => {
    return data.results.sort((a: jobDetails, b: jobDetails) => {
      const dateA = new Date(a.created);
      const dateB = new Date(b.created);
      return dateB.getTime() - dateA.getTime(); // Sorting in descending order
    });
  };

  const handlePageChange = (page: number) => {
    scrollToSection("job-listing");
    setCurrentPage(page);
    fetchJobs(page, jobsPerPage, selectedSkills);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const resetData = () => {
    setMissingFields([]);
    setExtractedData("");
    setParsedData({
      name: "",
      insights: "",
      skills: [],
      skills_details: [
        {
          job_demand_percentage: 0,
          recommendations: "",
          skill: "",
        },
      ],
      resume_improvement_suggestions: "",
    });
    setJobsData([]);
    setUserSkillsSet([]);
    setSelectedSkills([]);
    setCurrentPage(1);
    setLoadingMessage("Fetching Resume Overview...");
  };
  const handleFileChange = async (event: any) => {
    const file = event.target.files[0];
    setSelectedFile(file.name);
    try {
      const fileExtension = file.name.split(".").pop();
      if (fileExtension == "pdf") {
        await extractText(file);
      } else {
        setSelectedFile("");
        setError("Please upload PDF file only.");
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      dispatch(uploadResumeFailure());
    }
  };

  const openFeedbackForm = () => {
    setIsFeedbackButtonClicked(true);
  };
  const closeFeedbackForm = () => {
    setIsFeedbackButtonClicked(false);
  };

  // Format the date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="container">
      <div className="header">
        <div className="feedback-img">
          <Image
            onClick={openFeedbackForm}
            style={{ cursor: "pointer" }}
            src="/images/feedback-icon.png" // Path to your image in public directory
            alt="download"
            width={20} // Specify width
            height={20} // Specify height
          />
        </div>
      </div>
      {error.length > 0 && (
        <ErrorPopup errorMessage={error} onClose={() => setError("")} />
      )}
      {isFeedbackButtonClicked && (
        <div className="feedback-popup-overlay" onClick={closeFeedbackForm}>
          <div
            className="feedback-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <FeedbackForm closePopup={closeFeedbackForm} />
          </div>
        </div>
      )}
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
          <p className="input-note">
            Note*: Accepts only PDF file
            <span>
              <a
                href={"https://www.ilovepdf.com/word_to_pdf"}
                target="_blank"
                rel="noopener noreferrer"
                className="apply-button"
              >
                Convert to PDF
              </a>
            </span>
          </p>
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
          <h1 className="heading">Resume Overview</h1>
          {missingFields.length > 0 && (
            <div>
              {missingFields.length > 0 && (
                <div className="missing-fields-container">
                  <h3 className="missing-fields-title">⚠ Missing Fields</h3>
                  <div className="missing-fields-grid">
                    {missingFields.map((field) => (
                      <div key={field} className="missing-field-card">
                        ❌ {field} is missing
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {parsedData ? (
            <div className="resume-details-container">
              <div className="section">
                <h2 className="section-title">Name</h2>
                <div className="data-value">{parsedData.name}</div>
              </div>

              {/* Insights Section */}
              <div className="section">
                <h2 className="section-title">Insights</h2>
                <p className="data-value">{parsedData.insights}</p>
              </div>

              {/* Resume Improvement Suggestions */}
              <div className="section">
                <h2 className="section-title">
                  Resume Improvement Suggestions
                </h2>
                <p className="data-value">
                  {parsedData.resume_improvement_suggestions}
                </p>
              </div>

              {/* Skills Section */}
              <div className="section">
                <h2 className="section-title">Skills</h2>
                <ul className="skills-list">
                  {parsedData.skills.map((skill, index) => (
                    <li key={index} className="skill-item">
                      <h3>{skill}</h3>
                      <div className="skill-details">
                        {/* Display each skill's job demand and market percentage */}
                        {parsedData.skills_details[index] && (
                          <>
                            <p className="job-demands">
                              <strong>Job Demand: </strong>
                              {
                                <span className="job-demand-percenatge">
                                  {
                                    parsedData.skills_details[index]
                                      .job_demand_percentage
                                  }
                                </span>
                              }
                              %
                            </p>
                            <p>
                              <strong>Improvement Suggestions: </strong>
                              {parsedData.skills_details[index].recommendations}
                            </p>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Optional Section for Other Data */}
              {/* If you have additional data like Experience, Projects, etc., you can display them here in a similar way */}
            </div>
          ) : (
            <p className="message">
              {loading
                ? "Loading Resume Overview..."
                : "Upload file to extract resume overview"}
            </p>
          )}
        </div>
      </div>
      {/* Right Side (Job Listings) */}
      <div className="job-listings-container">
        <h1 className="heading">Recommended Jobs</h1>
        {/* Skills as buttons */}
        {parsedData ? (
          <div className="skills-title-buttons">
            <h5 className="job-title">Skills</h5>
            <div className="skills-buttons scrollbar-color">
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
          </div>
        ) : (
          <p className="message">
            {loading
              ? "Fetching Recommended Jobs..."
              : "Upload file to get Recommended Jobs"}
          </p>
        )}
        {/* Job Listings - Scrollable */}
        <div className="job-listings-scroll scrollbar-color">
          {jobsData?.map((item, index) => {
            return (
              <div id="job-listing" key={index} className="job-listing">
                <h5 className="job-title">{item.title}</h5>
                <h6 className="company-name">{item.company.display_name}</h6>
                <p className="job-description">{item.description}</p>
                <div className="job-location">
                  <span>Location: {item.location.display_name}</span>
                  <span>
                    Contract Type:{" "}
                    {item?.contract_type && item?.contract_type.length > 0
                      ? item?.contract_type
                      : "N/A"}
                  </span>
                </div>
                <div className="created-date">
                  <a
                    href={item.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="apply-button"
                  >
                    Apply Here
                  </a>
                  <p className="job-description">
                    {item?.created
                      ? formatDate(item.created)
                      : "No Date Available"}
                  </p>
                </div>
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
