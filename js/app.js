/**
 * HALLEY CRIATIVOS STUDIO — Frontend v4
 * Aba 1: Upload SRT/TXT → IA extrai conhecimento → gera criativos
 * Aba 2: Upload vídeo+SRT → corte real FFmpeg
 */

const CONFIG = {
    API_BASE: 'https://wanderhalleylee-criativo-studio-backend.hf.space',
};

const STATE = {
    // Aba 1
    creativeType: 'video',
    creativeVariations: 1,
    creativeFiles: [],
    // Aba 2
    editorVariations: 1,
    editorDuration: 60,
    editorMode: 'individual',
    uploadedFiles: [],
    sessionId: null,
    validPairs: [],
};

// === TABS ===
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// === ABA 1: TIPO ===
function selectCreativeType(type) {
    STATE.creativeType = type;
    document.querySelectorAll('.mode-btn[data-ctype]').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-btn[data-ctype="${type}"]`).classList.add('active');
    const desc = document.getElementById('creative-mode-desc');
    if (type === 'video') {
        desc.innerHTML = '<strong>Vídeo:</strong> A IA lê seus SRTs/TXTs, extrai produto, público, argumentos e dores, e gera roteiros completos com storyboard. Para cada cena: prompt Nano Banana (imagem) + prompt Veo 3 (vídeo animado).';
    } else {
        desc.innerHTML = '<strong>Imagem:</strong> A IA lê seus SRTs/TXTs, extrai o conhecimento e gera copies persuasivas (headline, subheadline, CTA) + prompts Nano Banana para cada formato (Feed, Story, Banner).';
    }
}

// === STEPPER ===
function adjustVariations(delta, ctx) {
    const k = ctx === 'creative' ? 'creativeVariations' : 'editorVariations';
    const id = ctx === 'creative' ? 'creative-variations' : 'editor-variations';
    STATE[k] = Math.max(1, Math.min(10, STATE[k] + delta));
    document.getElementById(id).textContent = STATE[k];
}

// === ABA 2: DURATION & MODE ===
function selectDuration(d) {
    STATE.editorDuration = d;
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.dur-btn[data-dur="${d}"]`).classList.add('active');
}
function selectMode(m) {
    STATE.editorMode = m;
    document.querySelectorAll('.mode-btn[data-mode]').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${m}"]`).classList.add('active');
    const desc = document.getElementById('mode-desc-text');
    if (m === 'individual') {
        desc.innerHTML = '<strong>Modo "Um de Cada":</strong> A IA corta e emenda cada vídeo separadamente. Se você subiu 2 vídeos e pediu 2 variações, recebe 4 vídeos prontos (2 de cada).';
    } else {
        desc.innerHTML = '<strong>Modo "Cortar Todos":</strong> A IA pega os melhores trechos de TODOS os vídeos e monta um único vídeo mixado. Se pediu 2 variações, recebe 2 vídeos (cada um misturando todas as fontes).';
    }
}

// === HELPERS ===
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast ${type} show`;
    setTimeout(() => { t.className = 'toast'; }, 3500);
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
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = on;
    const t = btn.querySelector('.btn-text');
    const l = btn.querySelector('.btn-loading');
    if (t) t.style.display = on ? 'none' : 'inline';
    if (l) l.style.display = on ? 'flex' : 'none';
}
function escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

// ============================================================
// ABA 1 — UPLOAD SRT/TXT
// ============================================================
const creativeUploadZone = document.getElementById('creative-upload-zone');
const creativeFileInput = document.getElementById('creative-file-input');

creativeUploadZone.addEventListener('click', () => creativeFileInput.click());
creativeUploadZone.addEventListener('dragover', e => { e.preventDefault(); creativeUploadZone.classList.add('dragover'); });
creativeUploadZone.addEventListener('dragleave', () => creativeUploadZone.classList.remove('dragover'));
creativeUploadZone.addEventListener('drop', e => { e.preventDefault(); creativeUploadZone.classList.remove('dragover'); handleCreativeFiles(e.dataTransfer.files); });
creativeFileInput.addEventListener('change', e => handleCreativeFiles(e.target.files));

function handleCreativeFiles(fl) {
    const allowed = ['srt', 'vtt', 'sub', 'txt'];
    const newFiles = Array.from(fl).filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return allowed.includes(ext);
    });
    if (newFiles.length === 0) {
        showToast('Envie apenas arquivos .srt, .vtt ou .txt', 'error');
        return;
    }
    STATE.creativeFiles = [...STATE.creativeFiles, ...newFiles];
    renderCreativeFileList();
}

function clearCreativeFiles() {
    STATE.creativeFiles = [];
    document.getElementById('creative-file-list').style.display = 'none';
    document.getElementById('creative-settings').style.display = 'none';
    document.getElementById('creative-results').innerHTML = '';
    creativeFileInput.value = '';
    showToast('Arquivos removidos.');
}

function removeCreativeFile(i) {
    STATE.creativeFiles.splice(i, 1);
    if (!STATE.creativeFiles.length) { clearCreativeFiles(); return; }
    renderCreativeFileList();
}

function renderCreativeFileList() {
    const listEl = document.getElementById('creative-file-list');
    const pairsEl = document.getElementById('creative-file-pairs');
    if (!STATE.creativeFiles.length) { listEl.style.display = 'none'; return; }
    listEl.style.display = 'block';

    let html = '';
    STATE.creativeFiles.forEach((f, i) => {
        const ext = f.name.split('.').pop().toLowerCase();
        const icon = ext === 'txt' ? '📄' : '📝';
        const size = (f.size / 1024).toFixed(1);
        html += `<div class="file-pair">
            <div class="file-pair-info">
                <span class="file-pair-icon">${icon}</span>
                <div>
                    <div class="file-pair-name">${escapeHtml(f.name)}</div>
                    <div class="file-pair-type">${ext.toUpperCase()} — ${size} KB</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span class="file-pair-status paired">✅ Pronto</span>
                <button class="file-pair-remove" onclick="removeCreativeFile(${i})">✕</button>
            </div>
        </div>`;
    });
    pairsEl.innerHTML = html;

    // Mostrar settings
    document.getElementById('creative-settings').style.display = 'block';
}

// ============================================================
// ABA 1 — GERAR CRIATIVOS
// ============================================================
async function generateCreatives() {
    if (!STATE.creativeFiles.length) {
        showToast('Suba pelo menos um arquivo SRT ou TXT!', 'error');
        return;
    }

    setLoading('btn-generate-creative', true);
    const resultsEl = document.getElementById('creative-results');
    resultsEl.innerHTML = `<div class="processing-overlay"><div class="processing-spinner"></div>
        <div class="processing-text">A IA está extraindo conhecimento e gerando criativos...</div>
        <div class="processing-sub">Pode levar alguns minutos dependendo da quantidade de texto</div></div>`;

    try {
        const fd = new FormData();
        STATE.creativeFiles.forEach(f => fd.append('files', f));
        fd.append('tipo', STATE.creativeType);
        fd.append('variacoes', STATE.creativeVariations);

        const res = await fetch(`${CONFIG.API_BASE}/api/v1/creative/generate`, {
            method: 'POST',
            body: fd
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || `Erro ${res.status}`);
        }

        const data = await res.json();

        if (STATE.creativeType === 'video') {
            renderVideoResults(data);
        } else {
            renderImageResults(data);
        }

        showToast(`${data.total_variacoes} variação(ões) gerada(s) a partir de ${data.arquivos_processados.length} arquivo(s)!`);

    } catch (err) {
        console.error(err);
        resultsEl.innerHTML = '';
        showToast(err.message || 'Erro ao gerar criativos.', 'error');
    } finally {
        setLoading('btn-generate-creative', false);
    }
}

// ============================================================
// ABA 1 — RENDER VÍDEO
// ============================================================
function renderVideoResults(data) {
    const c = document.getElementById('creative-results');
    c.innerHTML = '';

    // Info dos arquivos processados
    let infoHtml = `<div class="result-card" style="margin-bottom:24px;">
        <div class="result-header"><span class="result-badge">Conhecimento Extraído</span>
        <span class="result-framework">${data.total_palavras_extraidas} palavras processadas</span></div>
        <div style="font-size:13px;color:var(--text-secondary);">Arquivos: ${data.arquivos_processados.map(f => escapeHtml(f)).join(', ')}</div>`;

    if (data.variacoes[0] && data.variacoes[0].conhecimento_extraido) {
        const k = data.variacoes[0].conhecimento_extraido;
        infoHtml += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
            <div class="copy-item"><div class="copy-item-label">Produto</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(k.produto || 'N/A')}</div></div>
            <div class="copy-item"><div class="copy-item-label">Público-Alvo</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(k.publico_alvo || 'N/A')}</div></div>
            <div class="copy-item"><div class="copy-item-label">Tom de Voz</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(k.tom_voz || 'N/A')}</div></div>
            <div class="copy-item"><div class="copy-item-label">Resumo</div><div style="color:var(--text-secondary);font-size:13px;">${escapeHtml(k.resumo || 'N/A')}</div></div>
        </div>`;
    }
    infoHtml += '</div>';
    c.innerHTML = infoHtml;

    data.variacoes.forEach(v => {
        const card = document.createElement('div'); card.className = 'result-card';
        let h = `<div class="result-header"><span class="result-badge">Variação ${v.variacao}</span><span class="result-framework">${escapeHtml(v.framework || '')}</span></div>
        <div class="result-angle">${escapeHtml(v.angulo_criativo)}</div>`;

        // Roteiro
        const rid = `roteiro-${v.variacao}`;
        h += `<div class="roteiro-block"><div class="roteiro-title">Roteiro Completo</div><div class="roteiro-text" id="${rid}">${escapeHtml(v.roteiro_completo)}</div>
        <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${rid}').innerText,this)">Copiar Roteiro</button></div>`;

        // Storyboard
        if (v.storyboard && v.storyboard.length) {
            h += '<h3 style="font-size:16px;font-weight:700;margin:24px 0 16px;color:var(--text-primary)">Storyboard — Cenas</h3>';
            v.storyboard.forEach(sc => {
                const nbId = `nano-vid-${v.variacao}-${sc.cena}`;
                const veoId = `veo3-${v.variacao}-${sc.cena}`;

                h += `<div class="scene-card"><div class="scene-header"><div class="scene-phase"><div class="scene-number">${sc.cena}</div>
                <span class="scene-phase-name">${escapeHtml(sc.fase || '')}</span></div><span class="scene-time">${escapeHtml(sc.tempo || '')}</span></div>
                <div class="scene-objective">${escapeHtml(sc.objetivo_da_cena || '')}</div>
                <div class="scene-section"><div class="scene-section-title">Narração</div><div class="scene-narration">${escapeHtml(sc['narração'] || sc.narracao || '')}</div></div>
                <div class="scene-section"><div class="scene-section-title">Visual</div><div class="scene-visual">${escapeHtml(sc['descrição_visual'] || sc.descricao_visual || '')}</div></div>
                <div class="scene-cut">${escapeHtml(sc.corte_sugerido || '')}</div>`;

                // Prompt Nano Banana (imagem da cena)
                const nbText = sc.prompt_nano_banana || '';
                if (nbText) {
                    h += `<div class="prompt-block"><div class="prompt-label">Prompt Nano Banana (Imagem da Cena)</div><div class="prompt-text" id="${nbId}">${escapeHtml(nbText)}</div>
                    <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${nbId}').innerText,this)">Copiar</button></div>`;
                }

                // Prompt Veo 3 (vídeo animado)
                const veoText = sc.prompt_veo3 || '';
                if (veoText) {
                    h += `<div class="prompt-block" style="margin-top:8px;border-color:rgba(168,85,247,0.3);"><div class="prompt-label" style="color:var(--primary-light);">Prompt Veo 3 (Animação do Vídeo)</div><div class="prompt-text" id="${veoId}">${escapeHtml(veoText)}</div>
                    <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${veoId}').innerText,this)">Copiar</button></div>`;
                }

                h += '</div>';
            });
        }

        // Modelo usado
        h += `<div style="margin-top:16px;font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Modelo: ${escapeHtml(v.modelo_ia || 'N/A')}</div>`;

        card.innerHTML = h; c.appendChild(card);
    });
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// ABA 1 — RENDER IMAGEM
// ============================================================
function renderImageResults(data) {
    const c = document.getElementById('creative-results');
    c.innerHTML = '';

    // Info
    let infoHtml = `<div class="result-card" style="margin-bottom:24px;">
        <div class="result-header"><span class="result-badge">Conhecimento Extraído</span>
        <span class="result-framework">${data.total_palavras_extraidas} palavras</span></div>
        <div style="font-size:13px;color:var(--text-secondary);">Arquivos: ${data.arquivos_processados.map(f => escapeHtml(f)).join(', ')}</div>`;

    if (data.variacoes[0] && data.variacoes[0].conhecimento_extraido) {
        const k = data.variacoes[0].conhecimento_extraido;
        infoHtml += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
            <div class="copy-item"><div class="copy-item-label">Produto</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(k.produto || 'N/A')}</div></div>
            <div class="copy-item"><div class="copy-item-label">Público-Alvo</div><div style="color:var(--text-primary);font-weight:600;">${escapeHtml(k.publico_alvo || 'N/A')}</div></div>
        </div>`;
    }
    infoHtml += '</div>';
    c.innerHTML = infoHtml;

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
                const pid = `nano-img-${v.variacao}-${fk}`;
                h += `<div class="format-card"><div class="format-header"><span class="format-name">${escapeHtml(fd.formato || '')}</span><span class="format-res">${escapeHtml(fd.resolucao || '')}</span></div>
                <div class="prompt-block" style="position:relative"><div class="prompt-label">Prompt Nano Banana</div><div class="prompt-text" id="${pid}">${escapeHtml(fd.prompt_nano_banana || '')}</div>
                <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${pid}').innerText,this)">Copiar</button></div></div>`;
            }
        }
        h += '</div>';
        h += `<div style="margin-top:16px;font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">Modelo: ${escapeHtml(v.modelo_ia || 'N/A')}</div>`;

        card.innerHTML = h; c.appendChild(card);
    });
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// ABA 2 — EDITOR AUTOMÁTICO (INTACTO)
// ============================================================
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(fl) { STATE.uploadedFiles = [...STATE.uploadedFiles, ...Array.from(fl)]; renderFileList(); }
function clearAllFiles() {
    STATE.uploadedFiles = []; STATE.sessionId = null; STATE.validPairs = [];
    document.getElementById('file-list').style.display = 'none';
    document.getElementById('editor-settings').style.display = 'none';
    document.getElementById('editor-results').innerHTML = '';
    fileInput.value = ''; showToast('Arquivos removidos.');
}
function removeFile(i) { STATE.uploadedFiles.splice(i, 1); if (!STATE.uploadedFiles.length) { clearAllFiles(); return; } renderFileList(); }

function renderFileList() {
    const listEl = document.getElementById('file-list'), pairsEl = document.getElementById('file-pairs'), statusEl = document.getElementById('upload-status');
    if (!STATE.uploadedFiles.length) { listEl.style.display = 'none'; return; }
    listEl.style.display = 'block';
    const vExts = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v'], sExts = ['srt', 'vtt', 'sub'];
    const videos = [], srts = [];
    STATE.uploadedFiles.forEach((f, i) => {
        const ext = f.name.split('.').pop().toLowerCase(), base = f.name.replace(/\.[^.]+$/, '').toLowerCase();
        if (vExts.includes(ext)) videos.push({ file: f, idx: i, name: f.name, base });
        else if (sExts.includes(ext)) srts.push({ file: f, idx: i, name: f.name, base });
    });
    const srtMap = {}; srts.forEach(s => { srtMap[s.base] = s; });
    let html = '', pairedCount = 0;
    videos.forEach(v => {
        const paired = srtMap[v.base]; if (paired) pairedCount++;
        html += `<div class="file-pair"><div class="file-pair-info"><span class="file-pair-icon">🎬</span>
        <div><div class="file-pair-name">${escapeHtml(v.name)}</div>
        <div class="file-pair-type">${paired ? '+ SRT: ' + escapeHtml(paired.name) : 'SRT não encontrado'}</div></div></div>
        <div style="display:flex;align-items:center;gap:8px;">
        <span class="file-pair-status ${paired ? 'paired' : 'missing'}">${paired ? '✅ Par válido' : '❌ Será recusado'}</span>
        <button class="file-pair-remove" onclick="removeFile(${v.idx})">✕</button></div></div>`;
    });
    srts.forEach(s => {
        if (!videos.find(v => v.base === s.base)) {
            html += `<div class="file-pair"><div class="file-pair-info"><span class="file-pair-icon">📝</span>
            <div><div class="file-pair-name">${escapeHtml(s.name)}</div><div class="file-pair-type">SRT sem vídeo pareado</div></div></div>
            <div style="display:flex;align-items:center;gap:8px;">
            <span class="file-pair-status missing">⚠️ Sem vídeo</span>
            <button class="file-pair-remove" onclick="removeFile(${s.idx})">✕</button></div></div>`;
        }
    });
    pairsEl.innerHTML = html;
    if (pairedCount > 0) {
        statusEl.innerHTML = `<span style="color:var(--success);font-weight:600;">${pairedCount} par(es) válido(s)</span> — pronto para enviar
        <br><button id="btn-upload-to-backend" class="btn-generate" style="margin-top:16px;" onclick="uploadToBackend()">
        <span class="btn-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span>
        <span class="btn-text">Enviar para IA Analisar</span>
        <span class="btn-loading" style="display:none;"><div class="spinner"></div>Enviando arquivos...</span></button>`;
    } else {
        statusEl.innerHTML = `<span style="color:var(--error);font-weight:600;">Nenhum par válido.</span> Cada vídeo precisa de um SRT com o mesmo nome.`;
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
        STATE.sessionId = data.session_id; STATE.validPairs = data.pairs;
        if (data.rejected && data.rejected.length > 0) {
            showToast(`${data.total_pairs} par(es) aceito(s). Recusados: ${data.rejected.map(r => r.video).join(', ')}`, 'error');
        } else { showToast(`${data.total_pairs} par(es) enviado(s) e validado(s)!`); }
        document.getElementById('editor-settings').style.display = 'block';
        document.getElementById('editor-settings').scrollIntoView({ behavior: 'smooth' });
    } catch (err) { console.error(err); showToast(err.message || 'Erro ao enviar arquivos.', 'error'); }
    finally { btn.disabled = false; btn.querySelector('.btn-text').style.display = 'inline'; btn.querySelector('.btn-loading').style.display = 'none'; }
}

async function generateEditorCuts() {
    if (!STATE.sessionId) { showToast('Envie os arquivos primeiro.', 'error'); return; }
    setLoading('btn-generate-editor', true);
    const rEl = document.getElementById('editor-results');
    rEl.innerHTML = `<div class="processing-overlay"><div class="processing-spinner"></div>
    <div class="processing-text">A IA está analisando, cortando e montando seus vídeos...</div>
    <div class="processing-sub">Estrutura: Gancho → Corpo → CTA | Pode levar alguns minutos</div></div>`;
    try {
        const fd = new FormData();
        fd.append('session_id', STATE.sessionId); fd.append('duracao', STATE.editorDuration);
        fd.append('variacoes', STATE.editorVariations); fd.append('modo', STATE.editorMode);
        const res = await fetch(`${CONFIG.API_BASE}/api/v2/editor/generate`, { method: 'POST', body: fd });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || `Erro ${res.status}`); }
        const data = await res.json();
        renderEditorResults(data); showToast(`${data.total_videos_gerados} vídeo(s) gerado(s)!`);
    } catch (err) { console.error(err); rEl.innerHTML = ''; showToast(err.message || 'Erro ao gerar cortes.', 'error'); }
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
        <span class="meta-chip">Duração alvo: <strong>${r.duracao_alvo}s</strong></span></div></div>`;
        if (r.estrutura) {
            const e = r.estrutura;
            h += `<div class="structure-overview">
            <div class="structure-phase gancho"><div class="structure-phase-name">Gancho</div><div class="structure-phase-stats">${e.duracao_gancho || 0}s</div><div class="structure-phase-sub">${e.total_gancho || 0} corte(s)</div></div>
            <div class="structure-phase corpo"><div class="structure-phase-name">Corpo</div><div class="structure-phase-stats">${e.duracao_corpo || 0}s</div><div class="structure-phase-sub">${e.total_corpo || 0} corte(s)</div></div>
            <div class="structure-phase cta"><div class="structure-phase-name">CTA</div><div class="structure-phase-stats">${e.duracao_cta || 0}s</div><div class="structure-phase-sub">${e.total_cta || 0} corte(s)</div></div></div>`;
            if (e.duracao_total) h += `<div class="meta-chip" style="margin-bottom:20px;">Duração real: <strong>${e.duracao_total}s</strong> / ${e.duracao_alvo}s alvo</div>`;
        }
        if (r.video_gerado && r.download_url) {
            h += `<a href="${CONFIG.API_BASE}${r.download_url}" class="btn-download" download>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar ${escapeHtml(r.output_filename)}</a>`;
        } else {
            h += `<div style="padding:12px 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;font-size:13px;font-weight:600;margin-bottom:16px;">⚠️ Erro ao gerar este vídeo. Tente novamente.</div>`;
        }
        if (r.relatorio && r.relatorio.length) {
            h += `<h3 style="font-size:15px;font-weight:700;margin:24px 0 16px;color:var(--text-primary);">Relatório Detalhado</h3>`;
            r.relatorio.forEach(cut => {
                const fc = cut.fase_estrutural.toLowerCase();
                const sc = cut.score_persuasivo >= 60 ? 'high' : cut.score_persuasivo >= 30 ? 'mid' : 'low';
                h += `<div class="cut-card fase-${fc}"><div class="cut-header"><div style="display:flex;align-items:center;gap:8px;">
                <span class="cut-number">Corte #${cut.corte_numero}</span><span class="fase-badge ${fc}">${cut.fase_estrutural}</span>
                ${cut.arquivo_origem ? `<span class="video-source-label">${escapeHtml(cut.arquivo_origem)}</span>` : ''}</div>
                <div class="cut-score"><div class="score-bar"><div class="score-fill ${sc}" style="width:${cut.score_persuasivo}%"></div></div>
                <span class="score-value ${sc}">${cut.score_persuasivo}/100</span></div></div>
                <div class="cut-timestamps">${cut.timestamp_inicio} → ${cut.timestamp_fim} (${cut.duracao_segundos}s)</div>
                <div class="cut-text">"${escapeHtml(cut.fala)}"</div>
                <div class="cut-reason">${escapeHtml(cut.motivo_selecao)}</div>`;
                if (cut.gatilhos_ativados && cut.gatilhos_ativados.length) {
                    h += '<div class="cut-triggers">';
                    cut.gatilhos_ativados.forEach(g => { h += `<span class="cut-trigger-tag">${g}</span>`; });
                    h += '</div>';
                }
                h += '</div>';
            });
        }
        card.innerHTML = h; c.appendChild(card);
    });
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c Halley Criativos Studio v4', 'font-size:20px;font-weight:bold;color:#6366f1;');
    fetch(`${CONFIG.API_BASE}/health`).then(r => r.json()).then(d => {
        console.log('Backend conectado:', d);
        if (d.ffmpeg_available) console.log('FFmpeg disponível');
    }).catch(() => console.warn('Backend offline'));
});
