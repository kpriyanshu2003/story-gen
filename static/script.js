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

    // Text-to-speech properties
    this.speechSynthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.isSpeakerPlaying = false;

    this.initializeElements();
    this.bindEvents();
    this.updateFormValidation();
  }

  initializeElements() {
    this.form = document.getElementById("storyForm");
    this.generateBtn = document.getElementById("generateBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.storyDisplay = document.getElementById("storyDisplay");

    // TTS elements
    this.ttsControls = document.getElementById("ttsControls");
    this.playBtn = document.getElementById("playBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.speakerBtn = document.getElementById("speakerBtn");

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

    // TTS event listeners
    this.playBtn.addEventListener("click", () => this.handlePlayTTS());
    this.pauseBtn.addEventListener("click", () => this.handlePauseTTS());
    this.stopBtn.addEventListener("click", () => this.handleStopTTS());
    this.speakerBtn.addEventListener("click", () => this.handlePlayOnSpeaker());

    // Speech synthesis events
    if (this.speechSynthesis) {
      this.speechSynthesis.addEventListener("voiceschanged", () => {
        this.getAvailableVoices();
      });
    }
  }

  handleInputChange(field, value) {
    this.formData[field] = value;
    this.updateFormValidation();
  }

  updateFormValidation() {
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
      // Get current form values
      const currentFormData = {};
      Object.keys(this.inputs).forEach((key) => {
        currentFormData[key] = this.inputs[key].value.trim();
      });

      const response = await fetch("/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate story");
      }

      this.displayStory(data.story);
    } catch (error) {
      console.error("Error generating story:", error);
      this.showErrorAlert(`Failed to generate story: ${error.message}`);
    } finally {
      this.setLoadingState(false);
    }
  }

  handleReset() {
    // Stop any ongoing speech or speaker playback
    this.handleStopTTS();
    this.handleStopSpeaker();

    // Reset form data
    this.formData = {
      prompt: "",
      genre: "",
      length: "",
      ageGroup: "",
      emotion: "",
    };

    Object.keys(this.inputs).forEach((key) => {
      this.inputs[key].value = "";
    });

    this.generatedStory = "";
    this.displayEmptyState();
    this.updateFormValidation();
  }

  setLoadingState(loading) {
    this.isLoading = loading;
    this.updateFormValidation();

    if (loading) {
      this.generateBtn.innerHTML = `<span>⏳</span> Generating...`;
      this.displayLoadingState();
    } else {
      this.generateBtn.innerHTML = `<span>✨</span> Generate Story`;
    }
  }

  displayEmptyState() {
    if (this.ttsControls) {
      this.ttsControls.style.display = "none";
    }
    this.storyDisplay.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <p>Fill out the form and click "Generate Story" to see your AI-crafted narrative</p>
            </div>
        `;
  }

  displayLoadingState() {
    if (this.ttsControls) {
      this.ttsControls.style.display = "none";
    }
    this.storyDisplay.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Crafting your story...</p>
            </div>
        `;
  }

  displayStory(story) {
    this.generatedStory = story;
    const formattedStory = story.replace(/\n/g, "<br>");

    this.storyDisplay.innerHTML = `
            <div class="story-content" id="storyContent">${formattedStory}</div>
        `;

    // Show TTS controls
    if (this.ttsControls) {
      this.ttsControls.style.display = "flex";
      this.resetTTSControls();
    }
  }

  showErrorAlert(message) {
    if (this.ttsControls) {
      this.ttsControls.style.display = "none";
    }
    this.storyDisplay.innerHTML = `
            <div class="error-state" style="color: #dc2626; text-align: center; padding: 2rem;">
                <p><strong>Error:</strong> ${message}</p>
            </div>
        `;
  }

  // Text-to-Speech Methods
  getAvailableVoices() {
    return this.speechSynthesis ? this.speechSynthesis.getVoices() : [];
  }

  handlePlayTTS() {
    if (!this.generatedStory) return;

    if (this.isPaused && this.currentUtterance) {
      // Resume paused speech
      this.speechSynthesis.resume();
      this.isPaused = false;
      this.updateTTSControls();
      return;
    }

    // Create new utterance
    this.currentUtterance = new SpeechSynthesisUtterance(this.generatedStory);

    // Configure voice settings
    const voices = this.getAvailableVoices();
    const englishVoice = voices.find((voice) => voice.lang.includes("en"));
    if (englishVoice) {
      this.currentUtterance.voice = englishVoice;
    }

    this.currentUtterance.rate = 0.9;
    this.currentUtterance.pitch = 1;
    this.currentUtterance.volume = 1;

    // Event listeners
    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.updateTTSControls();
      this.addSpeakingAnimation();
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.updateTTSControls();
      this.removeSpeakingAnimation();
    };

    this.currentUtterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.updateTTSControls();
      this.removeSpeakingAnimation();
    };

    // Start speaking
    this.speechSynthesis.speak(this.currentUtterance);
  }

  handlePauseTTS() {
    if (this.isSpeaking && !this.isPaused) {
      this.speechSynthesis.pause();
      this.isPaused = true;
      this.updateTTSControls();
    }
  }

  handleStopTTS() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.updateTTSControls();
    this.removeSpeakingAnimation();
  }

  // Speaker API Methods
  async handlePlayOnSpeaker() {
    if (!this.generatedStory) return;

    if (this.isSpeakerPlaying) {
      // If already playing, stop it
      this.handleStopSpeaker();
      return;
    }

    this.setSpeakerLoadingState(true);

    try {
      const response = await fetch("/play-on-speaker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: this.generatedStory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to play on speaker");
      }

      // Handle successful speaker playback
      this.isSpeakerPlaying = true;
      this.addSpeakerAnimation();
      this.updateSpeakerButton();

      // Optional: You can add a timer to reset the state after the estimated playback time
      // or implement a separate endpoint to check playback status
    } catch (error) {
      console.error("Error playing on speaker:", error);
      this.showSpeakerError(`Failed to play on speaker: ${error.message}`);
    } finally {
      this.setSpeakerLoadingState(false);
    }
  }

  handleStopSpeaker() {
    // Make API call to stop speaker playback
    fetch("/stop-speaker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((error) => {
      console.error("Error stopping speaker:", error);
    });

    this.isSpeakerPlaying = false;
    this.removeSpeakerAnimation();
    this.updateSpeakerButton();
  }

  setSpeakerLoadingState(loading) {
    if (!this.speakerBtn) return;

    if (loading) {
      this.speakerBtn.classList.add("loading");
      this.speakerBtn.disabled = true;
      this.speakerBtn.innerHTML = "<span>⏳</span> Connecting...";
    } else {
      this.speakerBtn.classList.remove("loading");
      this.speakerBtn.disabled = false;
      this.updateSpeakerButton();
    }
  }

  updateSpeakerButton() {
    if (!this.speakerBtn) return;

    if (this.isSpeakerPlaying) {
      this.speakerBtn.innerHTML = "<span>⏹️</span> Stop Speaker";
    } else {
      this.speakerBtn.innerHTML = "<span>📢</span> Play on Speaker";
    }
  }

  showSpeakerError(message) {
    // You can implement a toast notification or update UI to show the error
    alert(message); // Simple alert for now, you can enhance this
  }

  updateTTSControls() {
    if (!this.playBtn || !this.pauseBtn || !this.stopBtn) return;

    if (this.isSpeaking && !this.isPaused) {
      this.playBtn.style.display = "none";
      this.pauseBtn.style.display = "flex";
      this.stopBtn.style.display = "flex";
    } else if (this.isPaused) {
      this.playBtn.innerHTML = "<span>▶️</span> Resume";
      this.playBtn.style.display = "flex";
      this.pauseBtn.style.display = "none";
      this.stopBtn.style.display = "flex";
    } else {
      this.playBtn.innerHTML = "<span>🔊</span> Play Story";
      this.playBtn.style.display = "flex";
      this.pauseBtn.style.display = "none";
      this.stopBtn.style.display = "none";
    }
  }

  resetTTSControls() {
    if (!this.playBtn || !this.pauseBtn || !this.stopBtn) return;

    this.playBtn.innerHTML = "<span>🔊</span> Play Story";
    this.playBtn.style.display = "flex";
    this.pauseBtn.style.display = "none";
    this.stopBtn.style.display = "none";
    this.updateSpeakerButton();
  }

  addSpeakingAnimation() {
    const storyContent = document.getElementById("storyContent");
    if (storyContent) {
      storyContent.classList.add("speaking");
    }
  }

  removeSpeakingAnimation() {
    const storyContent = document.getElementById("storyContent");
    if (storyContent) {
      storyContent.classList.remove("speaking");
    }
  }

  addSpeakerAnimation() {
    const storyContent = document.getElementById("storyContent");
    if (storyContent) {
      storyContent.classList.add("speaker-playing");
    }
  }

  removeSpeakerAnimation() {
    const storyContent = document.getElementById("storyContent");
    if (storyContent) {
      storyContent.classList.remove("speaker-playing");
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new StoryGenerator();
});
