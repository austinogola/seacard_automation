const toggle = document.getElementById('toggle');

// Get the current state from storage
chrome.storage.sync.get("enabled", ({ enabled }) => {
  toggle.checked = enabled || false;
});

// Listen for toggle changes
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;

  // Save the state in storage
  chrome.storage.sync.set({ enabled });

  // Notify the background script
  chrome.runtime.sendMessage({ type: "TOGGLE_EXTENSION", enabled });
});
