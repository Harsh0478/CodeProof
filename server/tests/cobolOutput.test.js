import test from 'node:test';
import assert from 'node:assert/strict';
import { preserveCobolNumericFormatting } from '../src/utils/cobolOutput.js';

const source = `IDENTIFICATION DIVISION.
PROGRAM-ID. SUMNUM.
DATA DIVISION.
WORKING-STORAGE SECTION.
01 A PIC 9(3) VALUE 10.
01 B PIC 9(3) VALUE 20.
01 TOTAL PIC 9(4).
PROCEDURE DIVISION.
COMPUTE TOTAL = A + B
DISPLAY "SUM = " TOTAL
STOP RUN.`;

test('preserves COBOL PIC width in C output', () => {
  const code = preserveCobolNumericFormatting(source, '#include <stdio.h>\nint main(){printf("SUM = %d\\n", TOTAL);}', 'C');
  assert.match(code, /%04d/);
});

test('preserves COBOL PIC width in Java output', () => {
  const code = preserveCobolNumericFormatting(source, 'System.out.println("SUM = " + TOTAL);', 'Java');
  assert.match(code, /String\.format\("%04d", TOTAL\)/);
});
