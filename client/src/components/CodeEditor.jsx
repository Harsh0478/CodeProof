import {useEffect,useRef} from 'react';
import Editor from '@monaco-editor/react';
import {Copy,Maximize2,Trash2,AlignLeft} from 'lucide-react';
import {formatSourceCode} from '../utils/codeFormatter';

const map={C:'c','C++':'cpp',Java:'java',Python:'python',PHP:'php','PL/SQL':'sql',COBOL:'plaintext'};

export default function CodeEditor({label,value,onChange,language,readOnly=false,onClear,onCopy,theme,autoFormat=false}){
  const editorRef=useRef(null);
  const lastFormattedRef=useRef('');
  const handleMount=(editor)=>{ editorRef.current=editor; };

  const formatEditor = (notify=true) => {
    const editor=editorRef.current;
    if(!editor) return;
    const current=editor.getValue();
    const formatted=formatSourceCode(current, language);
    if(!formatted || formatted===current) return;
    editor.executeEdits('codeproof-format',[{
      range:editor.getModel().getFullModelRange(),
      text:formatted,
      forceMoveMarkers:true,
    }]);
    editor.pushUndoStop();
    if(notify) onChange?.(formatted);
    lastFormattedRef.current=formatted;
  };

  const handlePaste=()=>{
    window.setTimeout(()=>formatEditor(true),80);
  };

  useEffect(()=>{
    if (!autoFormat || !value || !readOnly) return;
    if (value === lastFormattedRef.current) return;
    const timer=window.setTimeout(()=>{
      const formatted=formatSourceCode(value,language);
      lastFormattedRef.current=formatted;
      if(formatted && formatted!==value) onChange?.(formatted);
    },0);
    return()=>clearTimeout(timer);
  },[value,language,autoFormat,readOnly,onChange]);

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0f172a] shadow-sm dark:border-slate-700">
    <div className="flex items-center justify-between border-b border-white/10 bg-[#111c31] px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">{label}<span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">{language}</span></div>
      <div className="flex items-center gap-1 text-slate-400">
        <button title="Format code" onClick={()=>formatEditor(true)} className="focus-ring rounded-md p-1.5 hover:bg-white/10 hover:text-white"><AlignLeft size={14}/></button>
        <button title="Copy code" onClick={onCopy} className="focus-ring rounded-md p-1.5 hover:bg-white/10 hover:text-white"><Copy size={14}/></button>
        {onClear&&!readOnly&&<button title="Clear" onClick={onClear} className="focus-ring rounded-md p-1.5 hover:bg-white/10 hover:text-white"><Trash2 size={14}/></button>}
        <button title="Editor" className="focus-ring rounded-md p-1.5 hover:bg-white/10 hover:text-white"><Maximize2 size={14}/></button>
      </div>
    </div>
    <Editor
      height="380px"
      language={map[language]||'plaintext'}
      value={value}
      onChange={v=>onChange?.(v??'')}
      onMount={handleMount}
      theme="vs-dark"
      onDidPaste={handlePaste}
      options={{fontSize:14,minimap:{enabled:false},padding:{top:12},wordWrap:'on',readOnly,scrollBeyondLastLine:false,automaticLayout:true,tabSize:4,insertSpaces:true,formatOnPaste:false,formatOnType:false}}
    />
  </div>
}
