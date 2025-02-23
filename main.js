/* main.js */

document.addEventListener("DOMContentLoaded", () => {
  // Retrieve saved data from local storage
  let cycles = JSON.parse(localStorage.getItem("cycles")) || [];
  let forumPosts = JSON.parse(localStorage.getItem("forumPosts")) || [];
  const discreetPassword = "cyclecare"; // Demo password; in production, secure this appropriately.
  
  // DOM Elements
  const cycleForm = document.getElementById("cycleForm");
  const cycleList = document.getElementById("cycleList");
  const predictionOutput = document.getElementById("predictionOutput");
  const healthOutput = document.getElementById("healthOutput");
  const remedyOutput = document.getElementById("remedyOutput");
  const forumForm = document.getElementById("forumForm");
  const forumPostsDiv = document.getElementById("forumPosts");
  const toggleLanguageBtn = document.getElementById("toggleLanguage");
  const discreetModeToggle = document.getElementById("discreetModeToggle");
  const discreetModal = document.getElementById("discreetModal");
  const discreetSubmit = document.getElementById("discreetSubmit");
  const discreetPasswordInput = document.getElementById("discreetPassword");

  // Initialize the app display
  displayCycles();
  displayForumPosts();
  updatePredictions();
  updateHealthIndicators();
  updateRemedies();

  // Handle cycle logging
  cycleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }
    cycles.push({ start: startDate, end: endDate });
    localStorage.setItem("cycles", JSON.stringify(cycles));
    cycleForm.reset();
    displayCycles();
    updatePredictions();
    updateHealthIndicators();
  });

  // Display logged cycles
  function displayCycles() {
    cycleList.innerHTML = "";
    if (cycles.length === 0) {
      cycleList.innerHTML = "<p>No cycles logged yet.</p>";
      return;
    }
    cycles.forEach((cycle, index) => {
      const cycleDiv = document.createElement("div");
      cycleDiv.classList.add("cycle-entry");
      cycleDiv.innerHTML = `<p><strong>Cycle ${index + 1}:</strong> ${cycle.start} to ${cycle.end}</p>`;
      cycleList.appendChild(cycleDiv);
    });
  }

  // Prediction Algorithm
  function updatePredictions() {
    if (cycles.length < 2) {
      predictionOutput.innerHTML = "<p>Not enough data to predict. Log at least two cycles.</p>";
      return;
    }
    // Compute cycle lengths (in days)
    let lengths = cycles.map(cycle => {
      const diffTime = Math.abs(new Date(cycle.end) - new Date(cycle.start));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    });
    
    // Weighted average: newer cycles are given higher weight.
    let totalWeight = 0, weightedSum = 0;
    lengths.forEach((len, idx) => {
      let weight = idx + 1; // Increasing weight for recent cycles
      weightedSum += len * weight;
      totalWeight += weight;
    });
    const avgCycleLength = Math.round(weightedSum / totalWeight);
    
    // Predict next cycle start based on the last logged cycle's start date.
    const lastCycle = cycles[cycles.length - 1];
    const lastStart = new Date(lastCycle.start);
    const nextCycleStart = new Date(lastStart);
    nextCycleStart.setDate(nextCycleStart.getDate() + avgCycleLength);
    
    // Ovulation estimation: approximately 14 days before next cycle with ±2 days window.
    const ovulationDate = new Date(nextCycleStart);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    const ovulationWindowStart = new Date(ovulationDate);
    ovulationWindowStart.setDate(ovulationDate.getDate() - 2);
    const ovulationWindowEnd = new Date(ovulationDate);
    ovulationWindowEnd.setDate(ovulationDate.getDate() + 2);
    
    // Simplified cycle phase breakdown
    const follicularPhase = { start: lastStart.toISOString().split("T")[0], end: ovulationWindowStart.toISOString().split("T")[0] };
    const ovulationPhase = { start: ovulationWindowStart.toISOString().split("T")[0], end: ovulationWindowEnd.toISOString().split("T")[0] };
    const lutealPhase = { start: ovulationWindowEnd.toISOString().split("T")[0], end: nextCycleStart.toISOString().split("T")[0] };

    predictionOutput.innerHTML = `
      <p><strong>Average Cycle Length:</strong> ${avgCycleLength} days</p>
      <p><strong>Next Cycle Predicted Start:</strong> ${nextCycleStart.toISOString().split("T")[0]}</p>
      <p><strong>Ovulation Window:</strong> ${ovulationWindowStart.toISOString().split("T")[0]} to ${ovulationWindowEnd.toISOString().split("T")[0]}</p>
      <p><strong>Phases:</strong></p>
      <ul>
        <li>Follicular: ${follicularPhase.start} to ${follicularPhase.end}</li>
        <li>Ovulation: ${ovulationPhase.start} to ${ovulationPhase.end}</li>
        <li>Luteal: ${lutealPhase.start} to ${lutealPhase.end}</li>
      </ul>
    `;

    // Safety check-in: alert on predicted PMS day (last day of current cycle)
    const today = new Date().toISOString().split("T")[0];
    if (today === lastCycle.end) {
      alert("Safety Check: Today is predicted PMS day. Please take care and consider a wellness check-in.");
    }
  }

  // Health Status Indicators (WHO standards: cycle length 21-35 days, period duration 2-7 days)
  function updateHealthIndicators() {
    if (cycles.length === 0) {
      healthOutput.innerHTML = "<p>No cycle data available.</p>";
      return;
    }
    const lastCycle = cycles[cycles.length - 1];
    const diffTime = Math.abs(new Date(lastCycle.end) - new Date(lastCycle.start));
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    // For demonstration, we assume the logged cycle length is the full cycle.
    const cycleLength = duration;
    let message = "";
    if (cycleLength < 21 || cycleLength > 35) {
      message = "Your cycle length is outside the typical range (21-35 days). Consider consulting a healthcare provider.";
    } else if (duration < 2 || duration > 7) {
      message = "Your period duration is outside the typical range (2-7 days). Consider consulting a healthcare provider.";
    } else {
      message = "Your cycle appears to be within healthy norms.";
    }
    healthOutput.innerHTML = `<p>${message}</p>`;
  }

  // Update Ayurvedic Remedies & Yoga Suggestions
  function updateRemedies() {
    remedyOutput.innerHTML = `
      <h3>Ayurvedic Remedies</h3>
      <ul>
        <li>Drink warm ginger tea with a pinch of turmeric.</li>
        <li>Include ashwagandha and cinnamon in your diet.</li>
      </ul>
      <h3>Saree-Friendly Yoga Poses</h3>
      <ul>
        <li>Seated Forward Bend</li>
        <li>Child's Pose</li>
        <li>Cat-Cow Stretch</li>
      </ul>
    `;
  }

  // Community Forum Posting
  forumForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = document.getElementById("forumMessage").value;
    const post = { message: message, timestamp: new Date().toISOString() };
    forumPosts.push(post);
    localStorage.setItem("forumPosts", JSON.stringify(forumPosts));
    document.getElementById("forumMessage").value = "";
    displayForumPosts();
  });

  function displayForumPosts() {
    forumPostsDiv.innerHTML = "";
    if (forumPosts.length === 0) {
      forumPostsDiv.innerHTML = "<p>No posts yet.</p>";
      return;
    }
    forumPosts.slice().reverse().forEach(post => {
      const postDiv = document.createElement("div");
      postDiv.classList.add("forum-post");
      postDiv.innerHTML = `<p>${post.message}</p><small>${new Date(post.timestamp).toLocaleString()}</small>`;
      forumPostsDiv.appendChild(postDiv);
    });
  }

  // Regional Language Toggle (simulated using a basic toggle)
  toggleLanguageBtn.addEventListener("click", () => {
    if (toggleLanguageBtn.textContent === "भाषा") {
      // Switch to English
      toggleLanguageBtn.textContent = "Language";
      document.querySelector("h1").textContent = "CycleCare";
    } else {
      // Switch to Hindi (for example)
      toggleLanguageBtn.textContent = "भाषा";
      document.querySelector("h1").textContent = "सायकल केयर";
    }
  });

  // Discreet Mode: show password modal
  discreetModeToggle.addEventListener("click", () => {
    discreetModal.classList.remove("hidden");
  });

  discreetSubmit.addEventListener("click", () => {
    if (discreetPasswordInput.value === discreetPassword) {
      discreetModal.classList.add("hidden");
    } else {
      alert("Incorrect password.");
    }
  });

  // Register Service Worker for PWA offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  }
});
