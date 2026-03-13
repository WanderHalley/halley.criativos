/**
 * HALLEY CRIATIVOS STUDIO — Frontend v5.0
 * Interface para geração de criativos persuasivos de nível ultra-sênior
 */

// ============================================================
// CONFIGURAÇÃO
// ============================================================
const CONFIG = {
    API_BASE: 'https://wanderhalleylee-criativo-studio-backend.hf.space',
};

const STATE = {
    // Aba 1
    creativeType: 'video',
    variations: 3,
    creativeFiles: [],
    // Aba 2
    editorMode: 'individual',
    editorDuration: 30,
    editorVariations: 1,
    editorFiles: [],
    editorSessionId: null,
};

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
    initUploadZones();
});

async function checkBackendHealth() {
    const el = document.getElementById('headerStatus');
    try {
        const res = await fetch(`${CONFIG.API_BASE}/health`, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
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
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============================================================
// UPLOAD ZONES
// ============================================================
function initUploadZones() {
    // Aba 1 - Criativos
    const cZone = document.getElementById('creativeUploadZone');
    const cInput = document.getElementById('creativeFileInput');
    
    cZone.addEventListener('click', () => cInput.click());
    cZone.addEventListener('dragover', e => { e.preventDefault(); cZone.classList.add('drag-over'); });
    cZone.addEventListener('dragleave', () => cZone.classList.remove('drag-over'));
    cZone.addEventListener('drop', e => {
        e.preventDefault();
        cZone.classList.remove('drag-over');
        handleCreativeFiles(e.dataTransfer.files);
    });
    cInput.addEventListener('change', e => handleCreativeFiles(e.target.files));

    // Aba 2 - Editor
    const eZone = document.getElementById('editorUploadZone');
    const eInput = document.getElementById('editorFileInput');
    
    eZone.addEventListener('click', () => eInput.click());
    eZone.addEventListener('dragover', e => { e.preventDefault(); eZone.classList.add('drag-over'); });
    eZone.addEventListener('dragleave', () => eZone.classList.remove('drag-over'));
    eZone.addEventListener('drop', e => {
        e.preventDefault();
        eZone.classList.remove('drag-over');
        handleEditorFiles(e.dataTransfer.files);
    });
    eInput.addEventListener('change', e => handleEditorFiles(e.target.files));
}

function handleCreativeFiles(fileList) {
    const validExts = ['.srt', '.txt'];
    const newFiles = Array.from(fileList).filter(f => {
        const ext = '.' + f.name.split('.').pop().toLowerCase();
        return validExts.includes(ext);
    });

    if (newFiles.length === 0) {
        showToast('Envie apenas arquivos .srt ou .txt', 'error');
        return;
    }

    STATE.creativeFiles = [...STATE.creativeFiles, ...newFiles];
    renderCreativeFileList();
}

function renderCreativeFileList() {
    const el = document.getElementById('creativeFileList');
    if (STATE.creativeFiles.length === 0) {
        el.innerHTML = '';
        return;
    }
    el.innerHTML = STATE.creativeFiles.map((f, i) => `
        <div class="file-item">
            <span>📄 ${escapeHtml(f.name)} (${(f.size / 1024).toFixed(1)} KB)</span>
            <button class="btn-remove" onclick="removeCreativeFile(${i})">✕</button>
        </div>
    `).join('');
}

function removeCreativeFile(index) {
    STATE.creativeFiles.splice(index, 1);
    renderCreativeFileList();
}

function handleEditorFiles(fileList) {
    const validExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.srt'];
    const newFiles = Array.from(fileList).filter(f => {
        const ext = '.' + f.name.split('.').pop().toLowerCase();
        return validExts.includes(ext);
    });

    STATE.editorFiles = [...STATE.editorFiles, ...newFiles];
    renderEditorFileList();
    document.getElementById('btnUploadEditor').disabled = STATE.editorFiles.length === 0;
}

function renderEditorFileList() {
    const el = document.getElementById('editorFileList');
    if (STATE.editorFiles.length === 0) {
        el.innerHTML = '';
        return;
    }

    const videos = STATE.editorFiles.filter(f => !f.name.toLowerCase().endsWith('.srt'));
    const srts = STATE.editorFiles.filter(f => f.name.toLowerCase().endsWith('.srt'));

    el.innerHTML = `
        <div class="file-summary">
            <span>🎬 ${videos.length} vídeo(s)</span>
            <span>📄 ${srts.length} legenda(s)</span>
        </div>
    ` + STATE.editorFiles.map((f, i) => `
        <div class="file-item">
            <span>${f.name.endsWith('.srt') ? '📄' : '🎬'} ${escapeHtml(f.name)} (${(f.size / 1024 / 1024).toFixed(1)} MB)</span>
            <button class="btn-remove" onclick="removeEditorFile(${i})">✕</button>
        </div>
    `).join('');
}

function removeEditorFile(index) {
    STATE.editorFiles.splice(index, 1);
    renderEditorFileList();
    document.getElementById('btnUploadEditor').disabled = STATE.editorFiles.length === 0;
}

// ============================================================
// CONFIGURAÇÕES UI
// ============================================================
function setCreativeType(type) {
    STATE.creativeType = type;
    document.getElementById('btnTypeVideo').classList.toggle('active', type === 'video');
    document.getElementById('btnTypeImage').classList.toggle('active', type === 'image');
    
    const desc = document.getElementById('typeDescription');
    if (type === 'video') {
        desc.innerHTML = '<strong>Modo Vídeo:</strong> Gera roteiros completos (Hook → Corpo → CTA) + Storyboard com prompts Nano Banana (imagem) e Veo 3 (animação)';
    } else {
        desc.innerHTML = '<strong>Modo Imagem:</strong> Gera copies persuasivas (Headline + Sub + CTA) + Prompts Nano Banana para Feed, Story e Banner';
    }
}

function adjustVariations(delta) {
    STATE.variations = Math.max(1, Math.min(10, STATE.variations + delta));
    document.getElementById('variationCount').textContent = STATE.variations;
}

function adjustDuration(delta) {
    STATE.editorDuration = Math.max(10, Math.min(120, STATE.editorDuration + delta));
    document.getElementById('durationValue').textContent = STATE.editorDuration;
}

function adjustEditorVariations(delta) {
    STATE.editorVariations = Math.max(1, Math.min(5, STATE.editorVariations + delta));
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
    // Validações
    if (STATE.creativeFiles.length === 0) {
        showToast('Envie pelo menos um arquivo .srt ou .txt', 'error');
        return;
    }
    const produto = document.getElementById('productName').value.trim();
    if (!produto) {
        showToast('Preencha o nome do produto', 'error');
        return;
    }
    const publico = document.getElementById('targetAudience').value.trim();
    if (!publico) {
        showToast('Preencha o público-alvo', 'error');
        return;
    }

    const tomVoz = document.getElementById('voiceTone').value;

    // Montar FormData
    const formData = new FormData();
    STATE.creativeFiles.forEach(f => formData.append('files', f));
    formData.append('tipo', STATE.creativeType);
    formData.append('variacoes', STATE.variations);
    formData.append('produto', produto);
    formData.append('publico_alvo', publico);
    formData.append('tom_voz', tomVoz);

    // UI loading
    document.getElementById('btnGenerate').disabled = true;
    document.getElementById('creativeLoading').style.display = 'block';
    document.getElementById('creativeResults').innerHTML = '';

    try {
        const res = await fetch(`${CONFIG.API_BASE}/api/v1/creative/generate`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || 'Erro no servidor');
        }

        if (data.status === 'success') {
            if (STATE.creativeType === 'video') {
                renderVideoResults(data);
            } else {
                renderImageResults(data);
            }
            showToast(`${data.total_variacoes} criativos gerados com sucesso!`, 'success');
        } else {
            throw new Error('Resposta inválida do servidor');
        }
    } catch (err) {
        showToast(`Erro: ${err.message}`, 'error');
        document.getElementById('creativeResults').innerHTML = `
            <div class="error-card">
                <h3>❌ Erro ao gerar criativos</h3>
                <p>${escapeHtml(err.message)}</p>
                <p class="error-hint">Verifique se o backend está online e o HF_TOKEN está configurado.</p>
            </div>
        `;
    } finally {
        document.getElementById('btnGenerate').disabled = false;
        document.getElementById('creativeLoading').style.display = 'none';
    }
}

// ============================================================
// RENDERIZAÇÃO — VÍDEO
// ============================================================
function renderVideoResults(data) {
    const container = document.getElementById('creativeResults');
    let html = `
        <div class="results-header">
            <h3>🎬 Criativos de Vídeo — ${data.produto}</h3>
            <p>${data.total_variacoes} variações | ${data.total_palavras_base} palavras analisadas | Tom: ${data.tom_voz}</p>
        </div>
    `;

    data.resultados.forEach((r, idx) => {
        const roteiro = r.roteiro || {};
        const hook = roteiro.hook || {};
        const corpo = roteiro.corpo || [];
        const cta = roteiro.cta || {};
        const storyboard = r.storyboard || [];

        html += `
        <div class="result-card">
            <div class="result-header">
                <h4>Variação #${r.variacao} — ${escapeHtml(r.framework)}</h4>
                <span class="badge">${escapeHtml(r.framework_descricao || '')}</span>
            </div>
            <p class="angle"><strong>Ângulo:</strong> ${escapeHtml(r.angulo_criativo || '')}</p>
            <p class="duration">⏱ Duração estimada: ${escapeHtml(r.duracao_total_estimada || '30s')}</p>
            
            <!-- ROTEIRO -->
            <div class="script-section">
                <div class="script-block hook-block">
                    <div class="block-label">🎣 HOOK</div>
                    <div class="block-text">${escapeHtml(hook.texto || '')}</div>
                    <div class="block-visual">🎥 ${escapeHtml(hook.instrucao_visual || '')}</div>
                    <div class="block-time">${escapeHtml(hook.duracao_estimada || '')}</div>
                </div>

                ${corpo.map((c, i) => `
                <div class="script-block body-block">
                    <div class="block-label">📝 CORPO ${i + 1}</div>
                    <div class="block-text">${escapeHtml(c.texto || '')}</div>
                    <div class="block-visual">🎥 ${escapeHtml(c.instrucao_visual || '')}</div>
                    <div class="block-time">${escapeHtml(c.duracao_estimada || '')}</div>
                </div>
                `).join('')}

                <div class="script-block cta-block">
                    <div class="block-label">🎯 CTA</div>
                    <div class="block-text">${escapeHtml(cta.texto || '')}</div>
                    <div class="block-visual">🎥 ${escapeHtml(cta.instrucao_visual || '')}</div>
                    <div class="block-time">${escapeHtml(cta.duracao_estimada || '')}</div>
                </div>
            </div>

            <!-- GATILHOS -->
            ${r.gatilhos_usados && r.gatilhos_usados.length > 0 ? `
            <div class="triggers-row">
                <strong>Gatilhos:</strong> ${r.gatilhos_usados.map(g => `<span class="trigger-badge">${escapeHtml(g)}</span>`).join(' ')}
            </div>
            ` : ''}

            <!-- STORYBOARD -->
            ${storyboard.length > 0 ? `
            <div class="storyboard-section">
                <h5>📋 Storyboard + Prompts</h5>
                ${storyboard.map(s => `
                <div class="storyboard-scene">
                    <div class="scene-header">${escapeHtml(s.cena)}</div>
                    <div class="scene-visual">${escapeHtml(s.descricao_visual || '')}</div>
                    <div class="prompt-group">
                        <div class="prompt-item">
                            <strong>🖼️ Nano Banana (imagem):</strong>
                            <div class="prompt-text">${escapeHtml(s.prompt_nano_banana || '')}</div>
                            <button class="btn-copy" onclick="copyText(this, '${escapeForAttr(s.prompt_nano_banana || '')}')">📋 Copiar</button>
                        </div>
                        <div class="prompt-item">
                            <strong>🎬 Veo 3 (vídeo):</strong>
                            <div class="prompt-text">${escapeHtml(s.prompt_veo3 || '')}</div>
                            <button class="btn-copy" onclick="copyText(this, '${escapeForAttr(s.prompt_veo3 || '')}')">📋 Copiar</button>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- BOTÃO COPIAR TUDO -->
            <button class="btn-copy-all" onclick="copyFullScript(${idx}, 'video')">📋 Copiar Roteiro Completo</button>
        </div>
        `;
    });

    container.innerHTML = html;

    // Armazenar dados para cópia
    window._lastVideoResults = data.resultados;
}

// ============================================================
// RENDERIZAÇÃO — IMAGEM
// ============================================================
function renderImageResults(data) {
    const container = document.getElementById('creativeResults');
    let html = `
        <div class="results-header">
            <h3>🖼️ Criativos de Imagem — ${data.produto}</h3>
            <p>${data.total_variacoes} variações | ${data.total_palavras_base} palavras analisadas | Tom: ${data.tom_voz}</p>
        </div>
    `;

    data.resultados.forEach((r, idx) => {
        const copy = r.copy || {};
        const formatos = r.formatos || {};

        html += `
        <div class="result-card">
            <div class="result-header">
                <h4>Variação #${r.variacao} — Ângulo: ${escapeHtml(r.angulo || '')}</h4>
            </div>
            <p class="concept"><strong>Conceito:</strong> ${escapeHtml(r.conceito_visual || '')}</p>

            <!-- COPY -->
            <div class="copy-section">
                <div class="copy-headline">${escapeHtml(copy.headline || '')}</div>
                <div class="copy-subheadline">${escapeHtml(copy.sub_headline || '')}</div>
                <div class="copy-cta">${escapeHtml(copy.cta_texto || '')}</div>
                ${copy.texto_apoio ? `<div class="copy-support">${escapeHtml(copy.texto_apoio)}</div>` : ''}
            </div>

            <!-- FORMATOS -->
            ${Object.entries(formatos).map(([format, fdata]) => `
            <div class="format-section">
                <h5>${format === 'feed' ? '📐 Feed (1:1)' : format === 'story' ? '📱 Story (9:16)' : '🖥️ Banner (16:9)'}</h5>
                <p class="format-layout">${escapeHtml(fdata.descricao_layout || '')}</p>
                <div class="prompt-item">
                    <strong>🖼️ Nano Banana:</strong>
                    <div class="prompt-text">${escapeHtml(fdata.prompt_nano_banana || '')}</div>
                    <button class="btn-copy" onclick="copyText(this, '${escapeForAttr(fdata.prompt_nano_banana || '')}')">📋 Copiar</button>
                </div>
            </div>
            `).join('')}

            <!-- GATILHOS -->
            ${r.gatilhos_usados && r.gatilhos_usados.length > 0 ? `
            <div class="triggers-row">
                <strong>Gatilhos:</strong> ${r.gatilhos_usados.map(g => `<span class="trigger-badge">${escapeHtml(g)}</span>`).join(' ')}
            </div>
            ` : ''}

            <button class="btn-copy-all" onclick="copyFullScript(${idx}, 'image')">📋 Copiar Tudo</button>
        </div>
        `;
    });

    container.innerHTML = html;
    window._lastImageResults = data.resultados;
}

// ============================================================
// ABA 2: EDITOR
// ============================================================
async function uploadEditorFiles() {
    if (STATE.editorFiles.length === 0) return;

    const formData = new FormData();
    STATE.editorFiles.forEach(f => formData.append('files', f));

    document.getElementById('btnUploadEditor').disabled = true;
    document.getElementById('editorLoading').style.display = 'block';

    try {
        const res = await fetch(`${CONFIG.API_BASE}/api/v2/editor/upload`, {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();

        if (data.status === 'success') {
            STATE.editorSessionId = data.session_id;
            document.getElementById('btnGenerateEditor').disabled = false;

            // Mostrar pares
            const pairList = document.getElementById('editorPairList');
            if (data.pairs.length > 0) {
                pairList.innerHTML = '<h4>✅ Pares detectados:</h4>' +
                    data.pairs.map(p => `
                        <div class="pair-item">
                            <span>🎬 ${escapeHtml(p.video)} ↔ 📄 ${escapeHtml(p.srt)}</span>
                            <span class="pair-segments">${p.segments} segmentos</span>
                        </div>
                    `).join('');
            }
            if (data.rejected.length > 0) {
                pairList.innerHTML += '<h4>⚠️ Rejeitados:</h4>' +
                    data.rejected.map(r => `
                        <div class="pair-item rejected">
                            <span>❌ ${escapeHtml(r.filename)}: ${escapeHtml(r.reason)}</span>
                        </div>
                    `).join('');
            }

            showToast(`Upload concluído: ${data.pairs.length} par(es) válido(s)`, 'success');
        }
    } catch (err) {
        showToast(`Erro no upload: ${err.message}`, 'error');
    } finally {
        document.getElementById('btnUploadEditor').disabled = false;
        document.getElementById('editorLoading').style.display = 'none';
    }
}

async function generateEditorCuts() {
    if (!STATE.editorSessionId) {
        showToast('Faça upload dos arquivos primeiro', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('session_id', STATE.editorSessionId);
    formData.append('target_duration', STATE.editorDuration);
    formData.append('variations', STATE.editorVariations);
    formData.append('mode', STATE.editorMode);

    document.getElementById('btnGenerateEditor').disabled = true;
    document.getElementById('editorLoading').style.display = 'block';
    document.getElementById('editorResults').innerHTML = '';

    try {
        const res = await fetch(`${CONFIG.API_BASE}/api/v2/editor/generate`, {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();

        if (data.status === 'success') {
            renderEditorResults(data);
            showToast(`${data.total_results} resultado(s) gerado(s)!`, 'success');
        }
    } catch (err) {
        showToast(`Erro: ${err.message}`, 'error');
    } finally {
        document.getElementById('btnGenerateEditor').disabled = false;
        document.getElementById('editorLoading').style.display = 'none';
    }
}

function renderEditorResults(data) {
    const container = document.getElementById('editorResults');
    let html = `<div class="results-header"><h3>✂️ Resultados do Editor</h3></div>`;

    data.results.forEach(r => {
        html += `
        <div class="result-card">
            <div class="result-header">
                <h4>${r.source_video ? '🎬 ' + escapeHtml(r.source_video) : '🎬 Mix Multi-Vídeo'} — Variação #${r.variation}</h4>
                ${r.download_url ? `<a href="${CONFIG.API_BASE}
                ${r.download_url}" class="btn-download" target="_blank">⬇️ Download MP4</a>` : ''}
            </div>
            ${r.error ? `<div class="error-inline">⚠️ ${escapeHtml(r.error)}</div>` : ''}
            <p>⏱ Duração: ${r.total_duration ? r.total_duration.toFixed(1) + 's' : 'N/A'} | Segmentos: ${r.segment_count || 'N/A'}</p>
            
            <div class="structure-breakdown">
                ${(r.structure || []).map(s => `
                <div class="segment-item segment-${s.role ? s.role.toLowerCase() : 'body'}">
                    <div class="segment-role">${s.role === 'HOOK' ? '🎣' : s.role === 'CTA' ? '🎯' : '📝'} ${escapeHtml(s.role || 'BODY')}</div>
                    <div class="segment-text">${escapeHtml(s.text || '')}</div>
                    <div class="segment-meta">
                        ${s.source_video ? `📁 ${escapeHtml(s.source_video)} | ` : ''}
                        ${s.start !== undefined ? `${s.start.toFixed(1)}s → ${s.end.toFixed(1)}s | ` : ''}
                        Score: ${s.score || 0}
                        ${s.triggers && s.triggers.length > 0 ? ' | ' + s.triggers.map(t => `<span class="trigger-badge-sm">${escapeHtml(t)}</span>`).join(' ') : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function escapeForAttr(str) {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

function copyText(btn, text) {
    const decoded = text.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    navigator.clipboard.writeText(decoded).then(() => {
        const original = btn.textContent;
        btn.textContent = '✅ Copiado!';
        setTimeout(() => { btn.textContent = original; }, 2000);
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = decoded;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const original = btn.textContent;
        btn.textContent = '✅ Copiado!';
        setTimeout(() => { btn.textContent = original; }, 2000);
    });
}

function copyFullScript(index, type) {
    let text = '';
    
    if (type === 'video' && window._lastVideoResults) {
        const r = window._lastVideoResults[index];
        if (!r) return;
        const roteiro = r.roteiro || {};
        text = `=== VARIAÇÃO #${r.variacao} — ${r.framework} ===\n`;
        text += `Ângulo: ${r.angulo_criativo || ''}\n`;
        text += `Duração: ${r.duracao_total_estimada || ''}\n\n`;
        
        if (roteiro.hook) {
            text += `🎣 HOOK:\n${roteiro.hook.texto || ''}\n`;
            text += `Visual: ${roteiro.hook.instrucao_visual || ''}\n\n`;
        }
        (roteiro.corpo || []).forEach((c, i) => {
            text += `📝 CORPO ${i + 1}:\n${c.texto || ''}\n`;
            text += `Visual: ${c.instrucao_visual || ''}\n\n`;
        });
        if (roteiro.cta) {
            text += `🎯 CTA:\n${roteiro.cta.texto || ''}\n`;
            text += `Visual: ${roteiro.cta.instrucao_visual || ''}\n\n`;
        }
        if (r.gatilhos_usados) {
            text += `Gatilhos: ${r.gatilhos_usados.join(', ')}\n\n`;
        }
        (r.storyboard || []).forEach(s => {
            text += `--- ${s.cena} ---\n`;
            text += `Nano Banana: ${s.prompt_nano_banana || ''}\n`;
            text += `Veo 3: ${s.prompt_veo3 || ''}\n\n`;
        });
    } else if (type === 'image' && window._lastImageResults) {
        const r = window._lastImageResults[index];
        if (!r) return;
        const copy = r.copy || {};
        text = `=== VARIAÇÃO #${r.variacao} — ${r.angulo} ===\n`;
        text += `Conceito: ${r.conceito_visual || ''}\n\n`;
        text += `HEADLINE: ${copy.headline || ''}\n`;
        text += `SUB-HEADLINE: ${copy.sub_headline || ''}\n`;
        text += `CTA: ${copy.cta_texto || ''}\n`;
        if (copy.texto_apoio) text += `APOIO: ${copy.texto_apoio}\n`;
        text += '\n';
        
        Object.entries(r.formatos || {}).forEach(([format, fdata]) => {
            text += `--- ${format.toUpperCase()} ---\n`;
            text += `Layout: ${fdata.descricao_layout || ''}\n`;
            text += `Nano Banana: ${fdata.prompt_nano_banana || ''}\n\n`;
        });
        if (r.gatilhos_usados) {
            text += `Gatilhos: ${r.gatilhos_usados.join(', ')}\n`;
        }
    }

    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Roteiro completo copiado!', 'success');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('Roteiro completo copiado!', 'success');
        });
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-fade');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
