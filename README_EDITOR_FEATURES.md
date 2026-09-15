# CodeProof Editor Enhancements

This build adds editor-only usability improvements without changing the translation pipeline:

- Automatic source-language detection while typing/pasting supported code.
- Automatic formatting for source and generated code.
- Manual Format Code action in the Monaco editor.
- Generated target code is formatted before display.

Verification/runtime behavior is preserved from the verification-fixed baseline. The C/C++ runner uses the current official `gcc:14` image tag.
