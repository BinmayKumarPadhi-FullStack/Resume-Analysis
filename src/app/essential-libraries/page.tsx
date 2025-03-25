"use client";

import { useState } from "react";
import { LayoutGrid, Mail, ChevronDown, Code2, BookOpen } from "lucide-react"; //Frame, Box,
import Sidebar from "../components/sidebar";
import FeedbackForm from "../components/FeedbackForm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import Link from "next/link";

interface Categories {
  category: string;
  libraries: Libraries[];
}
interface Libraries {
  category: string;
  libraryName: string;
  installation: string;
  code: string;
  description: string;
}
interface Technology {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  experience: string;
  category: Categories[];
}

const technologies: Technology[] = [
  {
    id: "react",
    name: "React",
    icon: LayoutGrid,
    description: "A JavaScript library for building user interfaces",
    experience: "4+ years of experience",
    category: [
      {
        category: "UI Components & Design",
        libraries: [
          {
            category: "UI Components & Design",
            libraryName: "lucide-react",
            installation: "npm install lucide-react",
            code: `import { Home, User } from 'lucide-react';

function App() {
  return (
    <div>
      <Home size={48} color="blue" />
      <User size={48} color="green" />
    </div>
  );
}
`,
            description:
              "A collection of customizable icons for React, allowing easy implementation of scalable vector icons.",
          },
          {
            category: "UI Components & Design",
            libraryName: "Material-UI",
            installation:
              "npm install @mui/material @emotion/react @emotion/styled",
            code: `import { Button } from '@mui/material';

function App() {
  return (
    <div>
      <Button variant="contained" color="primary">Click Me</Button>
    </div>
  );
}

`,
            description:
              "A popular React UI framework that implements Material Design components.",
          },
          {
            category: "UI Components & Design",
            libraryName: "React-Bootstrap",
            installation: "npm install react-bootstrap bootstrap",
            code: `import { Button } from 'react-bootstrap';

function App() {
  return (
    <div>
      <Button variant="primary">Primary Button</Button>
    </div>
  );
}
`,
            description:
              "Bootstrap components rebuilt for React, allowing for responsive UI elements.",
          },
        ],
      },
      {
        category: "Form Handling",
        libraries: [
          {
            category: "Form Handling",
            libraryName: "Formik",
            installation: "npm install formik",
            code: `import { Formik, Field, Form } from 'formik';

function App() {
  return (
    <Formik
      initialValues={{ email: '' }}
      onSubmit={(values) => console.log(values)}
    >
      <Form>
        <Field name="email" type="email" placeholder="Enter your email" />
        <button type="submit">Submit</button>
      </Form>
    </Formik>
  );
}

`,
            description:
              "A library for managing forms and handling form validation in React.",
          },
          {
            category: "Form Handling",
            libraryName: "React Hook Form",
            installation: "npm install react-hook-form",
            code: `import { useForm } from 'react-hook-form';

function App() {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  );
}

`,
            description:
              "A simple and performant library for handling forms using React hooks.",
          },
          {
            category: "Form Handling",
            libraryName: "react-dropzone",
            installation: "npm install react-dropzone",
            code: `import { useDropzone } from 'react-dropzone';

function App() {
  const { getRootProps, getInputProps } = useDropzone();

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Drag & drop some files here, or click to select files</p>
    </div>
  );
}

`,
            description:
              "A React library for handling drag-and-drop file uploads.",
          },
        ],
      },
      {
        category: "State Management",
        libraries: [
          {
            category: "State Management",
            libraryName: "Redux",
            installation: "npm install react-redux redux",
            code: `import { createStore } from 'redux';
import { Provider, useDispatch, useSelector } from 'react-redux';

// Reducer
const counter = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
};

const store = createStore(counter);

function App() {
  const count = useSelector((state) => state);
  const dispatch = useDispatch();

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
    </div>
  );
}

export default function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

`,
            description:
              "A predictable state container for JavaScript apps, used for managing state in React applications.",
          },
          {
            category: "State Management",
            libraryName: "Recoil",
            installation: "npm install recoil",
            code: `import { atom, useRecoilState } from 'recoil';

// Create an atom (state)
const countState = atom({
  key: 'countState',
  default: 0,
});

function App() {
  const [count, setCount] = useRecoilState(countState);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}

export default App;

`,
            description:
              "A state management library for React that provides an atomic approach to state.",
          },
        ],
      },
      {
        category: "Data Fetching",
        libraries: [
          {
            category: "Data Fetching",
            libraryName: "React Query",
            installation: "npm install react-query",
            code: `import { useQuery } from 'react-query';

function App() {
  const { data, isLoading } = useQuery('fetchData', () =>
    fetch('https://jsonplaceholder.typicode.com/posts')
      .then((res) => res.json())
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}

`,
            description:
              "A data-fetching and state management library for React, with powerful caching and background refetching.",
          },
          {
            category: "Data Fetching",
            libraryName: "Axios",
            installation: "npm install axios",
            code: `import axios from 'axios';
import { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('https://jsonplaceholder.typicode.com/posts')
      .then((response) => setData(response.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      {data.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}

`,
            description:
              "A promise-based HTTP client for making requests in JavaScript.",
          },
        ],
      },
      {
        category: "Animation & Transitions",
        libraries: [
          {
            category: "Animation & Transitions",
            libraryName: "Framer Motion",
            installation: "npm install framer-motion",
            code: `import { motion } from 'framer-motion';

function App() {
  return (
    <motion.div
      animate={{ scale: 1.2 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Animated Title</h1>
    </motion.div>
  );
}

`,
            description:
              "A React library for animations, allowing declarative animation and transitions.",
          },
          {
            category: "Animation & Transitions",
            libraryName: "React Spring",
            installation: "npm install react-spring",
            code: `import { useSpring, animated } from 'react-spring';

function App() {
  const props = useSpring({
    opacity: 1,
    from: { opacity: 0 },
  });

  return <animated.div style={props}>Animated Text</animated.div>;
}

`,
            description:
              "A spring-based animation library for React to add realistic animations.",
          },
        ],
      },
      {
        category: "PDF Parsing & Handling",
        libraries: [
          {
            category: "PDF Parsing & Handling",
            libraryName: "pdfjs-dist",
            installation: "npm install pdfjs-dist",
            code: `import * as pdfjsLib from "pdfjs-dist";

const loadPDF = async (url) => {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const page = await pdf.getPage(1);  // Get the first page
  const textContent = await page.getTextContent();
  console.log(textContent);
};

loadPDF("sample.pdf");

`,
            description:
              "A library for displaying PDF files in React and parsing them.",
          },
        ],
      },
    ],
  }
];

interface ExpandableSectionProps {
  librariesCategories: Categories[];
  icon?: React.ElementType;
}

function ExpandableSection({
  librariesCategories,
  icon: Icon,
}: ExpandableSectionProps) {
  //   const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Create an array of expansion states for each category
  const [expandedStates, setExpandedStates] = useState<boolean[]>(
    new Array(librariesCategories.length).fill(false)
  );

  const toggleExpanded = (index: number) => {
    setExpandedStates((prev) =>
        prev.map((state, i) => (i === index && index < prev.length ? !state : false))
      );
  };

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="expandable-section">
      {librariesCategories.map((library, index) => (
        <div className="expandable-div" key={index}>
          <div>
            {
              <div
                className="expandable-header"
                onClick={() => toggleExpanded(index)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {Icon && <BookOpen size={16} color="rgba(0, 123, 255, 0.8)"/>}
                  <span>{library?.category}</span>
                </div>
                <ChevronDown
                  className={`chevron ${
                    expandedStates[index] ? "expanded" : ""
                  }`}
                  size={20}
                  color="white"
                />
              </div>
            }
          </div>
          <div
            className={`expandable-content ${
              expandedStates[index] ? "expanded" : ""
            }`}
          >
            <div className="expandable-content-inner">
              {library.libraries.map((library, libraryIndex) => (
                <div key={libraryIndex}>
                  <p className="library-name">{library.libraryName}</p>
                  <p className="library-description">{library.description}</p>
                  <div className="code-header flex justify-between items-center">
                    <span>jsx</span>
                    <button
                      onClick={() => {
                        copyToClipboard(library.installation);
                      }}
                      className="code-copy-btn"
                    >
                      {copied ? (
                        <Check color="white" size={16} />
                      ) : (
                        <Copy color="white" size={16} />
                      )}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language="jsx"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {library.installation}
                  </SyntaxHighlighter>
                  <div className="code-header flex justify-between items-center">
                    <span>jsx</span>
                    <button
                      onClick={() => {
                        copyToClipboard(library.code);
                      }}
                      className="code-copy-btn"
                    >
                      {copied ? (
                        <Check color="white" size={16} />
                      ) : (
                        <Copy color="white" size={16} />
                      )}
                    </button>
                  </div>
                  <div className="code-highlighter">
                    <SyntaxHighlighter
                      language="jsx"
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: "1rem",
                        fontSize: "0.875rem",
                        lineHeight: "1.5",
                      }}
                    >
                      {library.code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EssentialLibraries() {
  //   const [libraries, setLibraries] = useState<Technology[]>([]);
  //   useEffect(() => {
  //     const fetchData = async () => {
  //       const response = await fetch("/data/react-libraries.json");
  //       const data = await response.json();
  //       setLibraries(data);
  //     };

  //     fetchData();
  //   }, []);
  const [selectedTech, setSelectedTech] = useState<Technology>(technologies[0]);
  const [isFeedbackButtonClicked, setIsFeedbackButtonClicked] = useState(false);
  const openFeedbackForm = () => {
    setIsFeedbackButtonClicked(true);
  };
  const closeFeedbackForm = () => {
    setIsFeedbackButtonClicked(false);
  };

  //   const [copied, setCopied] = useState(false);

  //   const copyToClipboard = async (code: string) => {
  //     await navigator.clipboard.writeText(code);
  //     setCopied(true);
  //     setTimeout(() => setCopied(false), 2000);
  //   };

  return (
    <div>
      <div className="header">
        <div className="sidebar-logo-section">
          <Sidebar />
          <Link className="home-link-logo" href={'/resume-analysis'}>
          <h1 className="heading">Syntax Glow</h1>
          </Link>
        </div>
        <div className="feedback-img">
          <Mail onClick={openFeedbackForm} size={20} color="white" />
          {/* <Image
            onClick={openFeedbackForm}
            style={{ cursor: "pointer" }}
            src="/images/feedback-icon.png" // Path to your image in public directory
            alt="download"
            width={20} // Specify width
            height={20} // Specify height
          /> */}
        </div>
      </div>
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

      <div className="libraries-container">
        {/* Sidebar */}
        <div className="libraries-sidebar">
          <div className="libraries-sidebar-header">
            {/* <h2 className="libraries-sidebar-title">Technologies</h2> */}
          </div>
          <div className="libraries-sidebar-content">
            {technologies.map((tech) => (
              <button
                key={tech.id}
                onClick={() => setSelectedTech(tech)}
                className={`tech-button ${
                  selectedTech.id === tech.id ? "active" : ""
                }`}
              >
                {tech.icon && <tech.icon />}
                <span>{tech.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="libraries-card-sections scrollbar-color">
            <ExpandableSection
              librariesCategories={selectedTech.category}
              icon={Code2}
            ></ExpandableSection>
          </div>
        </div>
      </div>
    </div>
  );
}
