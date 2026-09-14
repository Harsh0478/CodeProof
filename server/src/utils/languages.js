export const LANGUAGES = {
  C: { id: 'C', name: 'C', extension: '.c', executable: 'c' },
  'C++': { id: 'C++', name: 'C++', extension: '.cpp', executable: 'cpp' },
  Java: { id: 'Java', name: 'Java', extension: '.java', executable: 'java' },
  Python: { id: 'Python', name: 'Python', extension: '.py', executable: 'python' },
  PHP: { id: 'PHP', name: 'PHP', extension: '.php', executable: 'php' },
  'PL/SQL': { id: 'PL/SQL', name: 'PL/SQL', extension: '.sql', executable: 'plsql' },
  COBOL: { id: 'COBOL', name: 'COBOL', extension: '.cob', executable: 'cobol' },
};

// Every distinct pair is explicitly configured so the language dropdowns are
// driven by the backend rather than being cosmetic. Runtime verification still
// depends on whether an execution adapter exists for both selected languages.
const languageIds = Object.keys(LANGUAGES);

export const SUPPORTED_PAIRS = languageIds
  .flatMap((sourceLanguage) => languageIds
    .filter((targetLanguage) => targetLanguage !== sourceLanguage)
    .map((targetLanguage) => ({
      sourceLanguage,
      targetLanguage,
      sourceExtension: LANGUAGES[sourceLanguage].extension,
      targetExtension: LANGUAGES[targetLanguage].extension,
      supported: true,
    })));

export function findPair(sourceLanguage, targetLanguage) {
  return SUPPORTED_PAIRS.find(
    (p) => p.sourceLanguage === sourceLanguage && p.targetLanguage === targetLanguage,
  );
}

export function supportedTargets(sourceLanguage) {
  return SUPPORTED_PAIRS
    .filter((p) => p.sourceLanguage === sourceLanguage)
    .map((p) => p.targetLanguage);
}
