# CodeProof Auto Detection + Stable Verification

This build keeps the stable COBOL verification baseline and adds:

- Automatic source-language detection for C, C++, Java, Python, PHP, PL/SQL and COBOL.
- Detection is debounced and updates the From Language dropdown after code changes.
- Manual language selection is preserved until the code is edited/pasted again.
- Paste formatting and source cleanup in Monaco.
- Generated-code cleanup before display and before translation submission.
- Docker stdin forwarding for interactive console programs.
- Docker image preflight/pull so a first-time image download is not mistaken for a program timeout.
- Docker image preparation failures are reported as sandbox unavailable rather than runtime errors.

The verification engine remains based on actual source/target execution and output comparison.
