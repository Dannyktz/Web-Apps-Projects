/**
 * @file script.js
 * Displays a styled popup message instead of using alert().
 * @param {string} message - The message to display.
 * @param {boolean} [isSuccess=false] - Whether to show the popup as a success (green).
 */
function showPopup(message, isSuccess = false) {
  const popup = document.getElementById("popupMessage");
  const popupText = document.getElementById("popupText");

  popupText.textContent = message;
  popup.className = `popup ${isSuccess ? "success" : ""} show`;

  setTimeout(() => {
    popup.className = "popup"; // Hide popup after 3 seconds
  }, 3000);
}

/**
 * @file script.js
 * Displays an error message below a specific form field.
 * @param {string} id - The ID of the element where the message will be shown.
 * @param {string} message - The error message to display.
 */
function showError(id, message) {
  document.getElementById(id).textContent = message;
}

/**
 * @file script.js
 * Clears all error messages from fields that use the "error-message" class.
 */
function clearErrors() {
  document
    .querySelectorAll(".error-message")
    .forEach((e) => (e.textContent = ""));
}

/**
 * @file script.js
 * Validates a password based on common strength rules.
 * @param {string} password - The password to validate.
 * @returns {string} An error message if validation fails, otherwise an empty string.
 */
function validatePassword(password) {
  const minLength = 8;
  const specialCharRegex = /[!@#$%^&*()_+[\]{}|;:'",.<>?/\\]/;
  const uppercaseRegex = /[A-Z]/;
  const numberRegex = /[0-9]/;

  if (password.length < minLength)
    return "Password must be at least 8 characters.";
  if (!specialCharRegex.test(password))
    return "Must include at least one special character.";
  if (!uppercaseRegex.test(password))
    return "Must include at least one uppercase letter.";
  if (!numberRegex.test(password)) return "Must include at least one number.";

  return "";
}

/**
 * @file script.js
 * Handles the user registration process.
 * Validates form inputs and calls the backend API to register the user.
 * If successful, logs in the user automatically.
 * @async
 */
async function register() {
  clearErrors(); // Remove previous errors

  const email = document.getElementById("email").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document
    .getElementById("confirm-password")
    .value.trim();

  let hasError = false;

  if (!email) {
    showError("emailError", "Email is required.");
    hasError = true;
  }
  if (!username || username.length < 5) {
    showError("usernameError", "Username must be at least 5 characters.");
    hasError = true;
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    showError("passwordError", passwordError);
    hasError = true;
  }
  if (password !== confirmPassword) {
    showError("confirmPasswordError", "Passwords do not match.");
    hasError = true;
  }

  if (hasError) return; // Stop submission if errors exist

  const response = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });

  const data = await response.json();

  if (response.ok) {
    // Auto-login user after successful registration
    localStorage.setItem("loggedInUser", JSON.stringify({ username, email }));
    showPopup("Registration successful! Logging in...", true);
    setTimeout(() => (window.location.href = "index.html"), 2000);
  } else {
    showPopup(data.msg || "Error registering user.");
  }
}

/**
 * @file script.js
 * Handles the login process by verifying credentials with the backend.
 * Stores the user session in localStorage if successful.
 * @async
 */
async function login() {
  const loginInput = document.getElementById("loginInput").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!loginInput || !password) {
    showPopup("Please fill in all fields.");
    return;
  }

  console.log("Sending Login Request:", { loginInput, password }); // Debugging

  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginInput, password }),
  });

  const data = await response.json();
  console.log("Server Response:", data); // Debugging

  if (response.ok) {
    localStorage.setItem("loggedInUser", JSON.stringify(data.user));
    window.location.href = "index.html";
  } else {
    showPopup(data.msg || "Login failed.");
  }
}

/**
 * @file script.js
 * Dynamically inserts a password reset form into the account settings page.
 */
function resetPassword() {
    
    if (document.getElementById('currentPassword')){
        return
    }
  const container = document.querySelector(".settings-section-account");

  const form = document.createElement("div");
  form.id = "resetPasswordForm";
  form.style.marginTop = "15px";

  form.innerHTML = `
        <h3>🔐 Change Password</h3>

        <div class="settings-row">
        <label>Current Password</label>
        <div style="position: relative;">
            <input type="password" id="currentPassword" />
            <span onclick="togglePassword('currentPassword', this)" style="position:right; right:10px; top:50%; transform:translateY(-50%); cursor:pointer;">👁️</span>
        </div>
        </div>

        <div class="settings-row">
        <label>New Password</label>
        <div style="position: relative;">
            <input type="password" id="newPassword" />
            <span onclick="togglePassword('newPassword', this)" style="position:right; right:10px; top:50%; transform:translateY(-50%); cursor:pointer;">👁️</span>
        </div>
        </div>

        <div class="settings-row">
        <label>Confirm New Password</label>
        <div style="position: relative;">
            <input type="password" id="confirmNewPassword" />
            <span onclick="togglePassword('confirmNewPassword', this)" style="position:right; right:10px; top:50%; transform:translateY(-50%); cursor:pointer;">👁️</span>
        </div>
        </div>

<button onclick="submitPasswordReset()">Update Password</button>
    `;

  container.appendChild(form);
}
/**
 * @file script.js
 * Toggles the visibility of a password input field.
 * @param {string} inputId - The ID of the input field to toggle.
 * @param {HTMLElement} toggleEl - The element that was clicked to trigger the toggle.
 */
function togglePassword(inputId, toggleEl) {
    const input = document.getElementById(inputId);
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggleEl.textContent = isPassword ? "🙈" : "👁️";
  }
  
/**
 * @file script.js
 * Submits a password reset request to the backend.
 * Validates current and new passwords before sending.
 * @async
 */
async function submitPasswordReset() {
  const currentPassword = document
    .getElementById("currentPassword")
    .value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmNewPassword = document
    .getElementById("confirmNewPassword")
    .value.trim();
  console.log(currentPassword);
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showPopup("Please fill in all fields.");
    return;
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    showPopup(passwordError);
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showPopup("New passwords do not match.");
    return;
  }

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const response = await fetch(
    "http://localhost:5000/api/auth/reset-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        currentPassword,
        newPassword,
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    showPopup("Password updated successfully!", true);
    document.getElementById("resetPasswordForm").remove();
  } else {
    showPopup(data.msg || "Failed to reset password.");
  }
}

/**
 * @file script.js
 * Checks if a user session is active and redirects to login page if not.
 * Also displays username on pages that support it.
 */
function loadUserSession() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  // Avoid redirect loop on login/register pages
  const currentPage = window.location.pathname;
  const isAuthPage =
    currentPage.includes("login.html") || currentPage.includes("register.html");

  if (!user && !isAuthPage) {
    window.location.href = "login.html";
  }

  if (user && document.getElementById("userName")) {
    document.getElementById("userName").textContent = user.username + " ▼";
  }
}

/**
 * @file script.js
 * Logs the user out by clearing their session and redirecting to login page.
 */
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

//Run session check when the page is fully loaded
document.addEventListener("DOMContentLoaded", loadUserSession);

