/**
 * HALLEY CRIATIVOS STUDIO — Frontend v4.1
 * Aba 1: Upload SRT/TXT + produto/público/tom → IA gera criativos
 * Aba 2: Upload vídeo+SRT → corte real FFmpeg
 */

const CONFIG = {
    API_BASE: 'https://wanderhalleylee-criativo-studio-backend.hf.space',
};

const STATE = {
    creativeType: 'video',
    creativeVariations: 1,
    creativeFiles: [],
    editorVariations: 1,
    editorDuration: 60,
    editorMode: 'individual',
    uploadedFiles: [],
    sessionId: null,
};

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

function selectCreativeType(type) {
    STATE.creativeType = type;
    document.querySelectorAll('.mode-btn[data-ctype]').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-btn[data-ctype="${type}"]`).classList.add('active');
    const desc = document.getElementById('creative-mode-desc');
    desc.innerHTML = type === 'video'
        ? '<strong>Vídeo:</strong> Roteiro completo + storyboard. Cada cena: prompt Nano Banana (imagem) + prompt Veo 3 (animação).'
        : '<strong>Imagem:</strong> Copy persuasiva (headline, subheadline, CTA) + prompts Nano Banana para Feed, Story e Banner.';
}

function adjustVariations(delta, ctx) {
    const k = ctx === 'creative' ? 'creativeVariations' : 'editorVariations';
    const id = ctx === 'creative' ? 'creative-variations' : 'editor-variations';
    STATE[k] = Math.max(1, Math.min(10, STATE[k] + delta));
    document.getElementById(id).textContent = STATE[k];
}

function selectDuration(d) {
    STATE.editorDuration = d;
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.dur-btn[data-dur="${d}"]`).classList.add('active');
}
function selectMode(m) {
    STATE.editorMode = m;
    document.querySelectorAll('.mode-btn[data-mode]').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${m}"]`).classList.add('active');
    document.getElementById('mode-desc-text').innerHTML = m === 'individual'
        ? '<strong>Modo "Um de Cada":</strong> Corta cada vídeo separadamente. 2 vídeos + 2 variações = 4 vídeos.'
        : '<strong>Modo "Cortar Todos":</strong> Mistura trechos de todos os vídeos em um único MP4.';
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast ${type} show`;
    setTimeout(() => t.className = 'toast', 3500);
}
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const o = btn.innerHTML; btn.innerHTML = '✓ Copiado!'; btn.classList.add('copied');
        showToast('Copiado!');
        setTimeout(() => { btn.innerHTML = o; btn.classList.remove('copied'); }, 2000);
    }).catch(() => {
        const ta = document.createElement('textarea'); ta.value = text;
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta); showToast('Copiado!');
    });
}
function setLoading(id, on) {
    const btn = document.getElementById(id); if (!btn) return;
    btn.disabled = on;
    const t = btn.querySelector('.btn-text'), l = btn.querySelector('.btn-loading');
    if (t) t.style.display = on ? 'none' : 'inline';
    if (l) l.style.display = on ? 'flex' : 'none';
}
function escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

// ============================================================
// ABA 1 — UPLOAD SRT/TXT
// ============================================================
const cuz = document.getElementById('creative-upload-zone');
const cfi = document.getElementById('creative-file-input');
cuz.addEventListener('click', () => cfi.click());
cuz.addEventListener('dragover', e => { e.preventDefault(); cuz.classList.add('dragover'); });
cuz.addEventListener('dragleave', () => cuz.classList.remove('dragover'));
cuz.addEventListener('drop', e => { e.preventDefault(); cuz.classList.remove('dragover'); handleCreativeFiles(e.dataTransfer.files); });
cfi.addEventListener('change', e => handleCreativeFiles(e.target.files));

function handleCreativeFiles(fl) {
    const ok = Array.from(fl).filter(f => ['srt','vtt','sub','txt'].includes(f.name.split('.').pop().toLowerCase()));
    if (!ok.length) { showToast('Envie apenas .srt, .vtt ou .txt', 'error'); return; }
    STATE.creativeFiles = [...STATE.creativeFiles, ...ok];
    renderCreativeFileList();
}
function clearCreativeFiles() {
    STATE.creativeFiles = [];
    document.getElementById('creative-file-list').style.display = 'none';
    document.getElementById('creative-settings').style.display = 'none';
    document.getElementById('creative-results').innerHTML = '';
    cfi.value = ''; showToast('Arquivos removidos.');
}
function removeCreativeFile(i) {
    STATE.creativeFiles.splice(i, 1);
    if (!STATE.creativeFiles.length) { clearCreativeFiles(); return; }
    renderCreativeFileList();
}
function renderCreativeFileList() {
    const el = document.getElementById('creative-file-list'), pe = document.getElementById('creative-file-pairs');
    if (!STATE.creativeFiles.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    let h = '';
    STATE.creativeFiles.forEach((f, i) => {
        const ext = f.name.split('.').pop().toLowerCase();
        h += `<div class="file-pair"><div class="file-pair-info"><span class="file-pair-icon">${ext === 'txt' ? '📄' : '📝'}</span>
        <div><div class="file-pair-name">${escapeHtml(f.name)}</div><div class="file-pair-type">${ext.toUpperCase()} — ${(f.size/1024).toFixed(1)} KB</div></div></div>
        <div style="display:flex;align-items:center;gap:8px;"><span class="file-pair-status paired">✅ Pronto</span>
        <button class="file-pair-remove" onclick="removeCreativeFile(${i})">✕</button></div></div>`;
    });
    pe.innerHTML = h;
    document.getElementById('creative-settings').style.display = 'block';
}

// ============================================================
// ABA 1 — GERAR CRIATIVOS
// ============================================================
async function generateCreatives() {
    if (!STATE.creativeFiles.length) { showToast('Suba pelo menos um SRT ou TXT!', 'error'); return; }
    const produto = document.getElementById('produto').value.trim();
    const publico = document.getElementById('publico').value.trim();
    if (!produto) { showToast('Informe o nome do produto/serviço!', 'error'); document.getElementById('produto').focus(); return; }
    if (!publico) { showToast('Informe o público-alvo!', 'error'); document.getElementById('publico').focus(); return; }

    setLoading('btn-generate-creative', true);
    const rEl = document.getElementById('creative-results');
    rEl.innerHTML = `<div class="processing-overlay"><div class="processing-spinner"></div>
        <div class="processing-text">A IA está extraindo conhecimento e gerando criativos...</div>
        <div class="processing-sub">Produto: ${escapeHtml(produto)} | Público: ${escapeHtml(publico)}</div></div>`;
    try {
        const fd = new FormData();
        STATE.creativeFiles.forEach(f => fd.append('files', f));
        fd.append('produto', produto);
        fd.append('publico_alvo', publico);
        fd.append('tom_voz', document.getElementById('tom').value);
        fd.append('tipo', STATE.creativeType);
        fd.append('variacoes', STATE.creativeVariations);

        const res = await fetch(`${CONFIG.API_BASE}/api/v1/creative/generate`, { method: 'POST', body: fd });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || `Erro ${res.status}`); }
        const data = await res.json();
        if (STATE.creativeType === 'video') renderVideoResults(data);
        else renderImageResults(data);
        showToast(`${data.total_variacoes} variação(ões) gerada(s)!`);
    } catch (err) { console.error(err); rEl.innerHTML = ''; showToast(err.message || 'Erro ao gerar criativos.', 'error'); }
    finally { setLoading('btn-generate-creative', false); }
}

// ============================================================
// ABA 1 — RENDER VÍDEO
// ============================================================
function renderVideoResults(data) {
    const c = document.getElementById('creative-results'); c.innerHTML = '';

    c.innerHTML = `<div class="result-card" style="margin-bottom:24px;">
        <div class="result-header"><span class="result-badge">Briefing</span><span class="result-framework">${data.total_palavras_extraidas} palavras processadas</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px;">
            <div class="copy-item"><div class="copy-item-label">Produto</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(data.produto)}</div></div>
            <div class="copy-item"><div class="copy-item-label">Público-Alvo</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(data.publico_alvo)}</div></div>
            <div class="copy-item"><div class="copy-item-label">Tom de Voz</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(data.tom_voz)}</div></div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:12px;">Arquivos: ${data.arquivos_processados.map(f => escapeHtml(f)).join(', ')}</div></div>`;

    data.variacoes.forEach(v => {
        const card = document.createElement('div'); card.className = 'result-card';
        let h = `<div class="result-header"><span class="result-badge">Variação ${v.variacao}</span><span class="result-framework">${escapeHtml(v.framework||'')}</span></div>
        <div class="result-angle">${escapeHtml(v.angulo_criativo)}</div>`;
        const rid = `roteiro-${v.variacao}`;
        h += `<div class="roteiro-block"><div class="roteiro-title">Roteiro Completo</div><div class="roteiro-text" id="${rid}">${escapeHtml(v.roteiro_completo)}</div>
        <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${rid}').innerText,this)">Copiar Roteiro</button></div>`;
        if (v.storyboard && v.storyboard.length) {
            h += '<h3 style="font-size:16px;font-weight:700;margin:24px 0 16px;color:var(--text-primary)">Storyboard</h3>';
            v.storyboard.forEach(sc => {
                const nbId = `nb-${v.variacao}-${sc.cena}`, vId = `veo-${v.variacao}-${sc.cena}`;
                h += `<div class="scene-card"><div class="scene-header"><div class="scene-phase"><div class="scene-number">${sc.cena}</div>
                <span class="scene-phase-name">${escapeHtml(sc.fase||'')}</span></div><span class="scene-time">${escapeHtml(sc.tempo||'')}</span></div>
                <div class="scene-objective">${escapeHtml(sc.objetivo_da_cena||'')}</div>
                <div class="scene-section"><div class="scene-section-title">Narração</div><div class="scene-narration">${escapeHtml(sc['narração']||sc.narracao||'')}</div></div>
                <div class="scene-section"><div class="scene-section-title">Visual</div><div class="scene-visual">${escapeHtml(sc['descrição_visual']||sc.descricao_visual||'')}</div></div>
                <div class="scene-cut">${escapeHtml(sc.corte_sugerido||'')}</div>`;
                if (sc.prompt_nano_banana) {
                    h += `<div class="prompt-block"><div class="prompt-label">Prompt Nano Banana (Imagem)</div><div class="prompt-text" id="${nbId}">${escapeHtml(sc.prompt_nano_banana)}</div>
                    <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${nbId}').innerText,this)">Copiar</button></div>`;
                }
                if (sc.prompt_veo3) {
                    h += `<div class="prompt-block" style="margin-top:8px;border-color:rgba(168,85,247,0.3);"><div class="prompt-label" style="color:var(--primary-light);">Prompt Veo 3 (Vídeo)</div><div class="prompt-text" id="${vId}">${escapeHtml(sc.prompt_veo3)}</div>
                    <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${vId}').innerText,this)">Copiar</button></div>`;
                }
                h += '</div>';
            });
        }
        h += `<div style="margin-top:16px;font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Modelo: ${escapeHtml(v.modelo_ia||'')}</div>`;
        card.innerHTML = h; c.appendChild(card);
    });
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// ABA 1 — RENDER IMAGEM
// ============================================================
function renderImageResults(data) {
    const c = document.getElementById('creative-results'); c.innerHTML = '';

    c.innerHTML = `<div class="result-card" style="margin-bottom:24px;">
        <div class="result-header"><span class="result-badge">Briefing</span><span class="result-framework">${data.total_palavras_extraidas} palavras</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px;">
            <div class="copy-item"><div class="copy-item-label">Produto</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(data.produto)}</div></div>
            <div class="copy-item"><div class="copy-item-label">Público</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(data.publico_alvo)}</div></div>
            <div class="copy-item"><div class="copy-item-label">Tom</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(data.tom_voz)}</div></div>
        </div></div>`;

    data.variacoes.forEach(v => {
        const card = document.createElement('div'); card.className = 'result-card';
        let h = `<div class="result-header"><span class="result-badge">Variação ${v.variacao}</span></div>
        <div class="result-angle">${escapeHtml(v.angulo_criativo)}</div>
        <div class="image-copy-section">
            <div class="copy-item"><div class="copy-item-label">Headline</div><div class="copy-item-headline">${escapeHtml(v.headline)}</div></div>
            <div class="copy-item"><div class="copy-item-label">Subheadline</div><div class="copy-item-subheadline">${escapeHtml(v.subheadline)}</div></div>
            <div class="copy-item"><div class="copy-item-label">CTA</div><div class="copy-item-cta">${escapeHtml(v.cta)}</div></div>
            <div class="copy-item"><div class="copy-item-label">Conceito</div><div class="copy-item-subheadline">${escapeHtml(v.conceito)}</div></div>
        </div><div class="format-prompts">`;
        if (v.formatos) {
            for (const [fk, fd] of Object.entries(v.formatos)) {
                const pid = `ni-${v.variacao}-${fk}`;
                h += `<div class="format-card"><div class="format-header"><span class="format-name">${escapeHtml(fd.formato||'')}</span><span class="format-res">${escapeHtml(fd.resolucao||'')}</span></div>
                <div class="prompt-block"><div class="prompt-label">Prompt Nano Banana</div><div class="prompt-text" id="${pid}">${escapeHtml(fd.prompt_nano_banana||'')}</div>
                <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${pid}').innerText,this)">Copiar</button></div></div>`;
            }
        }
        h += `</div><div style="margin-top:16px;font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Modelo: ${escapeHtml(v.modelo_ia||'')}</div>`;
        card.innerHTML = h; c.appendChild(card);
    });
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// ABA 2 — EDITOR (INTACTO)
// ============================================================
const uz = document.getElementById('upload-zone'), fi = document.getElementById('file-input');
uz.addEventListener('click', () => fi.click());
uz.addEventListener('dragover', e => { e.preventDefault(); uz.classList.add('dragover'); });
uz.addEventListener('dragleave', () => uz.classList.remove('dragover'));
uz.addEventListener('drop', e => { e.preventDefault(); uz.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
fi.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(fl) { STATE.uploadedFiles = [...STATE.uploadedFiles, ...Array.from(fl)]; renderFileList(); }
function clearAllFiles() {
    STATE.uploadedFiles = []; STATE.sessionId = null;
    document.getElementById('file-list').style.display = 'none';
    document.getElementById('editor-settings').style.display = 'none';
    document.getElementById('editor-results').innerHTML = '';
    fi.value = ''; showToast('Arquivos removidos.');
}
function removeFile(i) { STATE.uploadedFiles.splice(i, 1); if (!STATE.uploadedFiles.length) { clearAllFiles(); return; } renderFileList(); }

function renderFileList() {
    const el = document.getElementById('file-list'), pe = document.getElementById('file-pairs'), st = document.getElementById('upload-status');
    if (!STATE.uploadedFiles.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    const vx = ['mp4','mov','webm','avi','mkv','m4v'], sx = ['srt','vtt','sub'];
    const vs = [], ss = [];
    STATE.uploadedFiles.forEach((f, i) => {
        const ext = f.name.split('.').pop().toLowerCase(), base = f.name.replace(/\.[^.]+$/, '').toLowerCase();
        if (vx.includes(ext)) vs.push({ file: f, idx: i, name: f.name, base });
        else if (sx.includes(ext)) ss.push({ file: f, idx: i, name: f.name, base });
    });
    const sm = {}; ss.forEach(s => sm[s.base] = s);
    let h = '', pc = 0;
    vs.forEach(v => {
        const p = sm[v.base]; if (p) pc++;
        h += `<div class="file-pair"><div class="file-pair-info"><span class="file-pair-icon">🎬</span>
        <div><div class="file-pair-name">${escapeHtml(v.name)}</div>
        <div class="file-pair-type">${p ? '+ SRT: ' + escapeHtml(p.name) : 'SRT não encontrado'}</div></div></div>
        <div style="display:flex;align-items:center;gap:8px;">
        <span class="file-pair-status ${p ? 'paired' : 'missing'}">${p ? '✅ Par válido' : '❌ Será recusado'}</span>
        <button class="file-pair-remove" onclick="removeFile(${v.idx})">✕</button></div></div>`;
    });
    pe.innerHTML = h;
    if (pc > 0) {
        st.innerHTML = `<span style="color:var(--success);font-weight:600;">${pc} par(es) válido(s)</span>
        <br><button id="btn-upload-to-backend" class="btn-generate" style="margin-top:16px;" onclick="uploadToBackend()">
        <span class="btn-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span>
        <span class="btn-text">Enviar para IA</span>
        <span class="btn-loading" style="display:none;"><div class="spinner"></div>Enviando...</span></button>`;
    } else {
        st.innerHTML = '<span style="color:var(--error);font-weight:600;">Nenhum par válido.</span>';
        document.getElementById('editor-settings').style.display = 'none';
    }
}

async function uploadToBackend() {
    const btn = document.getElementById('btn-upload-to-backend');
    btn.disabled = true; btn.querySelector('.btn-text').style.display = 'none'; btn.querySelector('.btn-loading').style.display = 'flex';
    try {
        const fd = new FormData(); STATE.uploadedFiles.forEach(f => fd.append('files', f));
        const res = await fetch(`${CONFIG.API_BASE}/api/v2/editor/upload`, { method: 'POST', body: fd });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || `Erro ${res.status}`); }
        const data = await res.json();
        STATE.sessionId = data.session_id;
        showToast(`${data.total_pairs} par(es) validado(s)!`);
        document.getElementById('editor-settings').style.display = 'block';
        document.getElementById('editor-settings').scrollIntoView({ behavior: 'smooth' });
    } catch (err) { showToast(err.message || 'Erro.', 'error'); }
    finally { btn.disabled = false; btn.querySelector('.btn-text').style.display = 'inline'; btn.querySelector('.btn-loading').style.display = 'none'; }
}

async function generateEditorCuts() {
    if (!STATE.sessionId) { showToast('Envie os arquivos primeiro.', 'error'); return; }
    setLoading('btn-generate-editor', true);
    const rEl = document.getElementById('editor-results');
    rEl.innerHTML = `<div class="processing-overlay"><div class="processing-spinner"></div>
    <div class="processing-text">Analisando, cortando e montando...</div>
    <div class="processing-sub">Gancho → Corpo → CTA</div></div>`;
    try {
        const fd = new FormData();
        fd.append('session_id', STATE.sessionId); fd.append('duracao', STATE.editorDuration);
        fd.append('variacoes', STATE.editorVariations); fd.append('modo', STATE.editorMode);
        const res = await fetch(`${CONFIG.API_BASE}/api/v2/editor/generate`, { method: 'POST', body: fd });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || `Erro ${res.status}`); }
        const data = await res.json();
        renderEditorResults(data); showToast(`${data.total_videos_gerados} vídeo(s) gerado(s)!`);
    } catch (err) { rEl.innerHTML = ''; showToast(err.message || 'Erro.', 'error'); }
    finally { setLoading('btn-generate-editor', false); }
}

function renderEditorResults(data) {
    const c = document.getElementById('editor-results'); c.innerHTML = '';
    data.resultados.forEach(r => {
        const card = document.createElement('div'); card.className = 'variation-card';
        const src = r.modo === 'todos' ? `Mix: ${r.source_videos.join(' + ')}` : `Fonte: ${r.source_video}`;
        let h = `<div class="variation-header"><div><span class="result-badge">Variação ${r.variacao}</span>
        <span class="video-source-label" style="margin-left:8px;">${escapeHtml(src)}</span></div>
        <div class="variation-meta"><span class="meta-chip">Modo: <strong>${r.modo === 'todos' ? 'Cortar Todos' : 'Um de Cada'}</strong></span>
        <span class="meta-chip">Alvo: <strong>${r.duracao_alvo}s</strong></span></div></div>`;
        if (r.estrutura) {
            const e = r.estrutura;
            h += `<div class="structure-overview">
            <div class="structure-phase gancho"><div class="structure-phase-name">Gancho</div><div class="structure-phase-stats">${e.duracao_gancho||0}s</div><div class="structure-phase-sub">${e.total_gancho||0} corte(s)</div></div>
            <div class="structure-phase corpo"><div class="structure-phase-name">Corpo</div><div class="structure-phase-stats">${e.duracao_corpo||0}s</div><div class="structure-phase-sub">${e.total_corpo||0} corte(s)</div></div>
            <div class="structure-phase cta"><div class="structure-phase-name">CTA</div><div class="structure-phase-stats">${e.duracao_cta||0}s</div><div class="structure-phase-sub">${e.total_cta||0} corte(s)</div></div></div>`;
        }
        if (r.video_gerado && r.download_url) {
            h += `<a href="${CONFIG.API_BASE}${r.download_url}" class="btn-download" download>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar ${escapeHtml(r.output_filename)}</a>`;
        } else {
            h += `<div style="padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;font-size:13px;font-weight:600;">⚠️ Erro ao gerar. Tente novamente.</div>`;
        }
        if (r.relatorio && r.relatorio.length) {
            h += '<h3 style="font-size:15px;font-weight:700;margin:24px 0 16px;color:var(--text-primary);">Relatório</h3>';
            r.relatorio.forEach(cut => {
                const fc = cut.fase_estrutural.toLowerCase();
                const lv = cut.score_persuasivo >= 60 ? 'high' : cut.score_persuasivo >= 30 ? 'mid' : 'low';
                h += `<div class="cut-card fase-${fc}"><div class="cut-header"><div style="display:flex;align-items:center;gap:8px;">
                <span class="cut-number">Corte #${cut.corte_numero}</span><span class="fase-badge ${fc}">${cut.fase_estrutural}</span></div>
                <div class="cut-score"><div class="score-bar"><div class="score-fill ${lv}" style="width:${cut.score_persuasivo}%"></div></div>
                <span class="score-value ${lv}">${cut.score_persuasivo}/100</span></div></div>
                <div class="cut-timestamps">${cut.timestamp_inicio} → ${cut.timestamp_fim} (${cut.duracao_segundos}s)</div>
                <div class="cut-text">"${escapeHtml(cut.fala)}"</div>
                <div class="cut-reason">${escapeHtml(cut.motivo_selecao)}</div>`;
                if (cut.gatilhos_ativados && cut.gatilhos_ativados.length) {
                    h += '<div class="cut-triggers">';
                    cut.gatilhos_ativados.forEach(g => h += `<span class="cut-trigger-tag">${g}</span>`);
                    h += '</div>';
                }
                h += '</div>';
            });
        }
        card.innerHTML = h; c.appendChild(card);
    });
    c.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('%c Halley Criativos Studio v4.1', 'font-size:20px;font-weight:bold;color:#6366f1;');
    fetch(`${CONFIG.API_BASE}/health`).then(r => r.json()).then(d => console.log('Backend:', d)).catch(() => console.warn('Backend offline'));
});
