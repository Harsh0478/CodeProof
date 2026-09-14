import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Copy, Edit3, FileCode2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { api, apiMessage } from '../services/api';

const supportedLanguageIds = ['C','C++','Java','Python','PHP','PL/SQL','COBOL'];
const fallbackPairs = supportedLanguageIds.flatMap(source => supportedLanguageIds.filter(target => target !== source).map(target => [source,target]));

const emptyForm = {
  name: '',
  sourceLanguage: 'C',
  targetLanguage: 'Java',
  category: 'Basic syntax',
  description: '',
  sourceCode: '',
  expectedCode: '',
};

export default function SamplesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pairs, setPairs] = useState(fallbackPairs.map(([sourceLanguage, targetLanguage]) => ({ sourceLanguage, targetLanguage })));

  useEffect(() => {
    api.get('/languages/pairs')
      .then(r => {
        const incoming = r.data?.pairs || [];
        if (incoming.length) setPairs(incoming);
      })
      .catch(() => {});
  }, []);

  const sourceLanguages = useMemo(() => [...new Set(pairs.map(p => p.sourceLanguage))], [pairs]);
  const targetLanguages = useMemo(
    () => [...new Set(pairs.filter(p => p.sourceLanguage === form.sourceLanguage).map(p => p.targetLanguage))],
    [pairs, form.sourceLanguage],
  );

  const load = async () => {
    try {
      const r = await api.get('/samples');
      setItems(r.data.items || []);
      setError('');
    } catch (e) {
      setError(apiMessage(e, 'Unable to load samples.'));
    }
  };

  useEffect(() => { load(); }, []);

  const cats = useMemo(() => ['All', ...new Set(items.map(x => x.category).filter(Boolean))], [items]);
  const shown = cat === 'All' ? items : items.filter(x => x.category === cat);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (sample) => {
    setEditing(sample);
    setForm({
      name: sample.name || '',
      sourceLanguage: sample.sourceLanguage || 'C',
      targetLanguage: sample.targetLanguage || 'Java',
      category: sample.category || 'Other',
      description: sample.description || '',
      sourceCode: sample.sourceCode || '',
      expectedCode: sample.expectedCode || '',
    });
    setError('');
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await api.put(`/samples/${editing._id}`, form);
      else await api.post('/samples', form);
      await load();
      setModalOpen(false);
    } catch (e) {
      setError(apiMessage(e, 'Unable to save sample.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (sample) => {
    if (sample.isBuiltIn) return;
    if (!window.confirm(`Delete "${sample.name}"?`)) return;
    try {
      await api.delete(`/samples/${sample._id}`);
      await load();
    } catch (e) {
      setError(apiMessage(e, 'Unable to delete sample.'));
    }
  };

  const useSample = (sample) => {
    navigate('/translate', {
      state: {
        sample: {
          sourceLanguage: sample.sourceLanguage,
          targetLanguage: sample.targetLanguage,
          sourceCode: sample.sourceCode,
          sampleName: sample.name,
        },
      },
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Library"
          title="Migration samples"
          description="Use a ready-made educational example, or create your own reusable migration sample and save it to MongoDB."
        />
        <button
          onClick={openAdd}
          className="mb-5 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/50"
        >
          <Plus size={17} /> Add Sample
        </button>
      </div>

      {error && !modalOpen && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${c === cat ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-[#111a2c] dark:text-slate-300 dark:ring-slate-700'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map(s => (
            <article key={s._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-[#111a2c]">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                    <FileCode2 size={18} />
                  </div>
                  <div className="flex items-center gap-2">
                    {s.isBuiltIn && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">Built-in</span>}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{s.category}</span>
                  </div>
                </div>
                <h3 className="mt-4 font-extrabold">{s.name}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>{s.sourceLanguage}</span><ArrowRight size={12} /><span>{s.targetLanguage}</span>
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{s.description}</p>
                <pre className="scrollbar-thin mt-4 max-h-40 overflow-auto rounded-xl bg-[#0f172a] p-3 text-[11px] leading-5 text-slate-200">{s.sourceCode}</pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => useSample(s)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-violet-700">
                    <Sparkles size={14} /> Use Sample
                  </button>
                  <button onClick={() => navigator.clipboard?.writeText(s.sourceCode)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-[#0c1526] dark:text-slate-200">
                    <Copy size={14} /> Copy
                  </button>
                  {!s.isBuiltIn && (
                    <>
                      <button onClick={() => openEdit(s)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-[#0c1526] dark:text-slate-200">
                        <Edit3 size={14} /> Edit
                      </button>
                      <button onClick={() => remove(s)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="No samples loaded" text="Add your first sample or run the server seed script to populate the built-in library." />}

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <form onSubmit={save} className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#111a2c]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-300">Samples</div>
                <h2 className="mt-1 text-lg font-extrabold">{editing ? 'Edit sample' : 'Add sample'}</h2>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>

            <div className="grid max-h-[75vh] gap-4 overflow-y-auto p-5 md:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Sample name</span>
                <input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-[#0c1526] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500 dark:focus:ring-violet-500/10" />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Source language</span>
                <select value={form.sourceLanguage} onChange={e => { const next=e.target.value; const nextTargets=pairs.filter(p => p.sourceLanguage===next).map(p=>p.targetLanguage); setForm(v => ({ ...v, sourceLanguage: next, targetLanguage: nextTargets.includes(v.targetLanguage) ? v.targetLanguage : (nextTargets[0] || '') })); }} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-[#0c1526] dark:text-slate-100 dark:focus:border-violet-500 dark:focus:ring-violet-500/10">
                  {sourceLanguages.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Target language</span>
                <select value={form.targetLanguage} onChange={e => setForm(v => ({ ...v, targetLanguage: e.target.value }))} required disabled={!targetLanguages.length} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0c1526] dark:text-slate-100 dark:focus:border-violet-500 dark:focus:ring-violet-500/10">
                  {targetLanguages.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Category</span>
                <input value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-[#0c1526] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500 dark:focus:ring-violet-500/10" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Description</span>
                <input value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-[#0c1526]" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Source code</span>
                <textarea required rows={12} value={form.sourceCode} onChange={e => setForm(v => ({ ...v, sourceCode: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-[#0f172a] px-3 py-3 font-mono text-xs leading-5 text-slate-100 dark:border-slate-700" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-slate-500">Expected/target code (optional)</span>
                <textarea rows={8} value={form.expectedCode} onChange={e => setForm(v => ({ ...v, expectedCode: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-[#0f172a] px-3 py-3 font-mono text-xs leading-5 text-slate-100 dark:border-slate-700" />
              </label>
              {error && <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">{error}</div>}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-[#0c1526]">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Update Sample' : 'Save Sample'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
