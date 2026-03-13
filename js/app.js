/**
 * HALLEY CRIATIVOS STUDIO — Frontend v6.0
 * Bug fix: download URLs | Prompts rendering melhorado
 */

const CONFIG = {
    API_BASE: 'https://wanderhalleylee-criativo-studio-backend.hf.space',
};

const STATE = {
    creativeType: 'video',
    variations: 3,
    creativeFiles: [],
    editorMode: 'individual',
    editorDuration: 30,
    editorVariations: 1,
    editorFiles: [],
    editorSessionId: null,
};

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    initUploads();
});

async function checkHealth() {
    const el = document.getElementById('headerStatus');
    try {
        const r = await fetch(CONFIG.API_BASE + '/health', {signal: AbortSignal.timeout(10000)});
        if (r.ok) {
            el.innerHTML = '<span class="status-dot online"></span><span>IA Online</span>';
        } else {
            el.innerHTML = '<span class="status-dot offline"></span><span>IA Offline</span>';
        }
    } catch {
        el.innerHTML = '<span class="status-dot offline"></span><span>Sem conexão</span>';
    }
}

// ============================================================
// TABS
// ============================================================
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

// ============================================================
// UPLOADS
// ============================================================
function initUploads() {
    setupZone('creativeUploadZone', 'creativeFileInput', handleCreativeFiles);
    setupZone('editorUploadZone', 'editorFileInput', handleEditorFiles);
}

function setupZone(zoneId, inputId, handler) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); handler(e.dataTransfer.files); });
    input.addEventListener('change', e => handler(e.target.files));
}

function handleCreativeFiles(fileList) {
    const valid = Array.from(fileList).filter(f => /\.(srt|txt)$/i.test(f.name));
    if (!valid.length) { showToast('Envie apenas .srt ou .txt', 'error'); return; }
    STATE.creativeFiles = [...STATE.creativeFiles, ...valid];
    renderFileList('creativeFileList', STATE.creativeFiles, 'creative');
}

function handleEditorFiles(fileList) {
    const valid = Array.from(fileList).filter(f => /\.(mp4|mov|avi|mkv|webm|srt)$/i.test(f.name));
    STATE.editorFiles = [...STATE.editorFiles, ...valid];
    renderFileList('editorFileList', STATE.editorFiles, 'editor');
    document.getElementById('btnUploadEditor').disabled = STATE.editorFiles.length === 0;
}

function renderFileList(containerId, files, type) {
    const el = document.getElementById(containerId);
    if (!files.length) { el.innerHTML = ''; return; }
    el.innerHTML = files.map((f, i) =>
        '<div class="file-item"><span>' + (f.name.endsWith('.srt') || f.name.endsWith('.txt') ? '📄' : '🎬') +
        ' ' + esc(f.name) + ' (' + (f.size / 1024).toFixed(1) + ' KB)</span>' +
        '<button class="btn-remove" onclick="removeFile(\'' + type + '\',' + i + ')">✕</button></div>'
    ).join('');
}

function removeFile(type, idx) {
    if (type === 'creative') {
        STATE.creativeFiles.splice(idx, 1);
        renderFileList('creativeFileList', STATE.creativeFiles, 'creative');
    } else {
        STATE.editorFiles.splice(idx, 1);
        renderFileList('editorFileList', STATE.editorFiles, 'editor');
        document.getElementById('btnUploadEditor').disabled = STATE.editorFiles.length === 0;
    }
}

// ============================================================
// CONFIG UI
// ============================================================
function setCreativeType(type) {
    STATE.creativeType = type;
    document.getElementById('btnTypeVideo').classList.toggle('active', type === 'video');
    document.getElementById('btnTypeImage').classList.toggle('active', type === 'image');
    document.getElementById('typeDescription').innerHTML = type === 'video'
        ? '<strong>Modo Vídeo:</strong> Roteiros completos (Hook→Corpo→CTA) + Storyboard + Prompts Nano Banana Pro + Prompts Veo 3'
        : '<strong>Modo Imagem:</strong> Copies persuasivas + Prompts Nano Banana Pro para Feed (1:1), Story (9:16) e Banner (16:9)';
}

function adjustVariations(d) {
    STATE.variations = Math.max(1, Math.min(10, STATE.variations + d));
    document.getElementById('variationCount').textContent = STATE.variations;
}

function adjustDuration(d) {
    STATE.editorDuration = Math.max(10, Math.min(120, STATE.editorDuration + d));
    document.getElementById('durationValue').textContent = STATE.editorDuration;
}

function adjustEditorVariations(d) {
    STATE.editorVariations = Math.max(1, Math.min(5, STATE.editorVariations + d));
    document.getElementById('editorVariationCount').textContent = STATE.editorVariations;
}

function setEditorMode(mode) {
    STATE.editorMode = mode;
    document.getElementById('btnModeIndividual').classList.toggle('active', mode === 'individual');
    document.getElementById('btnModeTodos').classList.toggle('active', mode === 'todos');
}

// ============================================================
// ABA 1: GERAR CRIATIVOS
// ============================================================
async function generateCreatives() {
    if (!STATE.creativeFiles.length) { showToast('Envie pelo menos um arquivo', 'error'); return; }
    const produto = document.getElementById('productName').value.trim();
    if (!produto) { showToast('Preencha o nome do produto', 'error'); return; }
    const publico = document.getElementById('targetAudience').value.trim();
    if (!publico) { showToast('Preencha o público-alvo', 'error'); return; }

    const fd = new FormData();
    STATE.creativeFiles.forEach(f => fd.append('files', f));
    fd.append('tipo', STATE.creativeType);
    fd.append('variacoes', STATE.variations);
    fd.append('produto', produto);
    fd.append('publico_alvo', publico);
    fd.append('tom_voz', document.getElementById('voiceTone').value);

    document.getElementById('btnGenerate').disabled = true;
    document.getElementById('creativeLoading').style.display = 'block';
    document.getElementById('creativeResults').innerHTML = '';

    try {
        const res = await fetch(CONFIG.API_BASE + '/api/v1/creative/generate', {method: 'POST', body: fd});
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Erro no servidor');
        if (data.status === 'success') {
            STATE.creativeType === 'video' ? renderVideoResults(data) : renderImageResults(data);
            showToast(data.total_variacoes + ' criativos gerados!', 'success');
        }
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
        document.getElementById('creativeResults').innerHTML =
            '<div class="error-card"><h3>❌ Erro</h3><p>' + esc(err.message) + '</p></div>';
    } finally {
        document.getElementById('btnGenerate').disabled = false;
        document.getElementById('creativeLoading').style.display = 'none';
    }
}

// ============================================================
// RENDER — VÍDEO
// ============================================================
function renderVideoResults(data) {
    const c = document.getElementById('creativeResults');
    let h = '<div class="results-header"><h3>🎬 Criativos de Vídeo — ' + esc(data.produto) + '</h3>' +
        '<p>' + data.total_variacoes + ' variações | ' + data.total_palavras_base + ' palavras | Tom: ' + esc(data.tom_voz) + '</p></div>';

    data.resultados.forEach((r, idx) => {
        const rot = r.roteiro || {};
        const hook = rot.hook || {};
        const corpo = rot.corpo || [];
        const cta = rot.cta || {};
        const sb = r.storyboard || [];

        h += '<div class="result-card">';
        h += '<div class="result-header"><h4>Variação #' + r.variacao + ' — ' + esc(r.framework) + '</h4>';
        h += '<span class="badge">' + esc(r.framework_descricao || '') + '</span></div>';
        h += '<p class="angle"><strong>Ângulo:</strong> ' + esc(r.angulo_criativo || '') + '</p>';
        h += '<p class="duration">⏱ ' + esc(r.duracao_total_estimada || '30s') + '</p>';

        // Roteiro
        h += '<div class="script-section">';
        h += renderBlock('🎣 HOOK', hook, 'hook');
        corpo.forEach((c, i) => { h += renderBlock('📝 CORPO ' + (i + 1), c, 'body'); });
        h += renderBlock('🎯 CTA', cta, 'cta');
        h += '</div>';

        // Gatilhos
        if (r.gatilhos_usados && r.gatilhos_usados.length) {
            h += '<div class="triggers-row"><strong>Gatilhos:</strong> ' +
                r.gatilhos_usados.map(g => '<span class="trigger-badge">' + esc(g) + '</span>').join(' ') + '</div>';
        }

        // Storyboard
        if (sb.length) {
            h += '<div class="storyboard-section"><h5>📋 Storyboard + Prompts Profissionais</h5>';
            sb.forEach(s => {
                h += '<div class="storyboard-scene">';
                h += '<div class="scene-header">' + esc(s.cena) + ' — ' + esc(s.duracao || '') + '</div>';
                h += '<div class="scene-visual">' + esc(s.descricao_visual || '') + '</div>';
                h += '<div class="prompt-group">';
                h += renderPrompt('🖼️ Nano Banana Pro (Imagem)', s.prompt_nano_banana || '');
                h += renderPrompt('🎬 Veo 3 (Vídeo)', s.prompt_veo3 || '');
                h += '</div></div>';
            });
            h += '</div>';
        }

        h += '<button class="btn-copy-all" onclick="copyVideoScript(' + idx + ')">📋 Copiar Roteiro Completo</button>';
        h += '</div>';
    });

    c.innerHTML = h;
    window._videoResults = data.resultados;
}

function renderBlock(label, block, type) {
    if (!block || !block.texto) return '';
    return '<div class="script-block ' + type + '-block">' +
        '<div class="block-label">' + label + '</div>' +
        '<div class="block-text">' + esc(block.texto) + '</div>' +
        '<div class="block-visual">🎥 ' + esc(block.instrucao_visual || '') + '</div>' +
        '<div class="block-time">' + esc(block.duracao || block.duracao_estimada || '') + '</div></div>';
}

function renderPrompt(label, text) {
    if (!text) return '';
    return '<div class="prompt-item"><strong>' + label + ':</strong>' +
        '<div class="prompt-text">' + esc(text) + '</div>' +
        '<button class="btn-copy" onclick="copyToClipboard(this)">📋 Copiar</button></div>';
}

// ============================================================
// RENDER — IMAGEM
// ============================================================
function renderImageResults(data) {
    const c = document.getElementById('creativeResults');
    let h = '<div class="results-header"><h3>🖼️ Criativos de Imagem — ' + esc(data.produto) + '</h3>' +
        '<p>' + data.total_variacoes + ' variações | ' + data.total_palavras_base + ' palavras | Tom: ' + esc(data.tom_voz) + '</p></div>';

    data.resultados.forEach((r, idx) => {
        const copy = r.copy || {};
        const fmts = r.formatos || {};

        h += '<div class="result-card">';
        h += '<div class="result-header"><h4>Variação #' + r.variacao + ' — ' + esc(r.angulo || '') + '</h4></div>';
        h += '<p class="concept"><strong>Conceito:</strong> ' + esc(r.conceito_visual || '') + '</p>';

        // Copy preview
        h += '<div class="copy-section">';
        h += '<div class="copy-headline">' + esc(copy.headline || '') + '</div>';
        h += '<div class="copy-subheadline">' + esc(copy.sub_headline || '') + '</div>';
        h += '<div class="copy-cta">' + esc(copy.cta_texto || '') + '</div>';
        if (copy.texto_apoio) h += '<div class="copy-support">' + esc(copy.texto_apoio) + '</div>';
        h += '</div>';

        // Formatos
        var fmtLabels = {feed: '📐 Feed (1:1)', story: '📱 Story (9:16)', banner: '🖥️ Banner (16:9)'};
        Object.keys(fmtLabels).forEach(fmt => {
            var fd = fmts[fmt];
            if (!fd) return;
            h += '<div class="format-section"><h5>' + fmtLabels[fmt] + '</h5>';
            h += '<p class="format-layout">' + esc(fd.layout || fd.descricao_layout || '') + '</p>';
            h += renderPrompt('🖼️ Nano Banana Pro', fd.prompt_nano_banana || '');
            h += '</div>';
        });

        // Gatilhos
        if (r.gatilhos_usados && r.gatilhos_usados.length) {
            h += '<div class="triggers-row"><strong>Gatilhos:</strong> ' +
                r.gatilhos_usados.map(g => '<span class="trigger-badge">' + esc(g) + '</span>').join(' ') + '</div>';
        }

        h += '<button class="btn-copy-all" onclick="copyImageScript(' + idx + ')">📋 Copiar Tudo</button>';
        h += '</div>';
    });

    c.innerHTML = h;
    window._imageResults = data.resultados;
}

// ============================================================
// ABA 2: EDITOR
// ============================================================
async function uploadEditorFiles() {
    if (!STATE.editorFiles.length) return;
    const fd = new FormData();
    STATE.editorFiles.forEach(f => fd.append('files', f));

    document.getElementById('btnUploadEditor').disabled = true;
    document.getElementById('editorLoading').style.display = 'block';

    try {
        const res = await fetch(CONFIG.API_BASE + '/api/v2/editor/upload', {method: 'POST', body: fd});
        const data = await res.json();
        if (data.status === 'success') {
            STATE.editorSessionId = data.session_id;
            document.getElementById('btnGenerateEditor').disabled = false;
            var pl = document.getElementById('editorPairList');
            var html = '';
            if (data.pairs.length) {
                html += '<h4>✅ Pares detectados:</h4>';
                data.pairs.forEach(p => {
                    html += '<div class="pair-item"><span>🎬 ' + esc(p.video) + ' ↔ 📄 ' + esc(p.srt) + '</span><span class="pair-segments">' + p.segments + ' segmentos</span></div>';
                });
            }
            if (data.rejected.length) {
                html += '<h4>⚠️ Rejeitados:</h4>';
                data.rejected.forEach(r => {
                    html += '<div class="pair-item rejected"><span>❌ ' + esc(r.filename) + ': ' + esc(r.reason) + '</span></div>';
                });
            }
            pl.innerHTML = html;
            showToast(data.pairs.length + ' par(es) válido(s)', 'success');
        }
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        document.getElementById('btnUploadEditor').disabled = false;
        document.getElementById('editorLoading').style.display = 'none';
    }
}

async function generateEditorCuts() {
    if (!STATE.editorSessionId) { showToast('Faça upload primeiro', 'error'); return; }

    const fd = new FormData();
    fd.append('session_id', STATE.editorSessionId);
    fd.append('target_duration', STATE.editorDuration);
    fd.append('variations', STATE.editorVariations);
    fd.append('mode', STATE.editorMode);

    document.getElementById('btnGenerateEditor').disabled = true;
    document.getElementById('editorLoading').style.display = 'block';
    document.getElementById('editorResults').innerHTML = '';

    try {
        const res = await fetch(CONFIG.API_BASE + '/api/v2/editor/generate', {method: 'POST', body: fd});
        const data = await res.json();
        if (data.status === 'success') {
            renderEditorResults(data);
            showToast(data.total_results + ' resultado(s)!', 'success');
        }
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    } finally {
        document.getElementById('btnGenerateEditor').disabled = false;
        document.getElementById('editorLoading').style.display = 'none';
    }
}

function renderEditorResults(data) {
    var c = document.getElementById('editorResults');
    var h = '<div class="results-header"><h3>✂️ Resultados do Editor</h3></div>';

    data.results.forEach(r => {
        // ===== FIX DO BUG DE DOWNLOAD =====
        // Monta a URL limpa sem template literal que adicionava espaços
        var downloadBtn = '';
        if (r.download_url) {
            var cleanUrl = CONFIG.API_BASE + r.download_url.trim();
            downloadBtn = '<a href="' + cleanUrl + '" class="btn-download" download>⬇️ Download MP4</a>';
        }

        h += '<div class="result-card">';
        h += '<div class="result-header">';
        h += '<h4>' + (r.source_video ? '🎬 ' + esc(r.source_video) : '🎬 Mix Multi-Vídeo') + ' — Variação #' + r.variation + '</h4>';
        h += downloadBtn;
        h += '</div>';

        if (r.error) {
            h += '<div class="error-inline">⚠️ ' + esc(r.error) + '</div>';
        }

        h += '<p>⏱ Duração: ' + (r.total_duration ? r.total_duration.toFixed(1) + 's' : 'N/A') + ' | Segmentos: ' + (r.segment_count || 'N/A') + '</p>';

        h += '<div class="structure-breakdown">';
        (r.structure || []).forEach(s => {
            var role = (s.role || 'BODY').toUpperCase();
            var icon = role === 'HOOK' ? '🎣' : role === 'CTA' ? '🎯' : '📝';
            var cls = role === 'HOOK' ? 'segment-hook' : role === 'CTA' ? 'segment-cta' : 'segment-body';

            h += '<div class="segment-item ' + cls + '">';
            h += '<div class="segment-role">' + icon + ' ' + role + '</div>';
            h += '<div class="segment-text">' + esc(s.text || '') + '</div>';
            h += '<div class="segment-meta">';
            if (s.source_video) h += '📁 ' + esc(s.source_video) + ' | ';
            if (s.start !== undefined) h += s.start.toFixed(1) + 's → ' + s.end.toFixed(1) + 's | ';
            h += 'Score: ' + (s.score || 0);
            if (s.triggers && s.triggers.length) {
                h += ' | ' + s.triggers.map(t => '<span class="trigger-badge-sm">' + esc(t) + '</span>').join(' ');
            }
            h += '</div></div>';
        });
        h += '</div></div>';
    });

    c.innerHTML = h;
}

// ============================================================
// CLIPBOARD
// ============================================================
function copyToClipboard(btn) {
    var textEl = btn.previousElementSibling;
    if (!textEl) return;
    var text = textEl.textContent || textEl.innerText;
    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✅ Copiado!';
        setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
    }).catch(() => {
        fallbackCopy(text);
        btn.textContent = '✅ Copiado!';
        setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
    });
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
}

function copyVideoScript(idx) {
    if (!window._videoResults || !window._videoResults[idx]) return;
    var r = window._videoResults[idx];
    var rot = r.roteiro || {};
    var t = '=== VARIAÇÃO #' + r.variacao + ' — ' + r.framework + ' ===\n';
    t += 'Ângulo: ' + (r.angulo_criativo || '') + '\n';
    t += 'Duração: ' + (r.duracao_total_estimada || '') + '\n\n';
    if (rot.hook) t += '🎣 HOOK:\n' + rot.hook.texto + '\nVisual: ' + (rot.hook.instrucao_visual || '') + '\n\n';
    (rot.corpo || []).forEach((c, i) => {
        t += '📝 CORPO ' + (i + 1) + ':\n' + c.texto + '\nVisual: ' + (c.instrucao_visual || '') + '\n\n';
    });
    if (rot.cta) t += '🎯 CTA:\n' + rot.cta.texto + '\nVisual: ' + (rot.cta.instrucao_visual || '') + '\n\n';
    if (r.gatilhos_usados) t += 'Gatilhos: ' + r.gatilhos_usados.join(', ') + '\n\n';
    (r.storyboard || []).forEach(s => {
        t += '--- ' + s.cena + ' ---\n';
        t += 'Nano Banana: ' + (s.prompt_nano_banana || '') + '\n';
        t += 'Veo 3: ' + (s.prompt_veo3 || '') + '\n\n';
    });
    navigator.clipboard.writeText(t).then(() => showToast('Roteiro copiado!', 'success')).catch(() => { fallbackCopy(t); showToast('Roteiro copiado!', 'success'); });
}

function copyImageScript(idx) {
    if (!window._imageResults || !window._imageResults[idx]) return;
    var r = window._imageResults[idx];
    var copy = r.copy || {};
    var t = '=== VARIAÇÃO #' + r.variacao + ' — ' + r.angulo + ' ===\n';
    t += 'Conceito: ' + (r.conceito_visual || '') + '\n\n';
    t += 'HEADLINE: ' + (copy.headline || '') + '\n';
    t += 'SUB: ' + (copy.sub_headline || '') + '\n';
    t += 'CTA: ' + (copy.cta_texto || '') + '\n';
    if (copy.texto_apoio) t += 'APOIO: ' + copy.texto_apoio + '\n';
    t += '\n';
    Object.keys(r.formatos || {}).forEach(fmt => {
        var fd = r.formatos[fmt];
        t += '--- ' + fmt.toUpperCase() + ' ---\n';
        t += 'Layout: ' + (fd.layout || fd.descricao_layout || '') + '\n';
        t += 'Nano Banana: ' + (fd.prompt_nano_banana || '') + '\n\n';
    });
    navigator.clipboard.writeText(t).then(() => showToast('Copy copiada!', 'success')).catch(() => { fallbackCopy(t); showToast('Copy copiada!', 'success'); });
}

// ============================================================
// UTILS
// ============================================================
function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
}

function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-fade'); setTimeout(() => t.remove(), 300); }, 4000);
}
