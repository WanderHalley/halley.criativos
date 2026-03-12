/**
 * HALLEY CRIATIVOS STUDIO — Frontend Application
 * IA Especialista em Vendas Sênior & Direct Response Marketing
 * 
 * Arquitetura: Vanilla JS modular (zero dependências)
 * Deploy: Cloudflare Pages (GitHub)
 * Backend: Hugging Face Spaces (FastAPI)
 */

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const CONFIG = {
    // ⚠️ ALTERE PARA A URL DO SEU SPACE NO HUGGING FACE
    API_BASE: 'https://SEU-USUARIO-halley-criativos-studio.hf.space',
    // Exemplo: 'https://johndoe-halley-criativos-studio.hf.space'
};

// ============================================================
// ESTADO GLOBAL
// ============================================================

const STATE = {
    creativeType: 'video',         // 'video' ou 'image'
    creativeVariations: 1,
    editorVariations: 1,
    editorDuration: 60,
    editorMode: 'individual',
    uploadedFiles: [],             // Arquivos carregados
    parsedSRTs: [],                // SRTs parseados pelo backend
};

// ============================================================
// TABS
// ============================================================

function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============================================================
// CREATIVE TYPE SELECTOR
// ============================================================

function selectCreativeType(type) {
    STATE.creativeType = type;
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');

    // Show/hide image format selector
    const formatGroup = document.getElementById('formato-group');
    formatGroup.style.display = type === 'image' ? 'flex' : 'none';
}

// ============================================================
// STEPPER
// ============================================================

function adjustVariations(delta, context) {
    const key = context === 'creative' ? 'creativeVariations' : 'editorVariations';
    const displayId = context === 'creative' ? 'creative-variations' : 'editor-variations';

    STATE[key] = Math.max(1, Math.min(10, STATE[key] + delta));
    document.getElementById(displayId).textContent = STATE[key];
}

// ============================================================
// DURATION & MODE SELECTORS (Editor)
// ============================================================

function selectDuration(dur) {
    STATE.editorDuration = dur;
    document.querySelectorAll('.dur-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.dur-btn[data-dur="${dur}"]`).classList.add('active');
}

function selectMode(mode) {
    STATE.editorMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3500);
}

// ============================================================
// COPY TO CLIPBOARD
// ============================================================

function copyToClipboard(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
        const original = btnElement.innerHTML;
        btnElement.innerHTML = '✓ Copiado!';
        btnElement.classList.add('copied');
        showToast('Prompt copiado para a área de transferência!');
        setTimeout(() => {
            btnElement.innerHTML = original;
            btnElement.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Prompt copiado!');
    });
}

// ============================================================
// LOADING STATE
// ============================================================

function setLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    const textSpan = btn.querySelector('.btn-text');
    const loadingSpan = btn.querySelector('.btn-loading');

    if (loading) {
        btn.disabled = true;
        textSpan.style.display = 'none';
        loadingSpan.style.display = 'flex';
    } else {
        btn.disabled = false;
        textSpan.style.display = 'inline';
        loadingSpan.style.display = 'none';
    }
}

// ============================================================
// ABA 1 — GERADOR DE CRIATIVOS
// ============================================================

document.getElementById('creative-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const produto = document.getElementById('produto').value.trim();
    const publico = document.getElementById('publico').value.trim();
    const objetivo = document.getElementById('objetivo').value.trim();
    const tom = document.getElementById('tom').value;
    const plataforma = document.getElementById('plataforma').value;
    const contexto = document.getElementById('contexto').value.trim();
    const formato = document.getElementById('formato').value;

    if (!produto || !publico || !objetivo) {
        showToast('Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    setLoading('btn-generate-creative', true);

    try {
        const endpoint = STATE.creativeType === 'video'
            ? '/api/v1/creative/video'
            : '/api/v1/creative/image';

        const body = {
            produto,
            publico_alvo: publico,
            objetivo,
            tom_voz: tom,
            plataforma,
            variacoes: STATE.creativeVariations,
            contexto_extra: contexto,
        };

        if (STATE.creativeType === 'image') {
            body.formato = formato;
        }

        const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const data = await response.json();

        if (STATE.creativeType === 'video') {
            renderVideoResults(data.variacoes);
        } else {
            renderImageResults(data.variacoes);
        }

        showToast(`${data.total_variacoes} variação(ões) gerada(s) com sucesso!`);

    } catch (err) {
        console.error(err);
        showToast('Erro ao conectar com a IA. Verifique se o backend está online.', 'error');
    } finally {
        setLoading('btn-generate-creative', false);
    }
});

// ============================================================
// RENDER — VIDEO RESULTS
// ============================================================

function renderVideoResults(variacoes) {
    const container = document.getElementById('creative-results');
    container.innerHTML = '';

    variacoes.forEach(v => {
        const card = document.createElement('div');
        card.className = 'result-card';

        // Header
        let html = `
            <div class="result-header">
                <span class="result-badge">Variação ${v.variacao}</span>
                <span class="result-framework">${v.framework}</span>
            </div>
            <div class="result-angle">${v.angulo_criativo}</div>
        `;

        // Roteiro Completo
        const roteiroId = `roteiro-${v.variacao}`;
        html += `
            <div class="roteiro-block">
                <div class="roteiro-title">Roteiro Completo</div>
                <div class="roteiro-text" id="${roteiroId}">${escapeHtml(v.roteiro_completo)}</div>
                <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${roteiroId}').innerText, this)">
                    Copiar Roteiro
                </button>
            </div>
        `;

        // Storyboard
        html += '<h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:16px;">Storyboard — Cena a Cena</h3>';

        v.storyboard.forEach(scene => {
            const promptId = `veo3-${v.variacao}-${scene.cena}`;
            html += `
                <div class="scene-card">
                    <div class="scene-header">
                        <div class="scene-phase">
                            <div class="scene-number">${scene.cena}</div>
                            <span class="scene-phase-name">${scene.fase}</span>
                        </div>
                        <span class="scene-time">${scene.tempo}</span>
                    </div>
                    <div class="scene-objective">${scene.objetivo_da_cena}</div>
                    
                    <div class="scene-section">
                        <div class="scene-section-title">Narração</div>
                        <div class="scene-narration">${escapeHtml(scene['narração'])}</div>
                    </div>
                    
                    <div class="scene-section">
                        <div class="scene-section-title">Descrição Visual</div>
                        <div class="scene-visual">${escapeHtml(scene['descrição_visual'])}</div>
                    </div>
                    
                    <div class="scene-cut">${scene.corte_sugerido}</div>
                    
                    <div class="prompt-block">
                        <div class="prompt-label">Prompt Veo 3</div>
                        <div class="prompt-text" id="${promptId}">${escapeHtml(scene.prompt_veo3)}</div>
                        <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${promptId}').innerText, this)">
                            Copiar
                        </button>
                    </div>
                </div>
            `;
        });

        card.innerHTML = html;
        container.appendChild(card);
    });

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// RENDER — IMAGE RESULTS
// ============================================================

function renderImageResults(variacoes) {
    const container = document.getElementById('creative-results');
    container.innerHTML = '';

    variacoes.forEach(v => {
        const card = document.createElement('div');
        card.className = 'result-card';

        let html = `
            <div class="result-header">
                <span class="result-badge">Variação ${v.variacao}</span>
                <span class="result-framework">${v.plataforma}</span>
            </div>
            <div class="result-angle">${v.angulo_criativo}</div>
        `;

        // Copy Section
        html += `
            <div class="image-copy-section">
                <div class="copy-item">
                    <div class="copy-item-label">Headline</div>
                    <div class="copy-item-headline">${escapeHtml(v.headline)}</div>
                </div>
                <div class="copy-item">
                    <div class="copy-item-label">Subheadline</div>
                    <div class="copy-item-subheadline">${escapeHtml(v.subheadline)}</div>
                </div>
                <div class="copy-item">
                    <div class="copy-item-label">CTA (Call-to-Action)</div>
                    <div class="copy-item-cta">${escapeHtml(v.cta)}</div>
                </div>
                <div class="copy-item">
                    <div class="copy-item-label">Conceito Criativo</div>
                    <div class="copy-item-subheadline">${escapeHtml(v.conceito)}</div>
                </div>
            </div>
        `;

        // Format Prompts
        html += '<div class="format-prompts">';
        for (const [fmtKey, fmtData] of Object.entries(v.formatos)) {
            const promptId = `nano-${v.variacao}-${fmtKey}`;
            html += `
                <div class="format-card">
                    <div class="format-header">
                        <span class="format-name">${fmtData.formato}</span>
                        <span class="format-res">${fmtData.resolucao}</span>
                    </div>
                    <div class="prompt-block" style="position:relative;">
                        <div class="prompt-label">Prompt Nano Banana</div>
                        <div class="prompt-text" id="${promptId}">${escapeHtml(fmtData.prompt_nano_banana)}</div>
                        <button class="btn-copy" onclick="copyToClipboard(document.getElementById('${promptId}').innerText, this)">
                            Copiar
                        </button>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        card.innerHTML = html;
        container.appendChild(card);
    });

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// ABA 2 — EDITOR AUTOMÁTICO: FILE UPLOAD
// ============================================================

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');

// Click to upload
uploadZone.addEventListener('click', () => fileInput.click());

// Drag & Drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(fileList) {
    const newFiles = Array.from(fileList);
    STATE.uploadedFiles = [...STATE.uploadedFiles, ...newFiles];
    renderFileList();
    processUploadedSRTs();
}

function removeFile(index) {
    STATE.uploadedFiles.splice(index, 1);
    renderFileList();
    if (STATE.uploadedFiles.length === 0) {
        document.getElementById('editor-settings').style.display = 'none';
    }
    processUploadedSRTs();
}

function renderFileList() {
    const listContainer = document.getElementById('file-list');
    const pairsContainer = document.getElementById('file-pairs');

    if (STATE.uploadedFiles.length === 0) {
        listContainer.style.display = 'none';
        return;
    }

    listContainer.style.display = 'block';

    // Separate videos and SRTs
    const videos = [];
    const srts = [];

    STATE.uploadedFiles.forEach((file, idx) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (['srt', 'vtt', 'sub'].includes(ext)) {
            srts.push({ file, idx, name: file.name });
        } else {
            videos.push({ file, idx, name: file.name });
        }
    });

    // Find pairs
    const getBaseName = (name) => name.replace(/\.[^.]+$/, '').toLowerCase();

    let html = '';

    // Render videos with pair status
    videos.forEach(v => {
        const baseName = getBaseName(v.name);
        const paired = srts.find(s => getBaseName(s.name) === baseName);

        html += `
            <div class="file-pair">
                <div class="file-pair-info">
                    <span class="file-pair-icon">🎬</span>
                    <div>
                        <div class="file-pair-name">${escapeHtml(v.name)}</div>
                        <div class="file-pair-type">Vídeo${paired ? ' + SRT: ' + paired.name : ''}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span class="file-pair-status ${paired ? 'paired' : 'missing'}">
                        ${paired ? '✅ Par encontrado' : '⚠️ SRT não encontrado'}
                    </span>
                    <button class="file-pair-remove" onclick="removeFile(${v.idx})" title="Remover">✕</button>
                </div>
            </div>
        `;
    });

    // Render SRTs without pair
    srts.forEach(s => {
        const baseName = getBaseName(s.name);
        const paired = videos.find(v => getBaseName(v.name) === baseName);
        if (!paired) {
            html += `
                <div class="file-pair">
                    <div class="file-pair-info">
                        <span class="file-pair-icon">📝</span>
                        <div>
                            <div class="file-pair-name">${escapeHtml(s.name)}</div>
                            <div class="file-pair-type">Legenda SRT (sem vídeo pareado)</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="file-pair-status paired">✅ SRT carregado</span>
                        <button class="file-pair-remove" onclick="removeFile(${s.idx})" title="Remover">✕</button>
                    </div>
                </div>
            `;
        }
    });

    pairsContainer.innerHTML = html;
}

// ============================================================
// PROCESS SRTs
// ============================================================

async function processUploadedSRTs() {
    const srtFiles = STATE.uploadedFiles.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return ['srt', 'vtt', 'sub'].includes(ext);
    });

    if (srtFiles.length === 0) {
        STATE.parsedSRTs = [];
        document.getElementById('editor-settings').style.display = 'none';
        return;
    }

    // Upload SRTs to backend for parsing
    try {
        const formData = new FormData();
        srtFiles.forEach(f => formData.append('files', f));

        const response = await fetch(`${CONFIG.API_BASE}/api/v1/editor/upload-srt`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const data = await response.json();
        STATE.parsedSRTs = data.files;
        document.getElementById('editor-settings').style.display = 'block';
        showToast(`${data.total_files} SRT(s) analisado(s) com sucesso!`);

    } catch (err) {
        console.error(err);
        // Fallback: parse locally
        STATE.parsedSRTs = await parseSTRsLocally(srtFiles);
        if (STATE.parsedSRTs.length > 0) {
            document.getElementById('editor-settings').style.display = 'block';
            showToast(`${STATE.parsedSRTs.length} SRT(s) processado(s) localmente.`);
        }
    }
}

// Local SRT parser fallback
async function parseSTRsLocally(files) {
    const results = [];
    for (const file of files) {
        const text = await file.text();
        const segments = [];
        const blocks = text.trim().split(/\n\s*\n/);

        for (const block of blocks) {
            const lines = block.trim().split('\n');
            if (lines.length < 2) continue;

            const index = parseInt(lines[0]);
            if (isNaN(index)) continue;

            const timeMatch = lines[1].match(
                /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
            );
            if (!timeMatch) continue;

            const start = timeMatch[1].replace(',', '.');
            const end = timeMatch[2].replace(',', '.');
            const segText = lines.slice(2).join(' ').replace(/<[^>]+>/g, '').trim();

            if (segText) {
                const startSec = timestampToSeconds(start);
                const endSec = timestampToSeconds(end);
                segments.push({
                    index,
                    start,
                    end,
                    start_seconds: startSec,
                    end_seconds: endSec,
                    duration_seconds: Math.round((endSec - startSec) * 100) / 100,
                    text: segText
                });
            }
        }

        results.push({
            filename: file.name,
            total_segments: segments.length,
            segments
        });
    }
    return results;
}

function timestampToSeconds(ts) {
    const parts = ts.replace(',', '.').split(':');
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
}

// ============================================================
// GENERATE EDITOR CUTS
// ============================================================

async function generateEditorCuts() {
    if (STATE.parsedSRTs.length === 0) {
        showToast('Carregue pelo menos um arquivo SRT.', 'error');
        return;
    }

    setLoading('btn-generate-editor', true);

    try {
        const formData = new FormData();
        formData.append('srt_data', JSON.stringify(STATE.parsedSRTs));
        formData.append('duracao', STATE.editorDuration);
        formData.append('variacoes', STATE.editorVariations);
        formData.append('modo', STATE.editorMode);

        const response = await fetch(`${CONFIG.API_BASE}/api/v1/editor/generate-cuts`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        const data = await response.json();
        renderEditorResults(data);
        showToast(`${data.total_variacoes} variação(ões) de corte gerada(s)!`);

    } catch (err) {
        console.error(err);
        showToast('Erro ao gerar cortes. Verifique o backend.', 'error');
    } finally {
        setLoading('btn-generate-editor', false);
    }
}

// ============================================================
// RENDER — EDITOR RESULTS
// ============================================================

function renderEditorResults(data) {
    const container = document.getElementById('editor-results');
    container.innerHTML = '';

    data.variacoes.forEach(v => {
        const card = document.createElement('div');
        card.className = 'variation-card';

        // Header
        let html = `
            <div class="variation-header">
                <span class="result-badge">Variação ${v.variacao}</span>
                <div class="variation-meta">
                    <span class="meta-chip">Duração: <strong>${v.duracao_total_segundos}s</strong> / ${v.duracao_alvo_segundos}s</span>
                    <span class="meta-chip">Cortes: <strong>${v.total_cortes}</strong></span>
                    <span class="meta-chip">Score Médio: <strong>${v.score_medio_persuasivo}</strong>/100</span>
                    <span class="meta-chip">Modo: <strong>${v.modo}</strong></span>
                </div>
            </div>
        `;

        // Trigger Distribution
        if (v.distribuicao_gatilhos && Object.keys(v.distribuicao_gatilhos).length > 0) {
            html += '<div class="trigger-distribution">';
            for (const [trigger, count] of Object.entries(v.distribuicao_gatilhos)) {
                html += `<span class="trigger-tag">${trigger} × ${count}</span>`;
            }
            html += '</div>';
        }

        // Cuts
        v.cortes.forEach(cut => {
            const scoreClass = cut.score_persuasivo >= 60 ? 'high' : cut.score_persuasivo >= 30 ? 'mid' : 'low';

            html += `
                <div class="cut-card ${scoreClass}-score">
                    <div class="cut-header">
                        <span class="cut-number">Corte #${cut.corte_numero} — ${escapeHtml(cut.arquivo_origem)}</span>
                        <div class="cut-score">
                            <div class="score-bar">
                                <div class="score-fill ${scoreClass}" style="width: ${cut.score_persuasivo}%"></div>
                            </div>
                            <span class="score-value ${scoreClass}">${cut.score_persuasivo}/100</span>
                        </div>
                    </div>
                    <div class="cut-timestamps">${cut.timestamp_inicio} → ${cut.timestamp_fim} (${cut.duracao_segundos}s)</div>
                    <div class="cut-text">"${escapeHtml(cut.fala)}"</div>
                    <div class="cut-reason">${escapeHtml(cut.motivo_selecao)}</div>
            `;

            if (cut.gatilhos_ativados && cut.gatilhos_ativados.length > 0) {
                html += '<div class="cut-triggers">';
                cut.gatilhos_ativados.forEach(g => {
                    html += `<span class="cut-trigger-tag">${g}</span>`;
                });
                html += '</div>';
            }

            html += '</div>';
        });

        card.innerHTML = html;
        container.appendChild(card);
    });

    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// UTILITIES
// ============================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🚀 Halley Criativos Studio', 'font-size:20px;font-weight:bold;color:#6366f1;');
    console.log('%cIA Especialista em Vendas Sênior & Direct Response Marketing', 'font-size:12px;color:#a855f7;');
    console.log(`%cBackend: ${CONFIG.API_BASE}`, 'font-size:11px;color:#888;');

    // Check backend health
    fetch(`${CONFIG.API_BASE}/health`)
        .then(r => r.json())
        .then(() => console.log('✅ Backend conectado'))
        .catch(() => console.warn('⚠️ Backend offline — verifique o Hugging Face Space'));
});
