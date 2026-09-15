# CodeProof — AI-Verified Legacy Code Migration

> **AI translates the code. Another layer reviews it. A sandbox executes
> it. Tests compare it. CodeProof reports the evidence.**

CodeProof is an AI-powered software modernization platform for migrating
legacy programs into modern programming languages while reducing the
risk of silent logic changes.

## ✨ Features

- AI-powered legacy code translation
- AI review of generated target code
- Behavioral verification using real execution
- Docker-based isolated code execution
- Verification score and detailed reports
- Clerk authentication and protected API routes
- MongoDB persistence for translations, tests, samples and results
- Test-case create/edit/delete/rerun
- Translation history
- Reusable code samples
- Monaco code editor
- Responsive dark/light UI
- Groq + Gemini AI provider architecture
- Execution timeouts and resource/network restrictions

## 🎯 Problem Statement

Legacy software can be difficult and expensive to maintain. Manual
migration is slow and error-prone, while AI-generated translations can
compile successfully but still change the original program’s behavior.

CodeProof addresses the gap between:

> **“The translated code looks correct”**

and

> **“The translated code behaves like the original.”**

## 💡 Core Idea

A normal AI translator can follow:

``` text
Legacy Code → AI Translation → Target Code
```

CodeProof follows:

``` text
Legacy Code
    ↓
AI Translation
    ↓
AI Review
    ↓
Compile Original
    ↓
Run Original Tests
    ↓
Compile Target
    ↓
Run Target Tests
    ↓
Compare Outputs
    ↓
Verification Score
    ↓
Detailed Report
    ↓
Save History
```

Translation is therefore not treated as the final step. Actual execution
and behavioral comparison provide the verification evidence.

## 🏗️ Architecture

``` text
                         ┌─────────────────────┐
                         │       USER          │
                         │      Browser        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ React + Vite        │
                         │ Tailwind + Monaco   │
                         └──────────┬──────────┘
                                    │ Axios
                                    ▼
                         ┌─────────────────────┐
                         │ Node.js + Express   │
                         │ REST API            │
                         └──────┬───────┬──────┘
                                │       │
                    ┌───────────┘       └────────────┐
                    ▼                                ▼
             ┌─────────────┐                  ┌─────────────┐
             │ Groq        │                  │ Gemini      │
             │ AI Provider │                  │ AI Provider │
             └──────┬──────┘                  └──────┬──────┘
                    └──────────────┬─────────────────┘
                                   ▼
                          ┌─────────────────┐
                          │ AI Translation +│
                          │ AI Review       │
                          └────────┬────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
              ┌──────────────┐           ┌───────────────┐
              │ MongoDB      │           │ Docker        │
              │ + Mongoose   │           │ Sandbox       │
              └──────────────┘           └───────┬───────┘
                                                 │
                                                 ▼
                                         ┌─────────────────┐
                                         │ Compile / Run   │
                                         │ Source + Target │
                                         └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │ Compare Outputs │
                                         │ + Score + Report│
                                         └─────────────────┘
```

The browser does not directly access Groq or Gemini. Secret API keys
remain on the backend.

## 🧰 Technology Stack

| Layer          | Technology         | Purpose                           |
|----------------|--------------------|-----------------------------------|
| Frontend       | React              | User interface                    |
| Build Tool     | Vite               | Fast development/build tooling    |
| Styling        | Tailwind CSS       | Responsive UI and themes          |
| Editor         | Monaco Editor      | Professional code editing         |
| HTTP           | Axios              | Frontend ↔ backend API            |
| Backend        | Node.js + Express  | REST API and business logic       |
| Database       | MongoDB + Mongoose | Persistent application data       |
| Authentication | Clerk              | Login, sessions and user identity |
| AI             | Groq + Gemini      | Translation, review and fallback  |
| Execution      | Docker             | Isolated compilation/runtime      |
| Icons          | Lucide             | UI icons                          |
| Charts         | Recharts           | Dashboard/result visualization    |
| Source Control | Git + GitHub       | Version control                   |

## 💻 Supported Languages

Current language layer:

- C
- C++
- Java
- Python
- PHP
- COBOL
- PL/SQL

| Language | Runtime Scope              |
|----------|----------------------------|
| C        | Compile + Run              |
| C++      | Compile + Run              |
| Java     | Compile + Run              |
| Python   | Interpreter execution      |
| PHP      | PHP CLI execution          |
| COBOL    | GnuCOBOL Docker runtime    |
| PL/SQL   | Translation/review support |

**PL/SQL:** Full behavioral verification of Oracle-specific PL/SQL
requires an Oracle-compatible execution environment.

## 🔄 How Translation Works

1.  User authenticates through Clerk.
2.  User selects source and target languages.
3.  User enters code or selects a sample.
4.  Frontend sends the request to the Express API.
5.  Backend validates the request.
6.  Backend sends the source code and language pair to the configured AI
    provider.
7.  AI generates target code while being instructed to preserve logic,
    I/O, edge cases and compilability.
8.  Generated code is parsed/normalized.
9.  AI review checks the generated code.
10. Verification begins.

## 🧪 Behavioral Verification

This is the main feature of CodeProof.

For each test case:

``` text
Source Program
      │
      ├── Same Input
      ▼
 Source Output

Target Program
      │
      ├── Same Input
      ▼
 Target Output

Source Output == Target Output
             │
       ┌─────┴─────┐
       │           │
      PASS        FAIL
```

Conceptually:

``` text
for each testCase:
    sourceOut = run(source, input)
    targetOut = run(target, input)
    pass = normalize(sourceOut) == normalize(targetOut)

score = (passed / total) * 100
```

The system also reports compilation errors, runtime errors and
individual test outcomes.

### Verification Score

``` text
Verification Score =
(Passed Test Cases / Total Test Cases) × 100
```

For example:

``` text
5 / 5 × 100 = 100%
```

A 100% score means the programs matched for the executed test cases. It
is not mathematical proof of correctness for every possible input.

## 📝 Test Cases

Users can:

- Create test cases
- Edit test cases
- Delete test cases
- Rerun test cases
- Inspect source/target outputs
- See pass/fail results

Example:

| Case | Input | Source | Target | Result |
|------|-------|--------|--------|--------|
| TC01 | 0     | Even   | Even   | PASS   |
| TC02 | 7     | Odd    | Odd    | PASS   |
| TC03 | 2     | Even   | Even   | PASS   |
| TC04 | -3    | Odd    | Odd    | PASS   |
| TC05 | 10    | Even   | Even   | PASS   |

## 🐳 Secure Code Execution

User-submitted and AI-generated code is treated as **untrusted input**.

Docker provides an isolated execution environment with controls such as:

- Container isolation
- Execution timeouts
- CPU limits
- Memory limits
- Code/request-size limits
- Network restrictions
- Temporary workspaces
- Automatic cleanup

Execution flow:

``` text
Code
 ↓
Validation
 ↓
Temporary Workspace
 ↓
Docker Container
 ↓
Compile
 ↓
Execute
 ↓
Capture Output
 ↓
Compare
 ↓
Cleanup
```

Docker is a security boundary, not just a compiler environment.

## 🔐 Authentication

CodeProof uses Clerk for authentication and sessions.

``` text
User
 ↓
Clerk Login
 ↓
Clerk Session
 ↓
Frontend Auth Context / Token
 ↓
Express Authentication Middleware
 ↓
Verified User Identity
 ↓
Protected API
```

User-specific translations, tests and results are associated with the
authenticated identity.

The frontend uses only the public Clerk publishable key. Secret keys
stay on the server.

## 🗄️ MongoDB Data

MongoDB stores persistent information such as:

### Translations

- User identity
- Source language
- Target language
- Source code
- Generated target code
- Status
- Timestamps

### Verification Results

- Score
- Passed/failed counts
- Compilation errors
- Runtime errors
- Output comparisons
- Test results
- Report data

### Test Cases

- Inputs
- Expected outputs/metadata
- Execution details
- Pass/fail status

### Samples

- Reusable source/target code
- Language information

Mongoose provides schema/model structure and database operations.

## 🔌 Backend API

General request flow:

``` text
React
  ↓
Axios
  ↓
Express Route
  ↓
Authentication + Validation
  ↓
Controller / Service
  ↓
AI / Verification / Database
  ↓
Response
  ↓
React UI
```

Backend responsibilities include:

- Authentication
- Translation
- AI review
- Verification
- Code execution
- Test-case CRUD
- Samples
- Translation history
- Dashboard statistics
- Language configuration

## 🖥️ Frontend Modules

### Dashboard

Summary metrics, recent work and quick actions.

### Translate

Language selectors, Monaco editors, translation action, AI review and
verification results.

### History

Previous translations and their verification status.

### Test Cases

Create, edit, delete and rerun saved tests.

### Results

Detailed verification reports and per-test results.

### Samples

Reusable example programs with add/edit/delete/use functionality.

### Settings

Provider status and configuration visibility.

### About

Project purpose, technology and project information.

## 🎨 UI/UX

The application uses a developer-tool style interface:

- Dark navy sidebar
- Dark top bar
- Purple primary actions
- Green success/verification indicators
- Monaco code editors
- Verification score visualization
- Detailed result tables
- Responsive desktop/mobile layout
- Dark/light theme

Translation progress is shown through stages such as:

``` text
Analyzing
   ↓
Generating
   ↓
AI Review
   ↓
Compiling
   ↓
Running Source
   ↓
Running Target
   ↓
Comparing
   ↓
Report
```

## ⚠️ Error Handling

The application handles:

- Invalid/empty code
- Unsupported language pairs
- AI timeout
- AI provider failure
- Groq rate limits
- Gemini failure
- Compilation errors
- Runtime errors
- Infinite loops
- Execution timeouts
- MongoDB failures
- Authentication failures

Users should receive friendly messages rather than raw stack traces or
secret-bearing errors.

## 🔑 Environment Variables

### Frontend

`client/.env`

``` env
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

### Backend

`server/.env`

``` env
PORT=5000
MONGODB_URI=...
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
GROQ_API_KEY=...
GEMINI_API_KEY=...
EXECUTION_TIMEOUT=...
```

**Important:** Never put secret database, AI or server credentials
inside `VITE_` variables. Never commit `.env` files to GitHub.

## 📁 Project Structure

``` text
CodeProof/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── routes/
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   └── verification/
│
├── execution/
│   └── docker/
│       └── language-runners/
│
├── .gitignore
├── README.md
└── ...
```

## 🚀 Local Setup

### Prerequisites

- Node.js
- npm
- MongoDB/MongoDB Atlas
- Docker Desktop
- Git

### Clone

``` bash
git clone https://github.com/YOUR_USERNAME/CodeProof.git
cd CodeProof
```

### Install dependencies

``` bash
cd client
npm install

cd ../server
npm install
```

Configure `client/.env` and `server/.env`, then start both applications.

### Start backend

``` bash
npm run dev --prefix server
```

### Start frontend

``` bash
npm run dev --prefix client
```

Typical local URLs:

``` text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

Docker Desktop must be running for code execution and behavioral
verification.

## ☁️ Deployment Architecture

Recommended production separation:

``` text
GitHub
 ├──────────────→ Vercel
 │                 React/Vite Frontend
 │
 └──────────────→ Render
                   Node/Express API
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
        MongoDB Atlas  Groq/Gemini  Clerk
                         │
                         ▼
                  Docker Sandbox
                Dedicated Executor
```

Recommended components:

| Component      | Platform              |
|----------------|-----------------------|
| Source Control | GitHub                |
| Frontend       | Vercel                |
| Backend        | Render                |
| Database       | MongoDB Atlas         |
| Authentication | Clerk                 |
| AI             | Groq + Gemini         |
| Execution      | Dedicated Docker host |

The Docker execution environment should be separated from the normal
web/API hosting environment because it handles untrusted code and may
require privileged container capabilities.

## 🔒 Security Principles

### Web/API

- CORS
- Secure headers
- Rate limiting
- Request-size limits
- Input validation
- Authentication
- Friendly errors

### Secrets

- Environment variables
- Server-side AI keys
- Server-side database credentials
- Protected routes
- No secrets in frontend bundles
- No secrets committed to Git

### Execution

- Docker isolation
- CPU/memory limits
- Timeouts
- Temporary workspaces
- Network restrictions
- Automatic cleanup

> **Never trust generated code, user code or external AI responses
> without validation and controlled execution.**

## 🎬 Demo Flow

1.  Login using Clerk.
2.  Choose a language pair such as `COBOL → Java` or `C → Java`.
3.  Paste code or click **Use Sample**.
4.  Click **Translate**.
5.  Show the staged loading process.
6.  Show generated target code and AI review.
7.  Run verification tests.
8.  Show source/target outputs.
9.  Show PASS/FAIL and verification score.
10. Open History to demonstrate persistence.

For a live demo, use a small deterministic program so results are quick
and easy to explain.

## ⚠️ Limitations

- LLM translation is probabilistic.
- Tests provide observed confidence, not formal proof.
- Language semantics may differ between source and target languages.
- Pointers, memory models, concurrency and platform-specific libraries
  may require human review.
- Full Oracle-specific PL/SQL execution requires a compatible Oracle
  environment.
- Strong sandbox isolation increases infrastructure complexity and
  resource requirements.

## 🔮 Future Scope

- More language pairs
- Framework-aware migration
- Oracle-compatible PL/SQL execution
- AST/semantic comparison
- Mutation testing
- Larger regression-test generation
- Whole-repository migration
- Human approval workflow
- Audit trails
- Role-based administration
- CI/CD integration
- Cloud worker queues
- Explainable verification reports
- Scalable distributed execution

## 🎓 Viva Quick Questions

**Why use AI?**  
AI reduces manual translation time and maps syntax/programming idioms
between languages.

**Why verify after translation?**  
Generated code can look correct while changing runtime behavior.

**Why execute both programs?**  
Behavioral comparison needs observable execution evidence, not only
source-code similarity.

**Why Docker?**  
User and AI-generated code is untrusted and needs controlled execution.

**Why Groq + Gemini?**  
Multiple providers support primary, fallback and/or review paths and
improve resilience.

**What is the verification score?**  
`(Passed Tests / Total Tests) × 100`

**Does 100% mean complete correctness?**  
No. It means the tested behaviors matched.

**Why MongoDB?**  
It provides flexible document storage for translations, tests, results
and samples.

**Why Clerk?**  
It provides authentication and session infrastructure without building a
complete custom authentication system.

**What is the strongest feature?**  
Independent behavioral verification after AI translation.

## 🧠 One-Line Explanation

> **CodeProof uses AI to translate legacy code, reviews the generated
> code, executes both versions in a secure sandbox, compares their
> behavior through tests, and reports evidence of migration quality.**

## 🤝 Contributing

``` bash
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

Before creating a pull request:

- Test the frontend
- Test backend APIs
- Test authentication
- Test translation
- Test verification
- Test Docker execution
- Never commit secrets

## 🔐 Security Notice

Never commit:

``` text
.env
API keys
MongoDB passwords
Clerk secret keys
AI provider credentials
Session tokens
```

If credentials are exposed, rotate them immediately.

## 📜 License

Add your institution/project-specific license here before publishing the
repository.

------------------------------------------------------------------------

### ❤️ CodeProof

**AI Translation → AI Review → Secure Execution → Behavioral
Verification → Evidence**

Built as a Final-Year B.Tech IT project.
