/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
// import OpenAI from "openai";
import pdfToText from "react-pdftotext";
import {
  uploadResumeStart,
  uploadResumeFailure,
  uploadResumeSuccess,
} from "../../store/resumeSlice";
import { RootState } from "@/store";
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
  const { register, handleSubmit, setValue, control } = useForm<ResumeFormData>(
    {
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
    }
  );

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

  const onSubmit: SubmitHandler<ResumeFormData> = async (data) => {
    const file = data.resume[0];

    try {
      extractText(file);
    } catch (error) {
      console.error("Error uploading resume:", error);
      dispatch(uploadResumeFailure());
    }
  };

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
  return (
    <div className="flex min-h-screen bg-gray-900 text-white p-6 analyze-screen">
      {/* Overlay Loader */}
      {loading && (
        <div className="absolute inset-0 bg-gray-900/50 flex justify-center items-center z-50">
          <div className="flex flex-col items-center bg-transparent p-6">
            {/* Gradient Spinning Loader */}
            <div className="loader"></div>
            <p className="text-lg font-semibold text-orange-500">
              {loadingMessage}
            </p>
          </div>
        </div>
      )}
      {/* Left Side (Upload Form) */}
      <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-lg mr-4">
        <h1 className="text-2xl font-bold mb-4">AI Resume Analyzer</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
          <input
            type="file"
            {...register("resume", { required: true })}
            className="mb-4 p-2 w-full rounded-xs bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            accept=".pdf"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-4 py-2 rounded-md hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-800 w-full"
          >
            {loading ? "Analyzing..." : "Upload Resume"}
          </button>
        </form>

        {/* Right Side (Parsed Data Form) */}
        <div className="scrollbar-color flex-1 bg-gray-800 p-6 rounded-lg shadow-lg extracted-data-section">
          <h1 className="text-2xl font-bold mb-4">Employee Details</h1>
          {parsedData ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="Name" className="block text-sm font-medium">
                  Name
                </label>
                <input
                  {...register("Name", { required: true })}
                  id="Name"
                  className="w-full rounded-xs p-2 mt-2 mb-4 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={parsedData.Name}
                />
              </div>

              {/* Experience Fields */}
              {fields.map((exp, index) => (
                <div key={exp.id}>
                  <h3 className="font-semibold text-lg">
                    Experience {index + 1}
                  </h3>
                  <div className="mb-2">
                    <label
                      htmlFor={`Experience.${index}.Company`}
                      className="block text-sm font-medium"
                    >
                      Company
                    </label>
                    <input
                      {...register(`Experience.${index}.Company`, {
                        required: true,
                      })}
                      id={`Experience.${index}.Company`}
                      className="w-full rounded-xs p-2 mt-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={exp.Company}
                    />
                  </div>
                  {/* <div className="mb-2">
                    <label
                      htmlFor={`Experience.${index}.Position`}
                      className="block text-sm font-medium"
                    >
                      Position
                    </label>
                    <input
                      {...register(`Experience.${index}.Position`, {
                        required: true,
                      })}
                      id={`Experience.${index}.Position`}
                      className="w-full p-2 rounded-xs mt-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={exp.Position}
                    />
                  </div> */}
                  <div className="mb-2">
                    <label
                      htmlFor={`Experience.${index}.Duration`}
                      className="block text-sm font-medium"
                    >
                      Duration
                    </label>
                    <input
                      {...register(`Experience.${index}.Duration`, {
                        required: true,
                      })}
                      id={`Experience.${index}.Duration`}
                      className="w-full p-2 mt-2 rounded-xs bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={exp.Duration}
                    />
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor={`Experience.${index}.Responsibilities`}
                      className="block text-sm font-medium"
                    >
                      Responsibilities
                    </label>
                    <textarea
                      {...register(`Experience.${index}.Responsibilities`)}
                      id={`Experience.${index}.Responsibilities`}
                      className="w-full p-2 mt-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={exp.Responsibilities}
                    />
                  </div>
                </div>
              ))}
              {/* Project Fields */}
              {projectFields.map((field, index) => (
                <div key={field.id} className="mb-2">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg">
                      Project {index + 1}
                    </h3>
                    <label
                      htmlFor={`Projects.${index}.Name`}
                      className="block text-sm font-medium"
                    >
                      Name
                    </label>
                    <input
                      id={`Projects.${index}.Name`}
                      defaultValue={field?.Name}
                      className="w-full p-2 mt-2 rounded-xs bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register(`Projects.${index}.Name`, {
                        required: true,
                      })}
                    />
                  </div>
                  <div className="mb-2">
                    <label
                      htmlFor={`Projects.${index}.Description`}
                      className="block text-sm font-medium"
                    >
                      Description
                    </label>
                    <input
                      defaultValue={field?.Description}
                      id={`Projects.${index}.Name`}
                      className="w-full p-2 mt-2 rounded-xs bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register(`Projects.${index}.Description`, {
                        required: true,
                      })}
                    />
                  </div>
                </div>
              ))}
              {/* Skills */}
              <div className="mb-4">
                <label htmlFor="Skills" className="block text-sm font-medium">
                  Skills
                </label>
                <input
                  {...register("Skills", { required: true })}
                  id="Skills"
                  className="w-full p-2 mt-2 rounded-xs bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={parsedData.Skills.join(", ")}
                />
              </div>

              {/* Education Fields */}
              <div className="mb-4">
                <label
                  htmlFor="Education.Institution"
                  className="block text-sm font-medium"
                >
                  Institution
                </label>
                <input
                  {...register("Education.Institution", { required: true })}
                  id="Education.Institution"
                  className="w-full p-2 mt-2 rounded-xs bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={parsedData.Education.Institution}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="Education.Degree"
                  className="block text-sm font-medium"
                >
                  Degree
                </label>
                <input
                  {...register("Education.Degree", { required: true })}
                  id="Education.Degree"
                  className="w-full p-2 mt-2 rounded-xs bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={parsedData.Education.Degree}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="Education.Duration"
                  className="block text-sm font-medium"
                >
                  Duration
                </label>
                <input
                  {...register("Education.Duration", { required: true })}
                  id="Education.Duration"
                  className="w-full p-2 mt-2 rounded-xs bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={parsedData.Education.Duration}
                />
              </div>
            </form>
          ) : (
            <p className="text-center">
              {loading
                ? "Loading Employee Details..."
                : "Upload Resume to extract employee details"}
            </p>
          )}
        </div>
      </div>

      {/* Right Side (Job Listings) */}
      <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-lg extracted-Job-data-section">
        <h1 className="text-2xl font-bold mb-4 pl-6 pr-6 sticky top-0 bg-gray-900 z-10 shadow-md py-2">
          Recommended Jobs
        </h1>

        {/* Skills as buttons */}
        {parsedData ? (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {userSkillsSet?.map((skill, index) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={index}
                    onClick={() => handleSkillClick(skill)}
                    className={`py-2 px-4 rounded-lg shadow-md transition-all ${
                      isSelected
                        ? "bg-orange-400 text-white"
                        : "bg-orange-700 text-white"
                    } hover:bg-orange-500`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>

            {/* Job Listings - Scrollable */}
            <div
              // ref={jobsSectionRef}
              className="overflow-y-auto overflow-x-hidden h-[60vh] space-y-4 scrollbar-color"
            >
              {jobsData?.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="bg-gray-700 p-4 rounded-lg shadow-lg transition-transform transform hover:scale-102"
                  >
                    <h5 className="text-xl font-semibold text-white mb-2">
                      {item.title}
                    </h5>
                    <h6 className="text-lg text-gray-400 mb-2">
                      {item.company.display_name}
                    </h6>
                    <p className="text-sm text-gray-300 mb-2">
                      {item.description}
                    </p>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{item.location.display_name}</span>
                      <span>{item.contract_type}</span>
                    </div>
                    <a
                      href={item.redirect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-blue-500 hover:underline"
                    >
                      Apply Here
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="py-2 px-4 bg-blue-500 text-white rounded-lg disabled:bg-gray-500"
              >
                Previous
              </button>
              <span className="mx-4 text-white">{currentPage}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={jobsData.length < jobsPerPage}
                className="py-2 px-4 bg-blue-500 text-white rounded-lg disabled:bg-gray-500"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-white">
            {loading
              ? "Fetching Recommended Jobs..."
              : "Upload Resume to get Recommended Jobs"}
          </p>
        )}
      </div>
    </div>
  );
}
