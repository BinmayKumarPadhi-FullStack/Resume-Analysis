import React, { useState } from "react";
import emailjs from "@emailjs/browser";
const FeedbackForm = ({ closePopup }: { closePopup: () => void }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Validation logic
    if (name === "name") {
      // Check if 'name' contains only letters (a-z, A-Z)
      const isValidName = /^[a-zA-Z\s]+$/.test(value);
      if (isValidName || value === "") {
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      }
    }

    if (name === "email") {
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
          }));
      // Check if 'email' matches email pattern
    //   const isValidEmail =
    //     /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    //   if (isValidEmail || value === "") {

    //   }
    }

    if (name === "message") {
      // Check if 'message' contains an email pattern (if you want to check for an email inside the message)
      const isValidMessage =
        /^[A-Za-z0-9_.,?! ]+$/.test(value);
      if (isValidMessage || value === "") {
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // Call your API to save the feedback data if needed
      const apiResponse = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const result = await apiResponse.json();
      const EmailJs_Public_Key = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;
      const EmailJs_Template_Key =
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_KEY!;
      const EmailJs_Service_Id = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;

      if (apiResponse.ok) {
        // Send the email via emailjs
        const emailResult = await emailjs.send(
          EmailJs_Service_Id, // Your service ID
          EmailJs_Template_Key, // Your template ID
          {
            name: formData.name,
            email: formData.email,
            message: formData.message,
          },
          EmailJs_Public_Key // Your public key
        );

        if (emailResult.status === 200) {
          setFormData({ name: "", email: "", message: "" });
          setStatusMessage("Your feedback has been sent successfully!");
          // Close the popup after successful submission
          setTimeout(() => {
            closePopup();
          }, 3000);
        } else {
          setStatusMessage(`Error: ${emailResult.text}`);
        }
      } else {
        setStatusMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatusMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-form-container">
      <h1>Feedback</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          className="feedback-input"
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          aria-label="Name"
        />

        <label htmlFor="email">Email</label>
        <input
          className="feedback-input"
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
          aria-label="Email"
        />

        <label htmlFor="message">Message</label>
        <textarea
          className="feedback-textarea scrollbar-color"
          name="message"
          id="message"
          value={formData.message}
          onChange={handleChange}
          required
          aria-label="Message"
        />

        <div className="feedback-button-section">
          <button
            className="feedback-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
      <p className="feedback-popup-status">{statusMessage}</p>
    </div>
  );
};

export default FeedbackForm;
