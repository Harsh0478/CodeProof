# Docker execution

CodeProof currently uses hardened official language images directly:
- `gcc:14-alpine` for C/C++
- `eclipse-temurin:21-jdk-alpine` for Java
- `python:3.13-alpine` for Python
- `php:8.5-cli-alpine` for PHP (Docker Official Image)
- `codeproof/gnucobol:3.2` for COBOL (build locally from the included Dockerfile)

The ExecutionService passes `--network none`, CPU/memory/PID limits, a read-only root filesystem, a tmpfs for temporary runtime needs, and a temporary project directory. For a higher-assurance deployment, move execution to a dedicated worker host and apply Docker daemon restrictions outside the application process.

## COBOL

The COBOL adapter compiles free-format `.cob` source with `cobc -x -free` and runs the resulting executable. Build the COBOL image once before testing COBOL: `docker build -t codeproof/gnucobol:3.2 execution/docker/cobol`. After that, the normal sandbox runner uses the local image with network disabled during execution.

## PL/SQL

PL/SQL remains translation/review-only. A real Oracle-compatible runtime is required before enabling execution and behavioral verification.
