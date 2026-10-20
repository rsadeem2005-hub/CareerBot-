// ========================================
// CAREERBOT — SUPABASE AUTHENTICATION
// ========================================

console.log("CareerBot auth.js loaded");


// ========================================
// SHOW LOGIN
// ========================================

function showLogin() {

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    const loginTab =
        document.getElementById("loginTab");

    const signupTab =
        document.getElementById("signupTab");


    if (
        !loginForm ||
        !signupForm ||
        !loginTab ||
        !signupTab
    ) {

        console.error(
            "Login/Signup elements not found"
        );

        return;
    }


    loginForm.classList.remove("hidden");

    signupForm.classList.add("hidden");

    loginTab.classList.add("active");

    signupTab.classList.remove("active");
}


// ========================================
// SHOW SIGN UP
// ========================================

function showSignup() {

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    const loginTab =
        document.getElementById("loginTab");

    const signupTab =
        document.getElementById("signupTab");


    if (
        !loginForm ||
        !signupForm ||
        !loginTab ||
        !signupTab
    ) {

        console.error(
            "Login/Signup elements not found"
        );

        return;
    }


    loginForm.classList.add("hidden");

    signupForm.classList.remove("hidden");

    loginTab.classList.remove("active");

    signupTab.classList.add("active");
}


// ========================================
// SHOW / HIDE PASSWORD
// ========================================

function togglePassword(id) {

    const passwordInput =
        document.getElementById(id);


    if (!passwordInput) {

        console.error(
            "Password field not found:",
            id
        );

        return;
    }


    if (
        passwordInput.type === "password"
    ) {

        passwordInput.type = "text";

    } else {

        passwordInput.type = "password";

    }
}


// ========================================
// LOGIN USER
// ========================================

async function loginUser(event) {

    event.preventDefault();


    const emailInput =
        document.getElementById("loginEmail");

    const passwordInput =
        document.getElementById("loginPassword");


    if (
        !emailInput ||
        !passwordInput
    ) {

        console.error(
            "Login fields not found"
        );

        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (!email || !password) {

        showPopup(
            "Please enter your email and password."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#loginForm .auth-submit"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.style.opacity = "0.7";

        submitButton.style.pointerEvents =
            "none";
    }


    try {

        console.log(
            "Attempting Supabase login..."
        );


        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (error) {

            console.error(
                "Supabase login error:",
                error
            );

            showPopup(
                getAuthErrorMessage(error)
            );

            return;
        }


        if (!data || !data.user) {

            showPopup(
                "Login could not be completed."
            );

            return;
        }


        // --------------------------------
        // Save basic display information
        // --------------------------------

        localStorage.setItem(
            "careerbotEmail",
            data.user.email || email
        );


        const firstName =
            data.user.user_metadata?.first_name ||
            data.user.user_metadata?.firstName ||
            "";


        const lastName =
            data.user.user_metadata?.last_name ||
            data.user.user_metadata?.lastName ||
            "";


        const fullName =
            `${firstName} ${lastName}`.trim();


        if (fullName) {

            localStorage.setItem(
                "careerbotName",
                fullName
            );

        }


        // --------------------------------
        // Login successful
        // --------------------------------

        showPopup(
            "Login successful!",
            "dashboard.html"
        );


    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        showPopup(
            "Something went wrong. Please try again."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.style.opacity = "1";

            submitButton.style.pointerEvents =
                "auto";
        }

    }
}


// ========================================
// SIGN UP USER
// ========================================

async function signupUser(event) {

    event.preventDefault();


    const firstNameInput =
        document.getElementById("firstName");

    const lastNameInput =
        document.getElementById("lastName");

    const emailInput =
        document.getElementById("signupEmail");

    const passwordInput =
        document.getElementById("signupPassword");


    if (
        !firstNameInput ||
        !lastNameInput ||
        !emailInput ||
        !passwordInput
    ) {

        console.error(
            "Signup fields not found"
        );

        return;
    }


    const firstName =
        firstNameInput.value.trim();

    const lastName =
        lastNameInput.value.trim();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    if (
        !firstName ||
        !lastName ||
        !email ||
        !password
    ) {

        showPopup(
            "Please complete all required fields."
        );

        return;
    }


    if (password.length < 6) {

        showPopup(
            "Password must contain at least 6 characters."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#signupForm .auth-submit"
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.style.opacity = "0.7";

        submitButton.style.pointerEvents =
            "none";
    }


    try {

        console.log(
            "Creating Supabase account..."
        );


        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        first_name: firstName,

                        last_name: lastName,

                        full_name:
                            `${firstName} ${lastName}`

                    }

                }

            });


        if (error) {

            console.error(
                "Supabase signup error:",
                error
            );

            showPopup(
                getAuthErrorMessage(error)
            );

            return;
        }


        // --------------------------------
        // Save basic local display data
        // --------------------------------

        localStorage.setItem(
            "careerbotName",
            `${firstName} ${lastName}`
        );


        localStorage.setItem(
            "careerbotEmail",
            email
        );


        // --------------------------------
        // Check whether a session exists
        // --------------------------------

        if (data && data.session) {

            showPopup(
                "Account created successfully!",
                "profile.html"
            );

        } else {

            /*
            If Supabase email confirmation
            is enabled, there will be no
            session yet.

            The user must confirm their
            email before logging in.
            */

            showPopup(
                "Account created! Please check your email to confirm your account."
            );

        }


    } catch (error) {

        console.error(
            "Unexpected signup error:",
            error
        );

        showPopup(
            "Something went wrong. Please try again."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled = false;

            submitButton.style.opacity = "1";

            submitButton.style.pointerEvents =
                "auto";
        }

    }
}


// ========================================
// AUTH ERROR MESSAGES
// ========================================

function getAuthErrorMessage(error) {

    if (!error) {

        return "Authentication failed.";
    }


    const message =
        String(
            error.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";
    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "Please confirm your email before logging in.";
    }


    if (
        message.includes(
            "user already registered"
        )
    ) {

        return "An account with this email already exists.";
    }


    if (
        message.includes(
            "password should be at least"
        )
    ) {

        return "Your password is too short.";
    }


    if (
        message.includes(
            "invalid email"
        )
    ) {

        return "Please enter a valid email address.";
    }


    if (
        message.includes(
            "rate limit"
        )
    ) {

        return "Too many attempts. Please wait and try again.";
    }


    return (
        error.message ||
        "Authentication failed. Please try again."
    );
}


// ========================================
// SUCCESS / ERROR POPUP
// ========================================

function showPopup(
    message,
    redirectPage = null
) {

    const popup =
        document.getElementById(
            "successPopup"
        );

    const popupMessage =
        document.getElementById(
            "popupMessage"
        );


    /*
    If popup elements do not exist,
    don't use alert().
    */

    if (
        !popup ||
        !popupMessage
    ) {

        console.warn(
            "Popup elements not found:",
            message
        );

        if (redirectPage) {

            setTimeout(() => {

                window.location.href =
                    redirectPage;

            }, 1000);

        }

        return;
    }


    popupMessage.textContent =
        message;

    popup.classList.add("show");


    if (redirectPage) {

        setTimeout(() => {

            window.location.href =
                redirectPage;

        }, 1500);

    } else {

        /*
        Automatically hide messages
        that do not redirect.
        */

        setTimeout(() => {

            popup.classList.remove("show");

        }, 3500);

    }
}


// ========================================
// CHECK CURRENT AUTH SESSION
// ========================================

async function checkCurrentSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session check failed:",
                error
            );

            return null;
        }


        return data.session;


    } catch (error) {

        console.error(
            "Session check error:",
            error
        );

        return null;
    }
}


// ========================================
// PAGE LOADED
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "CareerBot authentication page loaded"
        );


        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "Supabase client is not available."
            );

            showPopup(
                "Supabase connection could not be loaded."
            );

            return;
        }


        const session =
            await checkCurrentSession();


        if (session) {

            console.log(
                "Existing Supabase session found."
            );

        } else {

            console.log(
                "No active Supabase session."
            );

        }

    }
);