# Supported Languages

CodeProof now exposes the following languages in the source and target dropdowns:

- C
- C++
- Java
- Python
- PHP
- PL/SQL
- COBOL

## Language-pair architecture

All distinct source → target combinations are configured by the backend. The frontend reads `/api/languages/pairs`, so the dropdowns stay in sync with backend configuration.

## Execution adapters

| Language | Execution | Runtime |
|---|---|---|
| C | Supported | `gcc:14-alpine` |
| C++ | Supported | `gcc:14-alpine` |
| Java | Supported | `eclipse-temurin:21-jdk-alpine` |
| Python | Supported | `python:3.13-alpine` |
| PHP | Supported | Docker Official `php:8.5-cli-alpine` |
| COBOL | Supported | local `codeproof/gnucobol:3.2` image |
| PL/SQL | Translation/review only | Oracle-compatible runtime adapter required |

COBOL execution uses a local `codeproof/gnucobol:3.2` image built from the included `execution/docker/cobol/Dockerfile`. This avoids depending on an unverified third-party runtime image.

PL/SQL remains intentionally marked as non-executable unless an Oracle-compatible runtime is configured; CodeProof must not claim behavioral verification for PL/SQL without that runtime.
