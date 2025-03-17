import React from "react";

// Define the type for the props
interface ErrorPopupProps {
  errorMessage: string; // error message passed as a string
  onClose: () => void; // onClose function with no return value
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ errorMessage, onClose }) => {
  return (
    <div className="error-popup-overlay">
      <div className="error-popup">
        <h3>Error</h3>
        <p>{errorMessage}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ErrorPopup;
