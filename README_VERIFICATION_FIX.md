# CodeProof Verification Stability Fix

This build keeps the existing editor auto-formatting and automatic source-language detection while fixing the verification boundary.

## Verification fixes
- Performs a Docker daemon preflight before any compile/run work.
- Treats Docker daemon/API failures as `UNAVAILABLE`, never as fake compilation/runtime errors.
- Does not compare outputs when one side did not execute.
- Does not count `UNAVAILABLE` cases as failed behavioral tests.
- Score is `null` when behavioral verification could not be established because the sandbox was unavailable.
- Keeps stdin attached to Docker runs (`-i`) so `scanf`, `cin`, `Scanner`, `input()` and similar programs receive test input.
- Classifies Docker connection errors returned with a non-zero Docker CLI exit code as sandbox-unavailable.
- Adds deterministic preservation of common COBOL `PIC 9(n)` fixed-width/leading-zero DISPLAY output for C, C++, Java, Python and PHP.
- Filters generated integer test inputs that exceed a normal 32-bit target integer range unless the source clearly uses a wider integer type.

## Editor features retained
- Automatic source-language detection for C, C++, Java, Python, PHP, PL/SQL and COBOL.
- Debounced detection while typing/pasting.
- Paste/code formatting and literal escaped-newline cleanup.
