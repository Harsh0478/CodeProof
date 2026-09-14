# CodeProof COBOL execution image

Build the local sandbox image from the project root:

```powershell
docker build -t codeproof/gnucobol:3.2 execution/docker/cobol
```

This image contains GnuCOBOL and GCC and is used only inside CodeProof's existing restricted Docker runner.
