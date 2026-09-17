export const translationPrompt = ({
  sourceLanguage,
  targetLanguage,
  sourceCode,
}) => `You are an expert software migration engineer.
Translate the following source code from ${sourceLanguage} to ${targetLanguage}.
Requirements:
1. Preserve original logic and algorithm.
2. Preserve input/output behavior.
3. Preserve relevant edge cases.
4. Produce compilable, idiomatic ${targetLanguage} code.
5. Do not invent functionality.
6. Do not remove required functionality.
7. Use equivalent language constructs when direct syntax differs.
8. Return only the translated source code in the "code" field.

SOURCE LANGUAGE: ${sourceLanguage}
TARGET LANGUAGE: ${targetLanguage}

SOURCE CODE:
${sourceCode}`;

export const testPrompt = ({
  sourceLanguage,
  targetLanguage,
  sourceCode,
}) => `Generate 5-8 deterministic behavioral test inputs for a program migration from ${sourceLanguage} to ${targetLanguage}.
Prefer normal, boundary, zero, negative and large values where meaningful. Return JSON only as {"tests":[{"name":"TC_01","input":"..."}]}. Do not invent prompts or interactive instructions. Analyze the source program's expected stdin format first.

${sourceCode}`;

export const reviewPrompt = ({
  sourceLanguage,
  targetLanguage,
  sourceCode,
  generatedCode,
}) => `Review a translated program for behavioral equivalence.
Assess syntax plausibility, semantics, logic preservation, input handling, output behavior and edge cases.
Return only JSON.
SOURCE: ${sourceLanguage}
TARGET: ${targetLanguage}
SOURCE CODE:
${sourceCode}
GENERATED CODE:
${generatedCode}`;
