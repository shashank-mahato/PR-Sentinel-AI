# 🛡️ PR Sentinel AI

## AI Code Reviews Before Bugs Reach Production 🚀

**PR Sentinel AI** is a real-time AI-powered code review assistant that connects with GitHub and automatically reviews pull requests before code gets merged.

It uses **Google Gemini AI** to analyze real pull request diffs, detect bugs, security risks, performance issues, code smells, and missing tests, then posts actionable review comments directly on the GitHub PR.

---

## 👥 Team R&S Amora

Built by **Team R&S Amora**

### Team Members

- **Shashank Mahato**  
  LinkedIn: [linkedin.com/in/shashank-mahato](https://linkedin.com/in/shashank-mahato/)

- **Riti Prabhakar**  
  LinkedIn: [linkedin.com/in/ritiprabhakar](https://linkedin.com/in/ritiprabhakar/)

---

## 🌐 Live Project

**Live App:**  
[https://pr-sentinel-ai.vercel.app](https://pr-sentinel-ai.vercel.app)

**GitHub Repository:**  
[https://github.com/shashank-mahato/PR-Sentinel-AI](https://github.com/shashank-mahato/PR-Sentinel-AI)

---

## 🧠 Problem

Developers spend a lot of time manually reviewing pull requests.

Even after review, important issues can still be missed, such as:

- Security vulnerabilities
- Bugs
- Performance problems
- Missing validation
- Missing tests
- Risky code logic
- Code quality issues

This can lead to bad code being merged and reaching production.

---

## 💡 Solution

**PR Sentinel AI** acts like an AI-powered senior code reviewer.

When a developer opens or updates a GitHub pull request, PR Sentinel AI automatically:

1. Receives the GitHub pull request event.
2. Fetches the real changed code.
3. Reviews the pull request using Gemini AI.
4. Detects bugs, security risks, performance issues, and missing tests.
5. Generates a risk score.
6. Saves the review in the dashboard.
7. Posts a useful review comment directly on the GitHub PR.

This helps developers catch issues before the code reaches production.

---

## ✨ Key Features

- 🔗 Real GitHub App integration
- ⚡ Real-time pull request review
- 🤖 Gemini-powered AI code analysis
- 🛡️ Security vulnerability detection
- 🐞 Bug detection
- 🚀 Performance issue detection
- 🧹 Code smell detection
- 🧪 Missing test detection
- 📊 Risk scoring
- 💬 Automated GitHub PR comments
- 📄 Full review report
- 📁 Repository dashboard
- 🔐 Secure authentication

---

## 🔄 How It Works

```txt
Developer opens/updates a GitHub PR
        ↓
GitHub sends webhook to PR Sentinel AI
        ↓
PR Sentinel AI fetches changed code
        ↓
Gemini AI reviews the PR diff
        ↓
Findings are saved in the dashboard
        ↓
AI review comment is posted on GitHub PR
```

---

## 🧪 Example

If a pull request contains risky code like:

```ts
const password = "admin123";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  const user = await db.query("SELECT * FROM users WHERE id = " + id);

  return Response.json(user);
}
```

PR Sentinel AI can detect:

```txt
🚨 Hardcoded Secret
A password is directly written in the source code.

🚨 SQL Injection Risk
User input is directly concatenated into a database query.

⚠️ Missing Input Validation
The id parameter is not validated before use.

⚠️ Missing Error Handling
Database errors are not handled safely.
```

---

## 📊 Dashboard

The dashboard helps teams track pull request quality.

It shows:

- Reviewed pull requests
- Connected repositories
- Risk score
- Review status
- Number of findings
- Full review details
- Suggested fixes

---

## 💬 GitHub PR Comments

PR Sentinel AI posts review comments directly inside GitHub.

A review comment includes:

- Risk score
- Merge recommendation
- Findings summary
- Top issues
- Suggested fixes
- Full report link

This lets developers see AI feedback without leaving GitHub.

---

## 🛠️ Tech Stack

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **Supabase**
- **GitHub App**
- **Google Gemini AI**
- **Vercel**

---

## 🏆 Why PR Sentinel AI Matters

PR Sentinel AI helps teams:

- Save review time
- Catch bugs earlier
- Improve code quality
- Reduce production risk
- Strengthen security review
- Give instant feedback to developers
- Make pull request reviews more consistent

---

## 📌 Demo Flow

During demo, we show:

1. A live GitHub pull request.
2. PR Sentinel AI reviewing the changed code.
3. Gemini-generated findings.
4. AI review comment on GitHub.
5. Dashboard showing the review.
6. Full report with risk score and fixes.

---

## ⭐ Final Tagline

**PR Sentinel AI — AI code reviews before bugs reach production.**
