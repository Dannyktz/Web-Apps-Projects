// Display a popup message instead of using alert()
function showPopup(message, isSuccess = false) {
  const popup = document.getElementById("popupMessage");
  const popupText = document.getElementById("popupText");

  popupText.textContent = message;
  popup.className = `popup ${isSuccess ? "success" : ""} show`;

  setTimeout(() => {
    popup.className = "popup"; // Hide popup after 3 seconds
  }, 3000);
}

// Display error messages below form fields
function showError(id, message) {
  document.getElementById(id).textContent = message;
}

// Clear all previously shown error messages
function clearErrors() {
  document
    .querySelectorAll(".error-message")
    .forEach((e) => (e.textContent = ""));
}

// Validate password strength based on multiple rules
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

// Handles user registration and logs in automatically upon success
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

// Handles user login and stores session in localStorage
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

//  Generates a password reset form dynamically on the account page
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
//Toggles password visibility for input fields
function togglePassword(inputId, toggleEl) {
    const input = document.getElementById(inputId);
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggleEl.textContent = isPassword ? "🙈" : "👁️";
  }
  
//Submits a password reset request to the server after validation
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

//Loads user session and redirects to login page if not logged in
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

//Logs out the user and redirects to login page
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

//Run session check when the page is fully loaded
document.addEventListener("DOMContentLoaded", loadUserSession);

