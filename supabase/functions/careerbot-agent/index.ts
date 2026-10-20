import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

function getUid(req: Request) {
  const token = (req.headers.get("Authorization") || "")
    .replace(/^Bearer\s+/i, "");
  const part = token.split(".")[1];

  if (!part) return null;

  try {
    return (
      JSON.parse(
        atob(
          part
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(part.length / 4) * 4, "="),
        ),
      ).sub || null
    );
  } catch {
    return null;
  }
}

function answerFor(
  message: string,
  profile: any,
  recs: any[],
  gaps: any[],
  resources: any[],
  projects: any[],
) {
  const q = message.toLowerCase();
  const name = profile?.first_name || "there";
  const has = (...terms: string[]) => terms.some((term) => q.includes(term));

  // Handle specific intents before the broader career-match intent.
  if (has("skill gap", "missing skill")) {
    const missingSkills = [
      ...new Set(
        gaps.flatMap((gap) =>
          Array.isArray(gap.missing_skills) ? gap.missing_skills : [],
        ),
      ),
    ].slice(0, 8);

    return missingSkills.length
      ? "Your saved skill gaps include " +
          missingSkills.join(", ") +
          ". Pick one priority skill, study the fundamentals, then practise it in a small project."
      : "Start with the fundamentals for your target role. For software development, try JavaScript, Git, problem solving and databases; for data analysis, try spreadsheets, SQL and visualisation.";
  }

  if (has("learn", "learning", "course", "study")) {
    return resources.length
      ? "A useful next step from your plan is " +
          resources
            .slice(0, 4)
            .map((resource) => resource.title || resource.skill_name)
            .filter(Boolean)
            .join("; ") +
          ". Study one topic at a time and build a practical example."
      : "Choose one job-relevant skill, follow beginner documentation or a course, and practise it. Finish with a small portfolio project.";
  }

  if (has("project")) {
    return projects.length
      ? "Project ideas saved for you: " +
          projects
            .slice(0, 4)
            .map((project) => project.title)
            .filter(Boolean)
            .join(", ") +
          ". Keep the first version small and document what you learned."
      : "Try a portfolio website, task tracker, sales dashboard, or app redesign. Choose a project that demonstrates a skill employers request.";
  }

  if (
    has(
      "job",
      "work",
      "prepare",
      "application",
      "apply",
      "interview",
      "resume",
      "cv",
      "portfolio",
      "employer",
      "recruit",
    )
  ) {
    const role = recs.find((item) => item.career_title)?.career_title;
    const project = projects.find((item) => item.title)?.title;
    const rolePhrase = role ? ` for ${role} roles` : " for entry-level roles";
    const evidence = project
      ? ` Use a project such as ${project} to show what you can do.`
      : " Build one small role-relevant project to show what you can do.";

    return (
      `To prepare${rolePhrase}, tailor your CV to each listing, show measurable results from your projects, and practise explaining how you solve problems.` +
      evidence +
      " Start with entry-level openings that match the skills you can demonstrate."
    );
  }

  if (has("progress", "roadmap", "track", "completed")) {
    const activity = [];
    if (gaps.length) activity.push(`${gaps.length} saved skill gap${gaps.length === 1 ? "" : "s"}`);
    if (resources.length) activity.push(`${resources.length} learning resource${resources.length === 1 ? "" : "s"}`);
    if (projects.length) activity.push(`${projects.length} project idea${projects.length === 1 ? "" : "s"}`);

    return activity.length
      ? `Your saved career activity includes ${activity.join(", ")}. Choose one skill to practise this week, then add a small project that demonstrates it.`
      : "I don't see saved career activity yet. Complete your assessment to create a personalized roadmap, skill gaps, and learning plan.";
  }

  if (
    has(
      "career",
      "suitable",
      "recommend",
      "matched",
      "match",
      "role",
      "path",
    )
  ) {
    return recs.length
      ? `Hi ${name}! Your current career matches include ${recs
          .slice(0, 3)
          .map((item) => item.career_title)
          .filter(Boolean)
          .join(", ")}. Compare their daily work, skills, and entry-level opportunities before choosing.`
      : `Hi ${name}! Start by exploring Software Developer (building applications), Data Analyst (finding insights in data), UX/UI Designer (designing digital experiences), or Business Analyst (improving processes). Your assessment can personalise this further.`;
  }

  return `Hi ${name}! I can help with your career matches, skills to learn, projects, job preparation, CVs, interviews, and progress. Ask about one of those topics, or tell me the role you have in mind.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "Use POST." }, 405);
  }

  const uid = getUid(req);
  if (!uid) {
    return json(
      { error: "Please sign in again.", code: "AUTH_REQUIRED" },
      401,
    );
  }

  const body = await req.json().catch(() => ({}));
  const message =
    typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";

  if (!message) {
    return json({ error: "Message is required." }, 400);
  }

  const base = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  let profile = null;
  let recs: any[] = [];
  let gaps: any[] = [];
  let resources: any[] = [];
  let projects: any[] = [];
  let conversationId = null;
  let cloudSaved = false;

  if (base && key) {
    const headers = {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    async function get(path: string) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      try {
        const response = await fetch(base + "/rest/v1/" + path, {
          headers,
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("read failed");
        return await response.json();
      } finally {
        clearTimeout(timeout);
      }
    }

    try {
      [profile, recs, gaps, resources, projects] = await Promise.all([
        get(
          "profiles?id=eq." +
            encodeURIComponent(uid) +
            "&select=*&limit=1",
        ).then((rows) => rows[0] || null),
        get(
          "career_recommendations?user_id=eq." +
            encodeURIComponent(uid) +
            "&select=career_title,description,match_score&order=created_at.desc&limit=5",
        ),
        get(
          "skill_gaps?user_id=eq." +
            encodeURIComponent(uid) +
            "&select=missing_skills&order=updated_at.desc&limit=10",
        ),
        get(
          "learning_resources?user_id=eq." +
            encodeURIComponent(uid) +
            "&select=skill_name,title&order=updated_at.desc&limit=10",
        ),
        get(
          "project_ideas?user_id=eq." +
            encodeURIComponent(uid) +
            "&select=title&order=created_at.desc&limit=10",
        ),
      ]);
    } catch (error) {
      console.warn("Career context read failed; using built-in guidance.", error);
    }
  }

  const answer = answerFor(message, profile, recs, gaps, resources, projects);

  if (base && key) {
    const headers = {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    try {
      const response = await fetch(
        base +
          "/rest/v1/agent_conversations?user_id=eq." +
          encodeURIComponent(uid) +
          "&select=id&order=updated_at.desc&limit=1",
        { headers },
      );
      const existing = response.ok ? await response.json() : [];

      if (existing?.[0]?.id) {
        conversationId = existing[0].id;
      } else {
        const created = await fetch(base + "/rest/v1/agent_conversations", {
          method: "POST",
          headers,
          body: JSON.stringify([{ user_id: uid, title: "CareerBot Conversation" }]),
        });

        if (created.ok) {
          conversationId = (await created.json())?.[0]?.id || null;
        }
      }

      if (conversationId) {
        const saved = await fetch(base + "/rest/v1/agent_messages", {
          method: "POST",
          headers,
          body: JSON.stringify([
            {
              conversation_id: conversationId,
              user_id: uid,
              role: "user",
              content: message,
            },
            {
              conversation_id: conversationId,
              user_id: uid,
              role: "assistant",
              content: answer,
            },
          ]),
        });

        cloudSaved = saved.ok;
      }
    } catch (error) {
      console.warn(
        "Conversation history save failed; returning answer anyway.",
        error,
      );
    }
  }

  return json({
    success: true,
    answer,
    conversation_id: conversationId,
    cloud_saved: cloudSaved,
    mode: cloudSaved ? "personalized" : "built_in",
  });
});
