# CodeProof Architecture

```mermaid
flowchart TB
UI[React Client] --> API[Express REST API]
API --> AUTH[JWT Auth]
API --> DB[(MongoDB)]
API --> AI[AI Services]
AI --> GROQ[Groq]
AI --> GEM[Gemini]
API --> VERIFY[Verification Service]
VERIFY --> EXEC[Execution Service]
EXEC --> DOCKER[Docker Sandbox]
VERIFY --> COMPARE[Output Comparator]
```

## Trust boundaries
1. Browser → API: authenticated HTTPS requests.
2. API → providers: server-side secrets only.
3. API → execution: untrusted user code crosses into a containerized sandbox.
4. Database stores translation metadata, code, tests and verification artifacts.
