<div align="center">

# 📝 AI Assignment Feedback Assistant

### 🎓 Rubric-based, actionable feedback for students. Full control for teachers. 👩‍🏫

**🏆 ED-02 · Education Track  |  👥 Team CodeBite**

⚛️ React + Vite  •  🐍 FastAPI  •  🧠 Claude / Gemini  •  ✏️ Teacher-in-the-loop

</div>

---

## 📌 Table of Contents

1. [🎯 Problem Statement](#-problem-statement)
2. [💡 Our Solution](#-our-solution)
3. [✅ MVP Checklist](#-mvp-checklist)
4. [⚙️ How It Works](#️-how-it-works)
5. [✨ Key Features](#-key-features)
6. [🧰 Tech Stack](#-tech-stack)
7. [📁 Project Structure](#-project-structure)
8. [🚀 Getting Started](#-getting-started)
9. [🎬 Demo Walkthrough](#-demo-walkthrough)
10. [🌐 Deployment](#-deployment)
11. [🛡️ Responsible AI](#️-responsible-ai)
12. [📐 Scope and Limitations](#-scope-and-limitations)
13. [🔭 Future Roadmap](#-future-roadmap)
14. [👥 Team CodeBite](#-team-codebite)

---

## 🎯 Problem Statement

> **ED-02 | AI Assignment Feedback Assistant**

Students often receive **⏳ delayed or limited feedback** on their assignments. Teachers spend a large part of their time:

- 🔍 finding the **same recurring mistakes** across many submissions, and
- 🔁 **explaining again and again** how students can improve.

**Result:** slow feedback, inconsistent comments, and teachers busy with repetitive work instead of teaching. 😓

---

## 💡 Our Solution

**AI Assignment Feedback Assistant** checks a student's submission against a **teacher-defined rubric** and produces **specific, criterion-by-criterion feedback** in seconds. ⚡

> 🤝 **The AI writes the first draft. The teacher stays in charge.**

Every piece of feedback appears in an **Instructor Review** panel where the teacher can read, edit and approve it before it reaches the student.

```
 👩‍🏫 Teacher sets rubric  ──►  🧑‍🎓 Student essay added  ──►  🤖 AI drafts feedback
                                                                    │
                                                                    ▼
          📤 Student gets final feedback  ◄──  ✏️ Teacher reviews and edits
```

---

## ✅ MVP Checklist

How the project maps to the expected MVP in the problem statement:

| 🎯 Expected MVP | Status | 🔧 How we deliver it |
|---|:---:|---|
| Accept a text-based assignment or document | ✅ | Text submission box (minimum 20 characters) plus an optional assignment prompt for context |
| Let teachers define or select rubric criteria | ✅ | Editable rubric: add or remove criteria, rename them, set points and a description for each |
| Generate criterion-based feedback and identify missing concepts | ✅ | The LLM comments on each rubric criterion separately and points out what is missing |
| Suggest practical improvements with supporting examples | ✅ | Each criterion includes concrete suggestions on how to improve |
| Provide an instructor review and editing interface | ✅ | "Instructor review" panel where all feedback is fully editable before sharing |

---

## ⚙️ How It Works

```
 ┌───────────────────┐     ┌────────────────────┐     ┌────────────────────┐
 │ ⚛️  React Frontend │ ──► │ 🐍 FastAPI Backend │ ──► │ 🧠 LLM Layer       │
 │    (Vite)         │ ◄── │    (REST API)      │ ◄── │   Claude / Gemini  │
 └───────────────────┘     └────────────────────┘     └────────────────────┘
           │
           ▼
 ┌─────────────────────────────────┐
 │ ✏️  Instructor Review (editable) │
 └─────────────────────────────────┘
```

**Step by step**

1. 🧩 **Define the rubric.** The teacher edits criteria, points and descriptions. Default: 5 criteria worth 40 points for an argumentative essay.
2. 📄 **Add the submission.** Paste the student's essay, and optionally the assignment prompt.
3. 🤖 **Generate.** The backend sends the rubric and the essay to the LLM with instructions to evaluate strictly against the rubric.
4. ✏️ **Review.** The draft feedback appears per criterion. The teacher edits anything, then shares it.

---

## ✨ Key Features

| | Feature | What it gives you |
|:---:|---|---|
| 🎯 | **Rubric-driven evaluation** | Feedback follows the teacher's own criteria, not generic AI opinions |
| 🧩 | **Fully editable rubric** | Add, remove and rename criteria, and change points on the fly |
| 📊 | **Criterion-wise feedback** | Clear comments for each criterion instead of one vague paragraph |
| 🔍 | **Missing concept detection** | Highlights what the student did not cover |
| 💬 | **Actionable suggestions** | Practical, specific tips on how to improve |
| ✏️ | **Instructor review interface** | The teacher edits everything before sharing |
| 🔀 | **Multi-model support** | Switch between Claude and Gemini by setting one API key. A header badge shows the active model |
| 🛡️ | **Draft, not a verdict** | Output is always an editable draft, never an unquestionable grade |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| 🎨 Frontend | React, Vite |
| ⚙️ Backend | Python, FastAPI, Uvicorn |
| 🧠 AI / NLP | Large Language Models: Anthropic Claude, Google Gemini |
| 📏 Evaluation approach | Rubric-based prompting |
| 🔐 Configuration | Environment variables (`.env`) |
| ☁️ Hosting (suggested) | Vercel or Netlify for the frontend, Render for the backend |

---

## 📁 Project Structure

```
.
├── backend/
│   ├── main.py             # FastAPI app and API routes
│   ├── llm.py              # LLM provider logic (Claude / Gemini)
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Template for API keys
│
├── frontend/
│   ├── src/                # React components and UI
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 📋 Prerequisites

- 🐍 Python 3.10 or newer
- 🟢 Node.js 18 or newer, with npm
- 🔑 An API key for **Anthropic (Claude)** or **Google (Gemini)**

### 1️⃣ Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2️⃣ Backend setup

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### 3️⃣ Add your API key

Copy `backend\.env.example` to `backend\.env` and set **one** of these:

```env
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

- `ANTHROPIC_API_KEY` uses Claude.
- `GEMINI_API_KEY` uses Gemini. If both are set, **Gemini takes priority**.

### 4️⃣ Frontend setup

```powershell
cd frontend
npm install
```

### 5️⃣ Run the app

Open **two terminals** from the project root.

**🖥️ Terminal 1: Backend**

```powershell
cd backend
..\.venv\Scripts\uvicorn.exe main:app --reload
```

**🌐 Terminal 2: Frontend**

```powershell
cd frontend
npm run dev
```

👉 Open **http://localhost:5173**. The badge in the header shows which model is active.

> 💡 On macOS or Linux, activate the environment with `source .venv/bin/activate` and run `uvicorn main:app --reload`.

---

## 🎬 Demo Walkthrough

1. 👀 Open the app and check the **model badge** in the header.
2. 📝 *(Optional)* Type an assignment prompt, for example: "Argue whether schools should adopt a four-day week."
3. 🧩 Review or edit the **rubric** (Thesis and Argument, Evidence and Support, and so on).
4. 📄 Paste a **student essay** (at least 20 characters).
5. ✨ Click **Generate feedback**.
6. ✏️ In the **Instructor review** panel, read, edit and finalize the feedback.

---

## 🌐 Deployment

The frontend and backend are deployed separately.

| Part | Platform | Key settings |
|---|---|---|
| 🐍 Backend | Render (Web Service) | Root: `backend`. Build: `pip install -r requirements.txt`. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| ⚛️ Frontend | Vercel or Netlify | Root: `frontend`. Build: `npm run build`. Output: `dist` |

🔑 Set `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` in the **environment variables of the backend host**. Never commit keys to the repository.

🔗 **Live demo:** _add link here_

---

## 🛡️ Responsible AI

This tool is built to **support** teachers, not replace them.

- 🙋 **Human in the loop.** Nothing reaches the student without the teacher's review.
- ✏️ **Editable by design.** Every comment and suggestion can be changed or deleted.
- ⚖️ **Not a final grade.** Output is a draft aid and is never presented as an unquestionable score.
- 👁️ **Rubric transparency.** The AI is guided by criteria the teacher can see and control.
- 🔐 **Key safety.** API keys stay in `.env`, which is ignored by Git and never exposed to the browser.

---

## 📐 Scope and Limitations

As required by the problem statement, this MVP is intentionally focused:

- 📝 **One assignment type:** argumentative essay
- 🧩 **A small set of rubric criteria**, which the teacher can edit
- 🔤 **Text-based input** only
- ⚠️ LLM output can occasionally be imperfect, which is why **teacher review is built into the workflow**

---

## 🔭 Future Roadmap

- 📎 Upload support for PDF and DOCX files
- 🗂️ More assignment types and ready-made rubric templates
- 📈 Class-level analytics to surface **recurring mistakes** across many submissions
- 🧑‍🎓 Student-facing view with revision tracking
- 🌍 Multi-language feedback
- 💾 Saved rubrics and submission history

---

## 👥 Team CodeBite

| Role | Name |
|---|---|
| 👑 **Team Leader** | **Raju Kumar Deewan** |
| 🧑‍💻 Team Member | **Danish Memon** |
| 🧑‍💻 Team Member | **Mujahid Hussain** |

---

<div align="center">

**🏁 Built by Team CodeBite for ED-02: AI Assignment Feedback Assistant**

*⚡ Faster feedback for students. 🧠 Less repetitive work for teachers.*

</div>