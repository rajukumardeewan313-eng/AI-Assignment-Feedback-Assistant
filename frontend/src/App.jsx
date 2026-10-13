import { useEffect, useState } from 'react'

const DEFAULT_RUBRIC = [
  { name: 'Thesis & Argument', description: 'Clear, arguable thesis that is maintained throughout.', max_points: 10 },
  { name: 'Evidence & Support', description: 'Relevant evidence and examples that are explained and tied to the claim.', max_points: 10 },
  { name: 'Counterargument', description: 'Acknowledges and responds to opposing views.', max_points: 5 },
  { name: 'Organization', description: 'Logical structure, clear paragraphs and transitions.', max_points: 10 },
  { name: 'Language & Mechanics', description: 'Clear style, grammar, spelling and punctuation.', max_points: 5 },
]

// Lucide icon paths (24x24, stroke). Inline to avoid an icon dependency.
const ICONS = {
  x: 'M18 6 6 18M6 6l12 12',
  plus: 'M12 5v14M5 12h14',
  upload: 'M12 3v12M7 8l5-5 5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
  sparkles: 'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2zM19 3v4M21 5h-4',
  check: 'M20 6 9 17l-5-5',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  download: 'M12 3v12M7 10l5 5 5-5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  clipboard: 'M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
  chevron: 'M6 9l6 6 6-6',
}

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

async function api(path, options) {
  const res = await fetch(path, options)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = body.detail
    throw new Error(typeof d === 'string' ? d : d ? JSON.stringify(d) : `Request failed (${res.status})`)
  }
  return body
}

// Editable list shown as one-item-per-line textarea.
function LinesField({ label, tone, icon, value, onChange }) {
  return (
    <label className={`lines tone-${tone}`}>
      <span className="lines-label"><Icon name={icon} size={14} />{label}</span>
      <textarea value={value.join('\n')} placeholder="One item per line"
        onChange={(e) => onChange(e.target.value.split('\n'))} />
    </label>
  )
}

function toMarkdown(fb) {
  const total = fb.criteria.reduce((s, c) => s + Number(c.suggested_score || 0), 0)
  const max = fb.criteria.reduce((s, c) => s + c.max_points, 0)
  const list = (xs) => xs.filter((x) => x.trim()).map((x) => `- ${x}`).join('\n')
  let md = `# Assignment Feedback\n\n${fb.overall_summary}\n\n**Score: ${total} / ${max}**\n`
  for (const c of fb.criteria) {
    md += `\n## ${c.name} — ${c.suggested_score}/${c.max_points}\n\n${c.rationale}\n`
    if (list(c.strengths)) md += `\n**Strengths**\n${list(c.strengths)}\n`
    if (list(c.issues)) md += `\n**Issues**\n${list(c.issues)}\n`
    if (list(c.missing_concepts)) md += `\n**Missing**\n${list(c.missing_concepts)}\n`
    if (c.suggestions.length) {
      md += `\n**How to improve**\n`
      md += c.suggestions.map((s) => `- ${s.suggestion}${s.example ? `\n  - Example: ${s.example}` : ''}`).join('\n') + '\n'
    }
  }
  if (list(fb.missing_concepts)) md += `\n## Missing concepts overall\n${list(fb.missing_concepts)}\n`
  return md
}

function Step({ n, title, aside, children }) {
  return (
    <section className="step">
      <header className="step-head">
        <span className="step-num" aria-hidden="true">{n}</span>
        <h2>{title}</h2>
        {aside && <span className="step-aside">{aside}</span>}
      </header>
      {children}
    </section>
  )
}

function Skeleton() {
  return (
    <div className="skeleton-wrap" aria-busy="true" aria-label="Generating feedback">
      <div className="skeleton" style={{ height: 96 }} />
      {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
    </div>
  )
}

export default function App() {
  const [health, setHealth] = useState(null)
  const [assignmentPrompt, setAssignmentPrompt] = useState('')
  const [rubric, setRubric] = useState(DEFAULT_RUBRIC)
  const [submission, setSubmission] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [reviewed, setReviewed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/health').then(setHealth).catch(() => setHealth({ provider: 'offline' }))
  }, [])

  const setCriterion = (i, patch) => setRubric(rubric.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const setFb = (patch) => { setFeedback({ ...feedback, ...patch }); setReviewed(false) }
  const setFbCriterion = (i, patch) =>
    setFb({ criteria: feedback.criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  const setSuggestion = (i, k, patch) =>
    setFbCriterion(i, { suggestions: feedback.criteria[i].suggestions.map((x, m) => (m === k ? { ...x, ...patch } : x)) })

  async function upload(file) {
    if (!file) return
    setError('')
    const form = new FormData()
    form.append('file', file)
    try {
      setSubmission((await api('/api/extract', { method: 'POST', body: form })).text)
      setFileName(file.name)
    } catch (err) {
      setError(err.message)
    }
  }

  async function generate() {
    setBusy(true)
    setError('')
    try {
      const fb = await api('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_prompt: assignmentPrompt, submission, rubric }),
      })
      setFeedback(fb)
      setReviewed(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([toMarkdown(feedback)], { type: 'text/markdown' }))
    Object.assign(document.createElement('a'), { href: url, download: 'feedback.md' }).click()
    URL.revokeObjectURL(url)
  }

  async function copy() {
    await navigator.clipboard.writeText(toMarkdown(feedback))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const words = submission.trim() ? submission.trim().split(/\s+/).length : 0
  const rubricMax = rubric.reduce((s, c) => s + (Number(c.max_points) || 0), 0)
  const total = feedback?.criteria.reduce((s, c) => s + Number(c.suggested_score || 0), 0)
  const max = feedback?.criteria.reduce((s, c) => s + c.max_points, 0)
  const pct = feedback && max ? Math.round((total / max) * 100) : 0
  const rubricValid = rubric.length > 0 && rubric.every((c) => c.name.trim())
  const canGenerate = !busy && submission.trim().length >= 20 && rubricValid
  const online = health && health.provider !== 'offline'

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true"><Icon name="book" size={20} /></span>
          <div>
            <h1>Feedback Assistant</h1>
            <p>{health?.assignment_type ?? 'Argumentative essay'} · rubric-based draft feedback</p>
          </div>
        </div>
        <span className={`status ${online ? 'on' : 'off'}`}>
          <span className="dot" aria-hidden="true" />
          {health ? (online ? `Model: ${health.provider}` : 'Backend offline') : 'Connecting…'}
        </span>
      </header>

      <main className="layout">
        <div className="panel setup">
          <Step n={1} title="Assignment">
            <label className="field">
              <span>Assignment prompt <em>optional</em></span>
              <textarea className="auto" value={assignmentPrompt} onChange={(e) => setAssignmentPrompt(e.target.value)}
                placeholder="e.g. Argue whether schools should adopt a four-day week." />
            </label>
          </Step>

          <Step n={2} title="Rubric" aside={`${rubric.length} criteria · ${rubricMax} pts`}>
            <ul className="rubric">
              {rubric.map((c, i) => (
                <li className="criterion" key={i}>
                  <div className="criterion-top">
                    <input aria-label={`Criterion ${i + 1} name`} className="criterion-name" value={c.name}
                      placeholder="Criterion name" aria-invalid={!c.name.trim()}
                      onChange={(e) => setCriterion(i, { name: e.target.value })} />
                    <label className="points">
                      <input aria-label={`Criterion ${i + 1} max points`} type="number" min={1} max={100} value={c.max_points}
                        onChange={(e) => setCriterion(i, { max_points: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} />
                      <span>pts</span>
                    </label>
                    <button className="icon-btn" aria-label={`Remove ${c.name || 'criterion'}`} title="Remove"
                      disabled={rubric.length <= 1} onClick={() => setRubric(rubric.filter((_, j) => j !== i))}>
                      <Icon name="x" />
                    </button>
                  </div>
                  <textarea className="auto subtle" aria-label={`Criterion ${i + 1} description`} value={c.description}
                    placeholder="What does strong work look like?"
                    onChange={(e) => setCriterion(i, { description: e.target.value })} />
                </li>
              ))}
            </ul>
            <div className="row">
              <button className="btn secondary" disabled={rubric.length >= 10}
                onClick={() => setRubric([...rubric, { name: '', description: '', max_points: 5 }])}>
                <Icon name="plus" /> Add criterion
              </button>
              <button className="btn ghost" onClick={() => setRubric(DEFAULT_RUBRIC)}>
                <Icon name="reset" /> Reset to default
              </button>
            </div>
          </Step>

          <Step n={3} title="Student submission" aside={words ? `${words.toLocaleString()} words` : null}>
            <label
              className={`dropzone ${dragging ? 'drag' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]) }}
            >
              <input type="file" className="sr-only" accept=".txt,.md,.pdf,.docx"
                onChange={(e) => { upload(e.target.files[0]); e.target.value = '' }} />
              <Icon name="upload" size={22} />
              <span><strong>Upload a file</strong> or drag it here</span>
              <small>{fileName ? `Loaded: ${fileName}` : '.txt, .md, .pdf or .docx, up to 10 MB'}</small>
            </label>
            <label className="field">
              <span>Or paste the text</span>
              <textarea className="essay" value={submission} onChange={(e) => { setSubmission(e.target.value); setFileName('') }}
                placeholder="Paste the student's essay here…" />
            </label>
          </Step>

          <div className="generate-bar">
            {error && <p className="error" role="alert"><Icon name="alert" size={16} /> {error}</p>}
            <button className="btn primary lg" disabled={!canGenerate} onClick={generate}>
              {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="sparkles" />}
              {busy ? 'Generating feedback…' : 'Generate feedback'}
            </button>
            {!canGenerate && !busy && (
              <small className="hint">
                {!rubricValid ? 'Every criterion needs a name.' : 'Add a submission of at least 20 characters.'}
              </small>
            )}
          </div>
        </div>

        <div className="panel review" aria-live="polite">
          <header className="review-head">
            <h2>Instructor review</h2>
            {feedback && (
              <span className={`pill ${reviewed ? 'ok' : 'draft'}`}>
                <Icon name={reviewed ? 'check' : 'alert'} size={14} />
                {reviewed ? 'Reviewed' : 'Draft'}
              </span>
            )}
          </header>

          {busy ? <Skeleton /> : !feedback ? (
            <div className="empty">
              <span className="empty-icon" aria-hidden="true"><Icon name="clipboard" size={28} /></span>
              <h3>No feedback yet</h3>
              <p>Set up the rubric, add a submission and generate feedback. You can review and edit everything before sharing it.</p>
            </div>
          ) : (
            <>
              <div className="summary">
                <div className="ring" style={{ '--pct': pct }} role="img" aria-label={`Suggested score ${total} out of ${max}`}>
                  <span><strong>{total}</strong>/{max}</span>
                </div>
                <div className="summary-text">
                  <p className="summary-title">Suggested total</p>
                  <p className="muted">
                    {reviewed
                      ? 'You reviewed this feedback. Any further edits will mark it as a draft again.'
                      : 'AI-generated draft. Scores are suggestions, not a final grade. Check every section before sharing.'}
                  </p>
                </div>
              </div>

              <label className="field">
                <span>Overall summary <em>shared with student</em></span>
                <textarea className="auto" value={feedback.overall_summary} onChange={(e) => setFb({ overall_summary: e.target.value })} />
              </label>

              {feedback.criteria.map((c, i) => (
                <details className="card" key={i} open>
                  <summary>
                    <Icon name="chevron" size={16} />
                    <h3>{c.name}</h3>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${(c.suggested_score / c.max_points) * 100}%` }} />
                    </span>
                    <span className="card-score">{c.suggested_score}/{c.max_points}</span>
                  </summary>
                  <div className="card-body">
                    <div className="score-edit">
                      <label htmlFor={`score-${i}`}>Score</label>
                      <input id={`score-${i}`} type="number" min={0} max={c.max_points} value={c.suggested_score}
                        onChange={(e) => setFbCriterion(i, { suggested_score: Math.max(0, Math.min(c.max_points, Number(e.target.value) || 0)) })} />
                      <span className="muted">of {c.max_points}</span>
                    </div>
                    <label className="field">
                      <span>Rationale</span>
                      <textarea className="auto" value={c.rationale} onChange={(e) => setFbCriterion(i, { rationale: e.target.value })} />
                    </label>
                    <div className="lines-grid">
                      <LinesField label="Strengths" tone="ok" icon="check" value={c.strengths} onChange={(v) => setFbCriterion(i, { strengths: v })} />
                      <LinesField label="Issues" tone="warn" icon="alert" value={c.issues} onChange={(v) => setFbCriterion(i, { issues: v })} />
                    </div>
                    <LinesField label="Missing concepts" tone="danger" icon="x" value={c.missing_concepts} onChange={(v) => setFbCriterion(i, { missing_concepts: v })} />

                    <div className="suggestions">
                      <span className="lines-label tone-info"><Icon name="sparkles" size={14} />How to improve</span>
                      {c.suggestions.map((s, k) => (
                        <div className="suggestion" key={k}>
                          <div className="suggestion-fields">
                            <textarea className="auto" aria-label="Suggestion" value={s.suggestion} placeholder="Suggestion"
                              onChange={(e) => setSuggestion(i, k, { suggestion: e.target.value })} />
                            <textarea className="auto example" aria-label="Example" value={s.example} placeholder="Example"
                              onChange={(e) => setSuggestion(i, k, { example: e.target.value })} />
                          </div>
                          <button className="icon-btn" aria-label="Remove suggestion" title="Remove"
                            onClick={() => setFbCriterion(i, { suggestions: c.suggestions.filter((_, m) => m !== k) })}>
                            <Icon name="x" />
                          </button>
                        </div>
                      ))}
                      <button className="btn ghost sm" onClick={() => setFbCriterion(i, { suggestions: [...c.suggestions, { suggestion: '', example: '' }] })}>
                        <Icon name="plus" size={16} /> Add suggestion
                      </button>
                    </div>
                  </div>
                </details>
              ))}

              <LinesField label="Missing concepts (overall)" tone="danger" icon="x" value={feedback.missing_concepts}
                onChange={(v) => setFb({ missing_concepts: v })} />
              <label className="field private">
                <span>Instructor notes <em>private, not exported</em></span>
                <textarea className="auto" value={feedback.instructor_notes} onChange={(e) => setFb({ instructor_notes: e.target.value })} />
              </label>

              <div className="action-bar">
                <button className="btn primary" onClick={() => setReviewed(true)} disabled={reviewed}>
                  <Icon name="check" /> {reviewed ? 'Reviewed' : 'Mark as reviewed'}
                </button>
                <button className="btn secondary" onClick={download}><Icon name="download" /> Download .md</button>
                <button className="btn ghost" onClick={copy}><Icon name={copied ? 'check' : 'copy'} /> {copied ? 'Copied' : 'Copy'}</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
