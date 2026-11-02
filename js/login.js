const form = document.getElementById("form-login");
const usernameInput = document.getElementById("username-input");
const status = document.getElementById("login-status");
 
try {
    const profile = JSON.parse(localStorage.getItem("soundspace-profile") || "null");
    if (profile?.name) usernameInput.value = profile.name;
} catch {
    // Start with an empty form when saved local data cannot be read.
}
 
form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = usernameInput.value.trim();
    if (!name) return;
    try {
        localStorage.setItem("soundspace-profile", JSON.stringify({name}));
        status.textContent = `Signed in as ${name}. Returning to Soundspace…`;
        status.hidden = false;
        window.setTimeout(() => { window.location.href = "index.html"; }, 500);
    } catch {
        status.textContent = "Could not save this sign-in on this device.";
        status.hidden = false;
    }
});
 
