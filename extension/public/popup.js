document.addEventListener("DOMContentLoaded", function () {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const saveButton = document.getElementById("save");

    // Load existing credentials
    chrome.storage.sync.get(["SEAusername", "SEApassword"], function (data) {
        if (data.SEAusername) usernameInput.value = data.SEAusername;
        if (data.SEApassword) passwordInput.value = data.SEApassword;
    });

    // Save credentials when button is clicked
    saveButton.addEventListener("click", function () {
        const SEAusername = usernameInput.value;
        const SEApassword = passwordInput.value;

        chrome.storage.sync.set({ SEAusername, SEApassword }, function () {
            alert("Credentials saved!");
        });
    });
});
