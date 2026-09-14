import { connectDB } from './config/db.js';
import Sample from './models/Sample.js';

const samples = [
  {name:'C addition → Java',sourceLanguage:'C',targetLanguage:'Java',category:'Basic syntax',description:'Two integers and addition.',isBuiltIn:true,sourceCode:'#include <stdio.h>\nint main(){int a,b; scanf("%d %d",&a,&b); printf("%d\\n",a+b); return 0;}'},
  {name:'C factorial → Java',sourceLanguage:'C',targetLanguage:'Java',category:'Loops',description:'Iterative factorial.',isBuiltIn:true,sourceCode:'#include <stdio.h>\nint main(){int n; scanf("%d",&n); long long f=1; for(int i=2;i<=n;i++) f*=i; printf("%lld\\n",f); return 0;}'},
  {name:'C prime → Java',sourceLanguage:'C',targetLanguage:'Java',category:'Loops',description:'Prime check.',isBuiltIn:true,sourceCode:'#include <stdio.h>\nint main(){int n; scanf("%d",&n); int p=n>1; for(int i=2;i*i<=n;i++) if(n%i==0) p=0; printf(p?"Prime\\n":"Not Prime\\n"); return 0;}'},
  {name:'C array sum → Java',sourceLanguage:'C',targetLanguage:'Java',category:'Arrays',description:'Reads n integers and returns sum.',isBuiltIn:true,sourceCode:'#include <stdio.h>\nint main(){int n; scanf("%d",&n); long long s=0,x; for(int i=0;i<n;i++){scanf("%lld",&x);s+=x;} printf("%lld\\n",s); return 0;}'},
  {name:'C++ class → Java',sourceLanguage:'C++',targetLanguage:'Java',category:'Object-oriented concepts',description:'Simple class and method.',isBuiltIn:true,sourceCode:'#include <iostream>\nusing namespace std; class Box{public:int x; Box(int v):x(v){} int doubleValue(){return x*2;}}; int main(){int n;cin>>n;Box b(n);cout<<b.doubleValue()<<"\n";}'},
  {name:'Python arithmetic → Java',sourceLanguage:'Python',targetLanguage:'Java',category:'Basic syntax',description:'Arithmetic expression.',isBuiltIn:true,sourceCode:'a,b=map(int,input().split())\nprint(a*b+a-b)'},
  {name:'PL/SQL function → Java',sourceLanguage:'PL/SQL',targetLanguage:'Java',category:'Database procedures',description:'Educational pure-function example; execution requires Oracle-compatible runtime.',isBuiltIn:true,sourceCode:'CREATE OR REPLACE FUNCTION add_nums(a NUMBER,b NUMBER) RETURN NUMBER IS\nBEGIN\n RETURN a+b;\nEND;'},
  {name:'PL/SQL conditional → Java',sourceLanguage:'PL/SQL',targetLanguage:'Java',category:'Database procedures',description:'Educational conditional logic.',isBuiltIn:true,sourceCode:'DECLARE\n n NUMBER := 10;\nBEGIN\n IF n > 0 THEN DBMS_OUTPUT.PUT_LINE(\'Positive\'); ELSE DBMS_OUTPUT.PUT_LINE(\'Non-positive\'); END IF;\nEND;'},
  {name:'PHP arithmetic → Python',sourceLanguage:'PHP',targetLanguage:'Python',category:'Basic syntax',description:'Simple PHP arithmetic example.',isBuiltIn:true,sourceCode:`<?php
$a=7; $b=5; echo ($a+$b), PHP_EOL;
?>`},
  {name:'COBOL addition → Java',sourceLanguage:'COBOL',targetLanguage:'Java',category:'Basic syntax',description:'Simple free-format COBOL arithmetic.',isBuiltIn:true,sourceCode:`IDENTIFICATION DIVISION.
PROGRAM-ID. ADDNUM.
DATA DIVISION.
WORKING-STORAGE SECTION.
01 A PIC 9(4) VALUE 7.
01 B PIC 9(4) VALUE 5.
01 C PIC 9(5).
PROCEDURE DIVISION.
COMPUTE C = A + B.
DISPLAY C.
STOP RUN.`},
];

await connectDB();
await Sample.deleteMany({});
await Sample.insertMany(samples);
console.log(`Seeded ${samples.length} samples`);
process.exit(0);
