// ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, info) {
    console.error("Error caught by ErrorBoundary:", error, info);
    // Optionally log error to an external service here.
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
    // Optionally, force a re-render or navigate to a safe page.
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            borderRadius: "5px",
            textAlign: "center",
          }}
        >
          <h2>Something went wrong.</h2>
          <p>{this.state.errorMessage}</p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "10px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
