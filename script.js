/* =====================================
   CAREERBOT LANDING PAGE
===================================== */


/* ===============================
   MOBILE MENU
================================ */

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
        navLinks.classList.toggle("mobile-menu");
    });
}


/* ===============================
   SMOOTH SCROLL
================================ */

const anchorLinks = document.querySelectorAll('a[href^="#"]');

anchorLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {

        const href = this.getAttribute("href");

        if (!href || href === "#") {
            return;
        }

        const target = document.querySelector(href);

        if (target) {
            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});


/* ===============================
   SCROLL REVEAL
================================ */

const revealElements = document.querySelectorAll(
    ".feature-card, .step, .testimonial, .stat, .discover-section, .final-cta"
);

if ("IntersectionObserver" in window) {

    const revealObserver = new IntersectionObserver(
        function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    entry.target.classList.add("visible");

                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1
        }
    );

    revealElements.forEach(function (element) {
        revealObserver.observe(element);
    });

} else {

    revealElements.forEach(function (element) {
        element.classList.add("visible");
    });
}


/* ===============================
   CAREER MATCH ANIMATION
================================ */

const matchBar = document.querySelector(".match-bar div");

if (matchBar) {

    matchBar.style.width = "0%";

    setTimeout(function () {

        matchBar.style.transition = "width 1.5s ease";
        matchBar.style.width = "94%";

    }, 500);
}


/* ===============================
   NAVBAR SCROLL EFFECT
================================ */

const navbar = document.querySelector(".navbar");

if (navbar) {

    window.addEventListener("scroll", function () {

        if (window.scrollY > 30) {

            navbar.style.background = "rgba(251, 252, 249, 0.8)";
            navbar.style.backdropFilter = "blur(18px)";

        } else {

            navbar.style.background = "transparent";
            navbar.style.backdropFilter = "none";
        }
    });
}


/* ===============================
   CLOSE MOBILE MENU
================================ */

if (navLinks) {

    navLinks.querySelectorAll("a").forEach(function (link) {

        link.addEventListener("click", function () {

            navLinks.classList.remove("mobile-menu");

        });
    });
}


/* ===============================
   PAGE LOADED
================================ */

document.addEventListener("DOMContentLoaded", function () {

    document.body.classList.add("page-loaded");

});
/* =====================================
   CAREERBOT — SHARED SUPABASE INTEGRATION
   Database-first flow. Existing filenames/UI are preserved.
===================================== */
(function () {
    "use strict";

    const PRIVATE_PAGES = new Set([
        "profile.html",
        "assessment.html",
        "assessment-form.html",
        "recommendations.html",
        "career-details.html",
        "skill-gap.html",
        "learning-guide.html",
        "project-ideas.html",
        "project-workspace.html",
        "job-recommendations.html",
        "job-details.html",
        "dashboard.html",
        "agent.html"
    ]);

    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();

    async function session() {
        if (!window.supabaseClient) return null;
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return data?.session || null;
    }

    async function requireSession() {
        try {
            const current = await session();
            if (!current) {
                location.replace("login.html");
                return null;
            }
            return current;
        } catch (error) {
            console.error("CareerBot session check failed:", error);
            location.replace("login.html");
            return null;
        }
    }

    async function invoke(name, body = {}) {
        const current = await requireSession();
        if (!current) throw new Error("Your session has expired. Please log in again.");
        const { data, error } = await supabaseClient.functions.invoke(name, {
            body: { ...body, user_id: current.user.id }
        });
        if (error) throw error;
        return data;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function safeExternalURL(value) {
        try {
            const url = new URL(String(value || ""), location.href);
            return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
        } catch {
            return "#";
        }
    }

    function slugifyCareer(value) {
        const normalized = String(value || "").trim().toLowerCase();
        const map = {
            "software developer": "software-developer",
            "ai / ml engineer": "ai-ml-engineer",
            "ai/ml engineer": "ai-ml-engineer",
            "data analyst": "data-analyst",
            "ui / ux designer": "ui-ux-designer",
            "ui/ux designer": "ui-ux-designer",
            "ux/ui designer": "ui-ux-designer",
            "product manager": "product-manager",
            "human resources specialist": "hr-specialist",
            "hr specialist": "hr-specialist",
            "mobile app developer": "mobile-app-developer",
            "digital marketing specialist": "digital-marketing"
        };
        return map[normalized] || normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    function selectedCareer() {
        const params = new URLSearchParams(location.search);
        return params.get("career") || localStorage.getItem("careerbotSelectedCareer") || "";
    }

    function careerTitleForSlug(slug) {
        const map = {
            "software-developer": "Software Developer",
            "ai-ml-engineer": "AI / ML Engineer",
            "data-analyst": "Data Analyst",
            "ui-ux-designer": "UI / UX Designer",
            "product-manager": "Product Manager",
            "hr-specialist": "Human Resources Specialist",
            "mobile-app-developer": "Mobile App Developer",
            "digital-marketing": "Digital Marketing Specialist"
        };
        return map[slugifyCareer(slug)] || String(slug || "").replace(/-/g, " ");
    }

    function saveCareer(title) {
        const slug = slugifyCareer(title);
        if (slug) localStorage.setItem("careerbotSelectedCareer", slug);
        return slug;
    }

    async function connectProfile() {
        const first = document.getElementById("profileFirstName");
        if (!first) return;
        try {
            const current = await requireSession();
            if (!current) return;
            const { data, error } = await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", current.user.id)
                .maybeSingle();
            if (error) throw error;
            if (!data) return;

            const setValue = (id, value) => {
                const el = document.getElementById(id);
                if (el && value != null) el.value = value;
            };
            setValue("profileFirstName", data.first_name);
            setValue("profileLastName", data.last_name);
            setValue("profilePhone", data.phone);
            setValue("profileLocation", data.location);
            setValue("educationLevel", data.education_level);
            setValue("fieldOfStudy", data.field_of_study);
            setValue("college", data.college);
            setValue("graduationYear", data.graduation_year);
            setValue("workEnvironment", data.work_environment);
            setValue("preferredIndustry", data.preferred_industry);
            setValue("careerGoal", data.career_goal);

            const check = (name, values) => {
                const selected = Array.isArray(values) ? values : [];
                document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
                    el.checked = selected.includes(el.value);
                });
            };
            check("interests", data.interests);
            check("skills", data.skills);
        } catch (error) {
            console.error("Profile load failed:", error);
        }
    }

    async function connectAssessment() {
        // Assessment submission remains in assessment-form.html.
        // This function exists so the shared page guard is consistent.
        return true;
    }

    async function loadRecommendations() {
        const main = document.getElementById("recommendationPage");
        if (!main) return;

        window.__careerbotRecommendationsLoading = true;
        const errorBox = document.getElementById("errorBox");
        main.style.display = "none";
        if (errorBox) {
            errorBox.style.display = "block";
            errorBox.textContent = "Loading your saved career recommendation…";
        }

        try {
            const current = await requireSession();
            if (!current) return;

            const { data, error } = await supabaseClient
                .from("career_recommendations")
                .select("*")
                .eq("user_id", current.user.id)
                .order("match_score", { ascending: false });

            if (error) console.warn("Saved career recommendations are unavailable; checking the latest assessment result.", error);

            const rows = data || [];
            const preferredSlug = localStorage.getItem("careerbotRecommendedCareer");
            let cachedRecommendation = null;
            try {
                const cached = JSON.parse(localStorage.getItem("careerbotLatestRecommendation") || "null");
                if (cached?.user_id === current.user.id &&
                    slugifyCareer(cached.career_title) === preferredSlug) {
                    cachedRecommendation = cached;
                }
            } catch (storageError) {
                console.warn("Latest assessment result could not be read:", storageError);
            }
            const best = preferredSlug
                ? rows.find(row => slugifyCareer(row.career_title) === preferredSlug) || cachedRecommendation
                : rows[0];
            window.__careerbotRecommendationsLoaded = Boolean(best);

            if (!best) {
                if (errorBox) {
                    errorBox.style.display = "block";
                    errorBox.textContent = "No saved career recommendation was found. Please complete the assessment again.";
                }
                return;
            }
            main.style.display = "";
            if (errorBox) errorBox.style.display = "none";
            const slug = saveCareer(best.career_title);
            localStorage.setItem("careerbotRecommendedCareer", slug);
            localStorage.setItem("careerbotLatestRecommendation", JSON.stringify({
                user_id: current.user.id,
                career_title: best.career_title,
                match_score: best.match_score ?? null,
                description: best.description ?? "",
                reason: best.reason ?? "",
                skills: Array.isArray(best.skills) ? best.skills : [],
                required_skills: Array.isArray(best.required_skills) ? best.required_skills : [],
                growth_info: best.growth_info ?? null
            }));

            if (typeof window.displayRecommendation === "function") {
                window.displayRecommendation(slug, best.match_score, best);
            }

            const desc = document.getElementById("mainCareerDescription");
            if (desc && best.description) desc.textContent = best.description;

            const reason = document.querySelector(".top-match-label");
            if (reason) reason.textContent = best.reason || "Your top CareerBot match";

            const explore = document.getElementById("exploreCareerBtn");
            if (explore) {
                explore.href = `career-details.html?career=${encodeURIComponent(slug)}`;
            }
        } catch (error) {
            console.error("Could not load recommendations:", error);
            if (errorBox) {
                errorBox.style.display = "block";
                errorBox.textContent = "Your recommendation is temporarily unavailable. Please try again in a moment.";
            }
            main.style.display = "none";
        } finally {
            window.__careerbotRecommendationsLoading = false;
        }
    }

    async function loadDashboard() {
        if (!document.getElementById("statLearning")) return;

        let status = document.getElementById("dashboardLoadStatus");
        if (!status) {
            status = document.createElement("div");
            status.id = "dashboardLoadStatus";
            status.setAttribute("role", "status");
            status.style.cssText = "margin:0 auto 18px;padding:12px 16px;border-radius:12px;background:#eef6f2;color:#355f50;max-width:1160px";
            document.querySelector(".stats-grid")?.before(status);
        }
        status.textContent = "Loading your dashboard…";
        status.style.display = "block";
        ["statAssessment", "statLearning", "statProjects", "statCareer", "barAssessmentValue", "barLearningValue", "barProjectsValue", "overallProgress", "timelineAssessmentStatus"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "Loading…";
        });

        try {
            const current = await requireSession();
            if (!current) return;

            const set = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            const [recommendationsResult, learningResult, workspacesResult] = await Promise.all([
                supabaseClient
                    .from("career_recommendations")
                    .select("career_title,match_score")
                    .eq("user_id", current.user.id)
                    .order("match_score", { ascending: false }),
                supabaseClient
                    .from("learning_resources")
                    .select("progress_percent")
                    .eq("user_id", current.user.id),
                supabaseClient
                    .from("project_workspace")
                    .select("progress_percent,status")
                    .eq("user_id", current.user.id)
            ]);

            const recommendations = recommendationsResult.data || [];
            const resources = learningResult.data || [];
            const projectRows = workspacesResult.data || [];
            const sample = {
                assessment: 78,
                learning: 42,
                completedProjects: 2,
                projectProgress: 54,
                career: "Software Developer"
            };
            const usesSampleData =
                Boolean(recommendationsResult.error || learningResult.error || workspacesResult.error) ||
                !recommendations.length || !resources.length || !projectRows.length;
            if (recommendationsResult.error) console.warn("Dashboard career data unavailable:", recommendationsResult.error);
            if (learningResult.error) console.warn("Dashboard learning data unavailable:", learningResult.error);
            if (workspacesResult.error) console.warn("Dashboard project data unavailable:", workspacesResult.error);

            const assessmentPct = recommendations.length ? 100 : sample.assessment;
            const learningPct = resources.length
                ? Math.round(resources.reduce((sum, resource) => {
                    const value = Number(resource.progress_percent);
                    return sum + (Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0);
                }, 0) / resources.length)
                : sample.learning;
            const projectCount = projectRows.length ? projectRows.filter(row =>
                String(row.status || "").toLowerCase() === "completed" ||
                Number(row.progress_percent) >= 100
            ).length : sample.completedProjects;
            const projectPct = projectRows.length
                ? Math.round(projectRows.reduce((sum, row) => sum + Math.max(0, Math.min(100, Number(row.progress_percent) || 0)), 0) / projectRows.length)
                : sample.projectProgress;

            set("statAssessment", `${assessmentPct}%`);
            set("statLearning", `${learningPct}%`);
            set("statProjects", projectCount);
            const preferredSlug = localStorage.getItem("careerbotRecommendedCareer") ||
                localStorage.getItem("careerbotSelectedCareer");
            const preferredRecommendation = recommendations.find(row =>
                slugifyCareer(row.career_title) === preferredSlug
            );
            const bestCareer = preferredRecommendation?.career_title || recommendations[0]?.career_title || sample.career;
            set("statCareer", bestCareer);

            set("barAssessmentValue", `${assessmentPct}%`);
            set("barLearningValue", `${learningPct}%`);
            set("barProjectsValue", `${projectPct}%`);

            [
                ["barAssessment", assessmentPct],
                ["barLearning", learningPct],
                ["barProjects", projectPct],
            ].forEach(([id, value]) => {
                const bar = document.getElementById(id);
                if (bar) {
                    bar.style.height = `${Math.max(0, Math.min(100, value))}%`;
                }
            });

            const overall = Math.round((assessmentPct + learningPct + projectPct) / 3);
            set("overallProgress", `${overall}%`);
            const donut = document.getElementById("progressDonut");
            if (donut) {
                donut.style.background = `conic-gradient(var(--mint) 0 ${overall}%, #ece9f7 ${overall}% 100%)`;
            }

            const timeline = document.getElementById("timelineAssessmentStatus");
            if (timeline) timeline.textContent = recommendations.length ? "Completed" : "Example progress";

            const summaryTitle = document.getElementById("summaryTitle");
            const summaryText = document.getElementById("summaryText");
            const summaryButton = document.getElementById("summaryButton");
            if (recommendations.length) {
                const best = preferredRecommendation || recommendations[0];
                const slug = saveCareer(best.career_title);
                if (summaryTitle) summaryTitle.textContent = `Keep moving toward ${best.career_title}`;
                if (summaryText) summaryText.textContent = "Review your recommended career and continue building the skills it needs.";
                if (summaryButton) {
                    summaryButton.href = `career-details.html?career=${encodeURIComponent(slug)}`;
                    summaryButton.textContent = "View Career Details →";
                }
            } else {
                if (summaryTitle) summaryTitle.textContent = "Start your career journey";
                if (summaryText) summaryText.textContent = "Complete your assessment to discover personalized career recommendations.";
                if (summaryButton) {
                    summaryButton.href = "assessment.html";
                    summaryButton.textContent = "Start Assessment →";
                }
            }

            if (usesSampleData) {
                status.textContent = "Example values are shown for any dashboard sections without saved account data. They are not saved to your account.";
                status.style.display = "block";
                status.style.background = "#fff8e8";
                status.style.color = "#695516";
            } else {
                status.style.display = "none";
            }
        } catch (error) {
            console.error("Dashboard load failed:", error);
            const set = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };
            const sample = { assessment: 78, learning: 42, projects: 2, career: "Software Developer", projectProgress: 54 };
            set("statAssessment", `${sample.assessment}%`);
            set("statLearning", `${sample.learning}%`);
            set("statProjects", sample.projects);
            set("statCareer", sample.career);
            set("barAssessmentValue", `${sample.assessment}%`);
            set("barLearningValue", `${sample.learning}%`);
            set("barProjectsValue", `${sample.projectProgress}%`);
            set("overallProgress", `${Math.round((sample.assessment + sample.learning + sample.projectProgress) / 3)}%`);
            set("timelineAssessmentStatus", "Example progress");
            [["barAssessment", sample.assessment], ["barLearning", sample.learning], ["barProjects", sample.projectProgress]].forEach(([id, value]) => {
                const bar = document.getElementById(id);
                if (bar) {
                    bar.style.height = `${value}%`;
                }
            });
            const donut = document.getElementById("progressDonut");
            if (donut) donut.style.background = `conic-gradient(var(--mint) 0 ${Math.round((sample.assessment + sample.learning + sample.projectProgress) / 3)}%, #ece9f7 ${Math.round((sample.assessment + sample.learning + sample.projectProgress) / 3)}% 100%)`;
            status.textContent = "Your account data could not be reached. Example dashboard values are shown and are not saved to your account.";
            status.style.display = "block";
            status.style.background = "#fff8e8";
            status.style.color = "#695516";
        }
    }

    async function loadCareerDetails() {
        const careerAbout = document.getElementById("careerAbout");
        if (!careerAbout) return;
        try {
            const current = await requireSession();
            if (!current) return;

            const params = new URLSearchParams(location.search);
            const requestedCareer = params.get("career");
            const slug = slugifyCareer(
                requestedCareer ||
                localStorage.getItem("careerbotRecommendedCareer") ||
                localStorage.getItem("careerbotSelectedCareer")
            );
            if (!slug) return;

            let cached = null;
            try {
                const value = JSON.parse(localStorage.getItem("careerbotLatestRecommendation") || "null");
                if (value?.user_id === current.user.id && slugifyCareer(value.career_title) === slug) {
                    cached = value;
                }
            } catch (storageError) {
                console.warn("Latest assessment career details could not be read:", storageError);
            }

            let rows = [];
            try {
                const result = await supabaseClient
                    .from("career_recommendations")
                    .select("*")
                    .eq("user_id", current.user.id)
                    .order("match_score", { ascending: false });
                if (result.error) {
                    console.warn("Saved career detail could not be loaded; using the assessment result if available.", result.error);
                } else {
                    rows = result.data || [];
                }
            } catch (queryError) {
                console.warn("Saved career detail could not be loaded; using the assessment result if available.", queryError);
            }

            const row = rows.find(item => slugifyCareer(item.career_title) === slug) || cached;
            const notFound = document.getElementById("notFound");
            const content = document.getElementById("careerContent");
            const needsDynamicDetails = notFound?.style.display === "block";

            // Keep the richer built-in profile for catalogued careers. For a
            // recommended title outside that catalogue, render its saved
            // assessment data instead of leaving the page in "not found".
            if (!needsDynamicDetails && !row) return;

            const careerTitle = row?.career_title ||
                careerTitleForSlug(slug).replace(/\b[a-z]/g, letter => letter.toUpperCase());
            const description = row?.description ||
                `Explore the responsibilities, skills, and opportunities available in ${careerTitle}.`;
            const rawSkills = Array.isArray(row?.required_skills) && row.required_skills.length
                ? row.required_skills
                : Array.isArray(row?.skills) && row.skills.length
                    ? row.skills
                    : ["Problem solving", "Communication", "Role-specific tools"];
            const skills = rawSkills
                .map(skill => typeof skill === "string" ? skill : skill?.name || skill?.skill || "")
                .filter(Boolean);
            const growth = row?.growth_info?.summary ||
                row?.growth_info?.description ||
                `Build experience in ${careerTitle} and progress toward senior or specialist roles.`;

            saveCareer(row?.career_title || careerTitle);

            const set = (id, value) => {
                const element = document.getElementById(id);
                if (element && value != null && value !== "") element.textContent = value;
            };

            if (needsDynamicDetails) {
                set("careerIcon", "✨");
                set("careerName", careerTitle);
                set("careerDescription", description);
                set("careerAbout", row?.about || description);
                set("education", row?.education || "Relevant education, training, or equivalent practical experience");
                set("coreSkills", row?.core_skills || skills.slice(0, 4).join(", "));
                set("workAreas", row?.work_areas || `Teams and organizations working in ${careerTitle}`);
                set("growth", growth);
                set("suitText", row?.reason || `This career may suit you based on your assessment results and interests.`);
                set("environment", row?.environment || `Work settings vary by employer and specialization within ${careerTitle}.`);

                const roadmap = document.getElementById("roadmap");
                if (roadmap) {
                    const steps = [
                        ["1", "Learn the foundations", `Build core knowledge related to ${careerTitle}.`],
                        ["2", "Develop key skills", `Practice ${skills.slice(0, 3).join(", ")} through guided learning.`],
                        ["3", "Complete a practical project", "Create a project that demonstrates your skills and problem-solving."],
                        ["4", "Prepare for opportunities", "Review entry-level roles and prepare examples of your work."]
                    ];
                    roadmap.replaceChildren();
                    steps.forEach(([number, heading, text]) => {
                        const item = document.createElement("div");
                        item.className = "roadmap-item";
                        const badge = document.createElement("div");
                        badge.className = "roadmap-number";
                        badge.textContent = number;
                        const body = document.createElement("div");
                        const title = document.createElement("h3");
                        title.textContent = heading;
                        const descriptionElement = document.createElement("p");
                        descriptionElement.textContent = text;
                        body.append(title, descriptionElement);
                        item.append(badge, body);
                        roadmap.appendChild(item);
                    });
                }

                const learnGrid = document.getElementById("learnGrid");
                if (learnGrid) {
                    learnGrid.replaceChildren();
                    skills.forEach(skill => {
                        const card = document.createElement("div");
                        card.className = "learn-card";
                        card.textContent = skill;
                        learnGrid.appendChild(card);
                    });
                }

                const skillGapLink = document.getElementById("skillGapLink");
                if (skillGapLink) {
                    skillGapLink.href = `skill-gap.html?career=${encodeURIComponent(slug)}`;
                }

                if (content) content.style.display = "";
                if (notFound) notFound.style.display = "none";
                const errorBox = document.getElementById("errorBox");
                if (errorBox) errorBox.style.display = "none";
                document.title = `CareerBot — ${careerTitle}`;
            }

            const skillsGrid = document.getElementById("skillsGrid");
            if (skillsGrid && needsDynamicDetails) {
                skillsGrid.replaceChildren();
                skills.forEach(skill => {
                    const card = document.createElement("div");
                    card.className = "skill-card";
                    card.textContent = skill;
                    skillsGrid.appendChild(card);
                });
            }

            const grid = document.getElementById("skillsGrid");
            if (grid && !needsDynamicDetails && skills.length) {
                grid.replaceChildren(...skills.map(skill => {
                    const card = document.createElement("div");
                    card.className = "skill-card";
                    card.textContent = skill;
                    return card;
                }));
            }
        } catch (error) {
            console.error("Career details load failed:", error);
        }
    }

    async function loadSkillGap() {
        const grid = document.getElementById("skillsGrid");
        if (!grid) return;
        const overallEl = document.getElementById("overallMatch");
        if (overallEl) overallEl.textContent = "—";
        const description = document.getElementById("careerDescription");
        if (description) description.textContent = "";

        const showMessage = (title, detail, includeRetry = false) => {
            const content = document.getElementById("skillContent");
            const notFound = document.getElementById("notFound");
            if (content) content.style.display = "";
            if (notFound) notFound.style.display = "none";
            grid.innerHTML = `<div class="empty-state"><h3>${escapeHTML(title)}</h3><p>${escapeHTML(detail)}</p>${includeRetry ? '<button type="button" id="retrySkillGap">Try again</button>' : ""}</div>`;
            document.getElementById("retrySkillGap")?.addEventListener("click", loadSkillGap, { once: true });
        };

        try {
            const current = await requireSession();
            if (!current) return;

            const slug = slugifyCareer(selectedCareer());
            if (!slug) {
                showMessage("Choose a career first.", "Complete the career assessment to see a skill gap for your recommended path.");
                return;
            }

            const title = careerTitleForSlug(slug);
            saveCareer(title);
            const careerQuery = `?career=${encodeURIComponent(slug)}`;
            const backCareerLink = document.getElementById("backCareerLink");
            const careerDetailsLink = document.getElementById("careerDetailsLink");
            const learningGuideLink = document.getElementById("learningGuideLink");
            if (backCareerLink) backCareerLink.href = `career-details.html${careerQuery}`;
            if (careerDetailsLink) careerDetailsLink.href = `career-details.html${careerQuery}`;
            if (learningGuideLink) learningGuideLink.href = `learning-guide.html${careerQuery}`;

            const { data: gaps, error: gapError } = await supabaseClient
                .from("skill_gaps")
                .select("id,career_title,current_skills,required_skills,missing_skills,progress")
                .eq("user_id", current.user.id)
                .order("updated_at", { ascending: false })
                .limit(50);

            if (gapError) throw gapError;

            let row = (gaps || []).find(item => slugifyCareer(item.career_title) === slug) || null;
            let fallbackSkills = [];
            let profileSkills = [];

            if (!row) {
                const [recommendationResult, profileResult] = await Promise.all([
                    supabaseClient
                        .from("career_recommendations")
                        .select("career_title,description,required_skills,match_score")
                        .eq("user_id", current.user.id)
                        .order("match_score", { ascending: false })
                        .limit(50),
                    supabaseClient
                        .from("profiles")
                        .select("skills")
                        .eq("id", current.user.id)
                        .maybeSingle()
                ]);

                if (recommendationResult.error) throw recommendationResult.error;
                if (profileResult.error) throw profileResult.error;
                row = (recommendationResult.data || []).find(item => slugifyCareer(item.career_title) === slug) || null;
                fallbackSkills = Array.isArray(row?.required_skills) ? row.required_skills : [];
                profileSkills = Array.isArray(profileResult.data?.skills) ? profileResult.data.skills : [];
            }

            if (!row) {
                showMessage("No saved career match was found.", "Complete the assessment to create your personalized skill-gap plan.");
                return;
            }

            const content = document.getElementById("skillContent");
            const notFound = document.getElementById("notFound");
            if (content) content.style.display = "";
            if (notFound) notFound.style.display = "none";

            const normalizeSkills = values => Array.isArray(values)
                ? values
                    .map(skill => typeof skill === "string" ? skill : skill?.name || skill?.skill || "")
                    .map(skill => String(skill).trim())
                    .filter(Boolean)
                : [];
            const currentSkills = new Set(
                normalizeSkills(
                    Array.isArray(row.current_skills) && row.current_skills.length
                        ? row.current_skills
                        : profileSkills
                )
                    .map(s => String(s).trim().toLowerCase())
            );
            const required = normalizeSkills(row.required_skills);
            const missing = new Set(
                normalizeSkills(row.missing_skills)
                    .map(s => String(s).trim().toLowerCase())
            );
            const fallback = normalizeSkills(fallbackSkills);
            const skills = required.length ? required : (fallback.length ? fallback : Array.from(missing));

            if (!skills.length) {
                showMessage("No skill requirements were saved for this career.", "Try the assessment again, or check back after your career plan has been refreshed.");
            } else {
                grid.innerHTML = skills.map(skill => {
                    const key = String(skill).trim().toLowerCase();
                    const has = currentSkills.has(key) && !missing.has(key);
                    return `<div class="skill-card">
                        <strong>${escapeHTML(skill)}</strong>
                        <div class="skill-bottom">
                            <span class="gap-text">${has ? "Already listed" : "Skill gap"}</span>
                            <span class="priority ${has ? "low" : ""}">${has ? "Ready" : "Priority"}</span>
                        </div>
                    </div>`;
                }).join("");
            }

            const name = document.getElementById("careerName");
            const careerTitle = row.career_title || title;
            if (name) name.textContent = careerTitle;
            if (description) {
                description.textContent = row.description ||
                    `Build the skills and experience commonly used in ${careerTitle}.`;
            }

            const progress = row.progress && typeof row.progress === "object" ? row.progress : {};
            const overall = Number(progress.percent ?? progress.progress_percent ?? progress.match_percent ?? row.match_score);
            if (overallEl && Number.isFinite(overall)) overallEl.textContent = `${Math.max(0, Math.min(100, Math.round(overall)))}%`;
        } catch (error) {
            console.error("Skill gap load failed:", error);
            showMessage("Your skill gap could not be loaded.", "Your saved information is unchanged. Check your connection and try again.", true);
        }
    }

    async function loadLearning() {
        const path = document.getElementById("learningPath");
        if (!path) return;

        try {
            const current = await requireSession();
            if (!current) return;

            const slug = slugifyCareer(selectedCareer());
            if (!slug) return;

            const title = careerTitleForSlug(slug);

            // Learning resources belong to a user's skill-gap record. The
            // learning_resources table intentionally has no career_title column.
            const { data: gaps, error: gapError } = await supabaseClient
                .from("skill_gaps")
                .select("id,career_title")
                .eq("user_id", current.user.id)
                .order("updated_at", { ascending: false })
                .limit(50);

            if (gapError) throw gapError;

            const skillGapId = (gaps || []).find(gap => slugifyCareer(gap.career_title) === slug)?.id;
            if (!skillGapId) {
                path.innerHTML = `<div class="empty-state"><h3>No learning path found for ${escapeHTML(title)}.</h3><p>Please complete the assessment again to generate your personalized learning path.</p></div>`;
                return;
            }

            const { data, error } = await supabaseClient
                .from("learning_resources")
                .select("*")
                .eq("user_id", current.user.id)
                .eq("skill_gap_id", skillGapId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            const resources = data || [];
            if (!resources.length) {
                path.innerHTML = `<div class="empty-state"><h3>No learning resources found for ${escapeHTML(title)}.</h3><p>Add career-specific resources in Supabase.</p></div>`;
                return;
            }

            path.innerHTML = resources.map((r, i) => `
                <div class="module ${r.learning_status === "completed" ? "completed" : ""}">
                    <div class="module-number">${i + 1}</div>
                    <div class="module-content">
                        <h3>${escapeHTML(r.title || r.skill_name || "Learning Resource")}</h3>
                        <p>${escapeHTML(r.description || "Build this skill through the recommended resource.")}</p>
                        <div class="module-meta">
                            <span>${escapeHTML(r.provider || r.resource_type || "Learning")}</span>
                            <span>${escapeHTML(r.estimated_hours || "")} hrs</span>
                            <span>${Number(r.progress_percent || 0)}%</span>
                        </div>
                        ${r.url ? `<a href="${escapeHTML(safeExternalURL(r.url))}" target="_blank" rel="noopener noreferrer">Open Resource ↗</a>` : ""}
                    </div>
                </div>
            `).join("");

            const average = Math.round(
                resources.reduce((sum, r) => sum + Number(r.progress_percent || 0), 0) / resources.length
            );

            const pct = document.getElementById("progressPercentage");
            if (pct) pct.textContent = `${average}%`;

            const fill = document.getElementById("progressFill");
            if (fill) fill.style.width = `${average}%`;

            const progressText = document.getElementById("progressText");
            if (progressText) progressText.textContent = `${average}% complete`;

            if (typeof window.toggleModule === "function" && !window.__careerbotLearningWrapped) {
                window.__careerbotLearningWrapped = true;
                const originalToggle = window.toggleModule;

                window.toggleModule = async function(index) {
                    const result = originalToggle.apply(this, arguments);
                    try {
                        const resource = resources[index];
                        if (resource?.id) {
                            const text = document.getElementById("progressPercentage")?.textContent || "0%";
                            const progress = Math.max(0, Math.min(100, parseInt(text, 10) || 0));
                            await supabaseClient.rpc("update_learning_progress", {
                                p_resource_id: resource.id,
                                p_progress_percent: progress,
                                p_status: progress >= 100 ? "completed" : progress > 0 ? "in_progress" : "not_started"
                            });
                        }
                    } catch (e) {
                        console.warn("Learning progress sync skipped:", e);
                    }
                    return result;
                };
            }
        } catch (error) {
            console.error("Learning resources load failed:", error);
        }
    }

    async function loadProjects() {
        const container = document.getElementById("projectsContainer");
        if (!container) return;
        const empty = document.getElementById("emptyState");
        const slug = selectedCareer();
        const title = slug ? careerTitleForSlug(slug) : "";
        const heading = document.getElementById("careerName");
        const summary = document.getElementById("careerSummary");
        if (heading) heading.textContent = title || "your selected career";
        if (summary) summary.textContent = title || "No career selected";
        container.innerHTML = "";
        if (empty) {
            empty.style.display = "block";
            empty.textContent = "Loading projects…";
        }

        const renderProjects = projects => {
            const filters = document.querySelectorAll(".filter-btn");
            const render = (level = "all") => {
                const visible = level === "all"
                    ? projects
                    : projects.filter(p => String(p.difficulty || "").toLowerCase() === level);

                container.innerHTML = visible.map(p => `
                    <article class="project-card" data-project-level="${escapeHTML(String(p.difficulty || "").toLowerCase())}">
                        <div class="project-icon">${escapeHTML(p.icon || "💡")}</div>
                        <span class="level">${escapeHTML(p.difficulty || "Recommended")}</span>
                        <h3>${escapeHTML(p.title || "Project")}</h3>
                        <p>${escapeHTML(p.description || "")}</p>
                        <div class="skills">
                            ${(Array.isArray(p.skills) ? p.skills : []).map(s => `<span>${escapeHTML(s)}</span>`).join("")}
                        </div>
                        <div class="project-meta"><span>⏱ ${escapeHTML(p.estimated_time || "Self-paced")}</span></div>
                        <a class="start-btn" href="project-workspace.html?career=${encodeURIComponent(slug)}&project=${encodeURIComponent(p.id)}&title=${encodeURIComponent(p.title || "Project")}&description=${encodeURIComponent(p.description || "")}&difficulty=${encodeURIComponent(p.difficulty || "")}&time=${encodeURIComponent(p.estimated_time || "")}&skills=${encodeURIComponent((Array.isArray(p.skills) ? p.skills : []).join(","))}">Start Your Project →</a>
                    </article>
                `).join("");
                if (empty) {
                    empty.style.display = visible.length ? "none" : "block";
                    empty.textContent = visible.length ? "" : `No ${level} projects are available for ${title}.`;
                }
            };

            filters.forEach(button => {
                if (button.dataset.careerbotBound) return;
                button.dataset.careerbotBound = "1";
                button.addEventListener("click", () => {
                    filters.forEach(item => item.classList.remove("active"));
                    button.classList.add("active");
                    render(button.dataset.level || "all");
                });
            });
            render(document.querySelector(".filter-btn.active")?.dataset.level || "all");
        };

        try {
            const current = await requireSession();
            if (!current) return;

            if (!slug) {
                if (empty) empty.innerHTML = 'Complete your career assessment to see project ideas. <a href="assessment-form.html">Start assessment</a>';
                return;
            }
            // Match careers by their canonical slug rather than exact display text.
            // This intentionally treats "UI / UX Designer", "UI/UX Designer", and
            // "UX/UI Designer" as the same career while keeping user-level RLS intact.
            const { data, error } = await supabaseClient
                .from("project_ideas")
                .select("*")
                .eq("user_id", current.user.id)
                .order("created_at", { ascending: true });

            if (error) throw error;

            const requestedCareer = slugifyCareer(slug || title);

            // Populate the skill-match label from the signed-in user's backend recommendation.
            const skillMatch = document.getElementById("skillMatch");
            const { data: recommendationRows, error: recommendationError } = await supabaseClient
                .from("career_recommendations")
                .select("career_title,match_score")
                .eq("user_id", current.user.id);
            if (recommendationError) {
                console.warn("Could not load project-page skill match:", recommendationError);
            } else {
                const recommendation = (recommendationRows || []).find(row =>
                    slugifyCareer(row.career_title || "") === requestedCareer
                );
                if (skillMatch) {
                    const score = Number(recommendation?.match_score);
                    skillMatch.textContent = recommendation && Number.isFinite(score)
                        ? `${Math.round(score)}%`
                        : "—";
                }
            }

            const matchingCareerRows = (data || []).filter(p =>
                slugifyCareer(p.career_title || "") === requestedCareer
            );
            const seen = new Set();
            const projects = matchingCareerRows.filter(p => {
                const key = String(p.title || "project").trim().toLowerCase().replace(/\s+/g, " ");
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            if (!projects.length) {
                if (empty) {
                    empty.style.display = "block";
                    empty.textContent = `No saved project ideas are available for ${title} yet.`;
                }
                return;
            }
            renderProjects(projects);
        } catch (error) {
            console.error("Project ideas load failed:", error);
            if (empty) {
                container.innerHTML = "";
                empty.innerHTML = 'Projects are temporarily unavailable. <button type="button" id="retryProjectIdeas">Try again</button>';
                empty.style.display = "block";
                document.getElementById("retryProjectIdeas")?.addEventListener("click", loadProjects, { once: true });
            }
        }
    }

    async function connectWorkspace() {
        if (!document.getElementById("progressPercentage")) return;

        try {
            const current = await requireSession();
            if (!current) return;

            const params = new URLSearchParams(location.search);
            const projectId = params.get("project");
            if (!projectId) return;

            let { data, error } = await supabaseClient
                .from("project_workspace")
                .select("*")
                .eq("project_idea_id", projectId)
                .eq("user_id", current.user.id)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                const { data: idea, error: ideaError } = await supabaseClient
                    .from("project_ideas")
                    .select("*")
                    .eq("id", projectId)
                    .maybeSingle();

                if (ideaError) throw ideaError;

                if (idea) {
                    const created = await supabaseClient
                        .from("project_workspace")
                        .insert({
                            project_idea_id: idea.id,
                            user_id: current.user.id,
                            project_title: idea.title,
                            description: idea.description,
                            status: "not_started",
                            progress_percent: 0
                        })
                        .select("*")
                        .single();

                    if (created.error) throw created.error;
                    data = created.data;
                }
            }

            if (!data) throw new Error("Selected project was not found for this account.");

            if (data) {
                const progress = document.getElementById("progressPercentage");
                if (progress) progress.textContent = `${data.progress_percent || 0}%`;
            }

            const saveWorkspace = async (payload) => {
                if (!data?.id) throw new Error("Project workspace is not available.");
                const updates = {};
                if (Object.hasOwn(payload, "p_progress_percent")) updates.progress_percent = payload.p_progress_percent;
                if (Object.hasOwn(payload, "p_status")) updates.status = payload.p_status;
                const directResult = await supabaseClient
                    .from("project_workspace")
                    .update(updates)
                    .eq("id", data.id)
                    .eq("user_id", current.user.id)
                    .select("id")
                    .maybeSingle();

                if (!directResult.error && directResult.data?.id) return;

                // Retain compatibility with deployments whose RLS policy
                // permits updates only through the existing RPC.
                const { error: rpcError } = await supabaseClient.rpc("update_project_workspace", {
                    p_workspace_id: data.id,
                    ...payload
                });
                if (rpcError) throw directResult.error || rpcError;
            };

            if (typeof window.toggleTask === "function" && !window.__careerbotTaskWrapped) {
                window.__careerbotTaskWrapped = true;
                const original = window.toggleTask;

                window.toggleTask = async function(index) {
                    const result = original.apply(this, arguments);
                    try {
                        const percentText = document.getElementById("progressPercentage")?.textContent || "0%";
                        const percent = Math.max(0, Math.min(100, parseInt(percentText, 10) || 0));
                        await saveWorkspace({
                            p_progress_percent: percent,
                            p_status: percent >= 100 ? "completed" : percent > 0 ? "in_progress" : "not_started"
                        });
                    } catch (e) {
                        console.warn("Workspace progress sync skipped:", e);
                        const status = document.getElementById("workspaceStatus");
                        if (status) {
                            status.textContent = "Progress is saved in this browser, but could not sync to your account.";
                            status.style.display = "block";
                        }
                    }
                    return result;
                };
            }
        } catch (error) {
            console.error("Workspace load failed:", error);
            const status = document.getElementById("workspaceStatus");
            if (status) {
                status.textContent = "The workspace is available in this browser, but account sync is temporarily unavailable.";
                status.style.display = "block";
            }
        }
    }

    async function connectAgent() {
        if (!document.getElementById("chatForm")) return;

        const current = await requireSession();
        if (!current) return;

        const form = document.getElementById("chatForm");
        const input = document.getElementById("chatInput");
        const body = document.getElementById("chatBody");
        const clearButton = document.getElementById("clearChat");

        if (!form || !input || !body || window.__careerbotAgentBound) return;
        window.__careerbotAgentBound = true;

        const add = (role, content) => {
            const wrapper = document.createElement("div");
            wrapper.className = `message ${role === "user" ? "user" : "bot"}`;
            const bubble = document.createElement("div");
            bubble.className = "bubble";
            bubble.textContent = content;
            wrapper.appendChild(bubble);
            body.appendChild(wrapper);
        };

        try {
            const { data: conv, error: convError } = await supabaseClient
                .from("agent_conversations")
                .select("id")
                .eq("user_id", current.user.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (convError) throw convError;

            if (conv?.id) {
                const { data: messages } = await supabaseClient
                    .from("agent_messages")
                    .select("role,content,created_at")
                    .eq("conversation_id", conv.id)
                    .order("created_at", { ascending: true });

                if (messages?.length) {
                    body.innerHTML = "";
                    messages.forEach(m => add(m.role, m.content));
                    body.scrollTop = body.scrollHeight;
                }
            }
        } catch (error) {
            console.warn("Agent history could not be loaded:", error);
        }

        form.addEventListener("submit", async event => {
            event.preventDefault();

            const message = input.value.trim();
            if (!message) return;

            add("user", message);
            input.value = "";
            body.scrollTop = body.scrollHeight;

            const typing = document.createElement("div");
            typing.className = "message bot";
            typing.innerHTML = '<div class="bubble">CareerBot is thinking…</div>';
            body.appendChild(typing);

            try {
                const result = await invoke("careerbot-agent", {
                    message
                });
                typing.remove();
                const answer = result?.answer || result?.message || "I couldn't generate a response right now.";
                add("assistant", answer);
            } catch (error) {
                typing.remove();
                console.error("CareerBot Agent request failed:", error);
                add("assistant", "CareerBot is temporarily unavailable. Your message is still in the input so you can retry.");
                input.value = message;
                input.focus();
            }

            body.scrollTop = body.scrollHeight;
        });

        document.querySelectorAll("[data-question]").forEach(button => {
            button.addEventListener("click", () => {
                input.value = button.dataset.question || "";
                form.requestSubmit();
            });
        });

        clearButton?.addEventListener("click", async () => {
            try {
                const { data: conv } = await supabaseClient
                    .from("agent_conversations")
                    .select("id")
                    .eq("user_id", current.user.id)
                    .order("updated_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (conv?.id) {
                    await supabaseClient
                        .from("agent_conversations")
                        .delete()
                        .eq("id", conv.id)
                        .eq("user_id", current.user.id);
                }
            } catch (error) {
                console.warn("Could not clear saved conversation:", error);
            }

            body.innerHTML = '<div class="message bot"><div class="bubble"><strong>Chat cleared.</strong><br><br>What would you like help with next?</div></div>';
        });
    }

    async function loadLiveJobDetails() {
        const pageContent = document.getElementById("pageContent");
        if (!pageContent) return;

        const params = new URLSearchParams(location.search);
        const url = safeExternalURL(params.get("url"));
        if (url === "#") {
            pageContent.innerHTML = '<div class="empty-state"><h3>Job details are unavailable.</h3><p>Return to Job Recommendations and select a job again.</p></div>';
            return;
        }

        try {
            const current = await requireSession();
            if (!current) return;

            const job = {
                id: params.get("job") || "",
                title: params.get("title") || "Job opportunity",
                company: params.get("company") || "Company",
                location: params.get("location") || "Remote",
                mode: params.get("mode") || "Remote",
                type: params.get("type") || "Full-time",
                experience: params.get("experience") || "Not specified",
                salary: params.get("salary") || "Not specified",
                posted: params.get("posted") || "Recently",
                description: params.get("description") || "Review the original listing for the complete job description.",
                applicationUrl: url,
                source: params.get("source") || "Jobicy"
            };

            const e = escapeHTML;

            pageContent.innerHTML = `
                <a href="job-recommendations.html?career=${encodeURIComponent(selectedCareer())}" class="back">← Back to Job Recommendations</a>
                <section class="hero">
                    <span class="hero-label">LIVE JOB OPPORTUNITY</span>
                    <h1>${e(job.title)}</h1>
                    <p>${e(job.company)} · ${e(job.location)}</p>
                    <div class="meta">
                        <span>📍 ${e(job.location)}</span>
                        <span>💼 ${e(job.type)}</span>
                        <span>🏠 ${e(job.mode)}</span>
                        <span>⏳ ${e(job.experience)}</span>
                        <span>💰 ${e(job.salary)}</span>
                        <span>🕒 ${e(job.posted)}</span>
                    </div>
                </section>
                <div class="main-grid">
                    <div>
                        <section class="card"><h2>About the Role</h2><p>${e(job.description)}</p></section>
                        <section class="card"><h2>About This Listing</h2><p>This is a live remote-job listing supplied by ${e(job.source)}. Review the original posting for the employer's current requirements, responsibilities, compensation details, and application instructions.</p></section>
                    </div>
                    <aside class="side-card">
                        <section class="card">
                            <div class="match"><small>SOURCE</small><strong>${e(job.source)}</strong></div>
                            <a href="${e(job.applicationUrl)}" target="_blank" rel="noopener noreferrer" class="apply-btn">Open Original Job ↗</a>
                            <a href="job-recommendations.html?career=${encodeURIComponent(selectedCareer())}" class="secondary-btn">View More Jobs</a>
                            <div class="note"><strong>Important:</strong> CareerBot does not submit applications on your behalf. Review the original listing before applying.</div>
                        </section>
                    </aside>
                </div>`;

            await supabaseClient.rpc("record_job_activity", {
                p_activity: {
                    external_job_id: job.id,
                    job_title: job.title,
                    company_name: job.company,
                    job_url: url,
                    source: job.source,
                    activity_type: "viewed"
                }
            });

            pageContent.querySelector(".apply-btn")?.addEventListener("click", () => {
                supabaseClient.rpc("record_job_activity", {
                    p_activity: {
                        external_job_id: job.id,
                        job_title: job.title,
                        company_name: job.company,
                        job_url: url,
                        source: job.source,
                        activity_type: "applied"
                    }
                }).catch(e => console.warn("Application activity could not be recorded:", e));
            });
        } catch (error) {
            console.warn("Live job details could not be loaded:", error);
        }
    }

    async function protectAndConnect() {
        if (page === "recommendations.html") {
            window.__careerbotRecommendationsLoading = true;
        }

        if (PRIVATE_PAGES.has(page)) {
            const ok = await requireSession();
            if (!ok) return;
        }

        if (page === "profile.html") await connectProfile();
        if (page === "assessment-form.html") await connectAssessment();
        if (page === "recommendations.html") await loadRecommendations();
        if (page === "dashboard.html") await loadDashboard();
        if (page === "career-details.html") await loadCareerDetails();
        if (page === "skill-gap.html") await loadSkillGap();
        if (page === "learning-guide.html") await loadLearning();
        if (page === "project-ideas.html") await loadProjects();
        if (page === "project-workspace.html") await connectWorkspace();
        if (page === "agent.html") await connectAgent();
        if (page === "job-details.html") await loadLiveJobDetails();
    }

    window.CareerBotIntegration = {
        session,
        requireSession,
        invoke,
        slugifyCareer,
        selectedCareer,
        careerTitleForSlug
    };

    document.addEventListener("DOMContentLoaded", protectAndConnect);
})();
