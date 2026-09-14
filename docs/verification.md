# Verification

For each test:
1. Compile the original program.
2. Run the original with the provided input.
3. Use its output as the behavioral baseline when no explicit expected output was supplied.
4. Compile the translated program.
5. Run the translated program with identical input.
6. Normalize harmless whitespace/line-ending differences only.
7. Compare actual outputs.

`score = passedTests / totalTests * 100`.

State mapping:
- VERIFIED: 90–100 with no compilation/runtime errors
- PARTIALLY VERIFIED: 50–89
- FAILED: below 50
- COMPILATION ERROR / RUNTIME ERROR when execution prevents valid comparison
- AI REVIEW REQUIRED when behavioral evidence is unavailable or ambiguous
