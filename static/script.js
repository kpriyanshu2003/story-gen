class StoryGenerator {
  constructor() {
    this.formData = {
      prompt: "",
      genre: "",
      length: "",
      ageGroup: "",
      emotion: "",
    };

    this.isLoading = false;
    this.generatedStory = "";

    this.initializeElements();
    this.bindEvents();
    this.updateFormValidation();
  }

  initializeElements() {
    this.form = document.getElementById("storyForm");
    this.generateBtn = document.getElementById("generateBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.storyDisplay = document.getElementById("storyDisplay");

    this.inputs = {
      prompt: document.getElementById("prompt"),
      genre: document.getElementById("genre"),
      length: document.getElementById("length"),
      ageGroup: document.getElementById("ageGroup"),
      emotion: document.getElementById("emotion"),
    };
  }

  bindEvents() {
    // Form submission
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));

    // Reset button
    this.resetBtn.addEventListener("click", () => this.handleReset());

    // Input validation
    Object.keys(this.inputs).forEach((key) => {
      this.inputs[key].addEventListener("input", (e) => {
        this.handleInputChange(key, e.target.value);
      });
    });
  }

  handleInputChange(field, value) {
    this.formData[field] = value;
    this.updateFormValidation();
  }

  updateFormValidation() {
    // Check actual input values instead of formData object
    const isFormValid = Object.values(this.inputs).every(
      (input) => input.value.trim() !== ""
    );
    this.generateBtn.disabled = !isFormValid || this.isLoading;
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (this.isLoading) return;

    this.setLoadingState(true);

    try {
      // Make API call to Flask backend
      const response = await fetch("/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate story");
      }

      // Display the generated story
      this.displayStory(data.story);
    } catch (error) {
      console.error("Error generating story:", error);
      this.showErrorAlert(`Failed to generate story: ${error.message}`);
    } finally {
      this.setLoadingState(false);
    }
  }

  handleReset() {
    // Reset form data
    this.formData = {
      prompt: "",
      genre: "",
      length: "",
      ageGroup: "",
      emotion: "",
    };

    // Reset form inputs
    Object.keys(this.inputs).forEach((key) => {
      this.inputs[key].value = "";
    });

    // Reset story display
    this.generatedStory = "";
    this.displayEmptyState();

    // Update form validation
    this.updateFormValidation();
  }

  setLoadingState(loading) {
    this.isLoading = loading;
    this.updateFormValidation();

    if (loading) {
      this.generateBtn.innerHTML = `
        <div class="loading-spinner"></div>
        Generating...
      `;
      this.displayLoadingState();
    } else {
      this.generateBtn.innerHTML = `
        <span class="btn-icon">✨</span>
        Generate Story
      `;
    }
  }

  displayEmptyState() {
    this.storyDisplay.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <p>Fill out the form and click "Generate Story" to see your AI-crafted narrative</p>
      </div>
    `;
  }

  displayLoadingState() {
    this.storyDisplay.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p style="color: #6b7280;">Crafting your story...</p>
      </div>
    `;
  }

  displayStory(story) {
    this.generatedStory = story;
    this.storyDisplay.innerHTML = `
      <div class="story-content">${story
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br>")}</div>
    `;
  }

  displayError(message) {
    this.storyDisplay.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p style="color: #ef4444;">${message}</p>
      </div>
    `;
  }

  showErrorAlert(message) {
    // Create alert overlay
    const alertOverlay = document.createElement("div");
    alertOverlay.className = "alert-overlay";
    alertOverlay.innerHTML = `
      <div class="alert-box">
        <div class="alert-icon">⚠️</div>
        <h3 class="alert-title">Error</h3>
        <p class="alert-message">${message}</p>
        <button class="alert-button" onclick="this.parentElement.parentElement.remove()">
          OK
        </button>
      </div>
    `;

    // Add styles if not already added
    if (!document.getElementById("alert-styles")) {
      const alertStyles = document.createElement("style");
      alertStyles.id = "alert-styles";
      alertStyles.textContent = `
        .alert-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .alert-box {
          background: #f0e6d6;
          box-shadow: 8px 8px 16px rgba(139, 69, 19, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.7);
          border-radius: 16px;
          padding: 2rem;
          max-width: 400px;
          text-align: center;
        }
        .alert-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .alert-title {
          font-family: "Playfair Display", serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d2d2d;
          margin-bottom: 1rem;
        }
        .alert-message {
          color: #ef4444;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        .alert-button {
          background: #d97706;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.75rem 2rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 8px 8px 16px rgba(139, 69, 19, 0.15), -8px -8px 16px rgba(255, 255, 255, 0.7);
          transition: all 0.2s ease;
        }
        .alert-button:hover {
          box-shadow: 12px 12px 24px rgba(139, 69, 19, 0.2), -12px -12px 24px rgba(255, 255, 255, 0.8);
          transform: translateY(-2px);
        }
      `;
      document.head.appendChild(alertStyles);
    }

    document.body.appendChild(alertOverlay);

    // Auto-close after 5 seconds
    setTimeout(() => {
      if (alertOverlay.parentElement) {
        alertOverlay.remove();
      }
    }, 5000);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new StoryGenerator();
});
