# AI Pipeline

Groq is the primary translator. Gemini reviews the generated code for syntax, semantics, input/output behavior and edge cases. When configured, Gemini can also translate if Groq is unavailable.

The server uses structured response formats where supported. The response is validated before the application continues. AI review is advisory; executable behavioral tests remain the primary verification evidence.


## Language coverage

The same AI pipeline can translate among C, C++, Java, Python, PHP, PL/SQL, and COBOL. Behavioral verification is only marked executable when both selected languages have an execution adapter; PL/SQL is intentionally excluded from runtime verification until an Oracle-compatible runtime is configured.
