/**
 * HALLEY CRIATIVOS STUDIO — Frontend v8.1
 * Diretor Criativo híbrido, Correção iterativa, Prompts Nano Banana/Veo3 com avaliação
 * FIX v8.1: botão Corrigir funcional, correctBtnId definido, dados via window[], sem <script> inline
 */

const API_BASE = "https://wanderhalleylee-criativo-studio-backend.hf.space";

// ==============================================================
// STATE
// ==============================================================
let editorSessionId = null;
let editorOutputId = null;
let subtitleEnabled = "sem_legenda";
let subtitleStyle = "branca";

// ==============================================================
// TABS
// ==============================================================
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// ==============================================================
// FILE HANDLING
// ==============================================================
function handleDrop(e, inputId) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const input = document.getElementById(inputId);
    input.files = e.dataTransfer.files;
    const listId = inputId === 'fileInput1' ? 'fileList1' : 'fileList2';
    updateFileList(inputId, listId);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.upload-zone').forEach(zone => {
        zone.addEventListener('click', () => {
            const input = zone.querySelector('input[type="file"]');
            if (input) input.click();
        });
    });
});

function updateFileList(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    if (!input.files.length) {
        list.innerHTML = '';
        return;
    }
    let html = '<div class="file-items">';
    for (const f of input.files) {
        const ext = f.name.split('.').pop().toLowerCase();
        const icon = ext === 'srt' ? '📝' : ext === 'txt' ? '📄' : '🎬';
        const size = (f.size / 1024 / 1024).toFixed(2);
        html += `<div class="file-item"><span>${icon} ${f.name}</span><span class="file-size">${size} MB</span></div>`;
    }
    html += '</div>';
    list.innerHTML = html;

    if (inputId === 'fileInput2') {
        document.getElementById('btnUpload2').style.display = 'inline-flex';
    }
}

// ==============================================================
// SUBTITLE CONTROLS
// ==============================================================
function setSubtitle(btn) {
    btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    subtitleEnabled = btn.dataset.value;
    document.getElementById('subtitleStyles').style.display = subtitleEnabled === 'com_legenda' ? 'block' : 'none';
}

function setSubtitleStyle(btn) {
    btn.parentElement.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    subtitleStyle = btn.dataset.style;
}

// ==============================================================
// UTILITIES
// ==============================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.innerText || el.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = el.closest('.prompt-block')?.querySelector('.btn-copy');
        if (btn) {
            const orig = btn.textContent;
            btn.textContent = '✅ Copiado!';
            setTimeout(() => { btn.textContent = orig; }, 2000);
        }
    });
}

function showError(containerId, message) {
    document.getElementById(containerId).innerHTML = `<div class="error-msg">${escapeHtml(message)}</div>`;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

// ==============================================================
// ABA 1 — GERAR CRIATIVOS
// ==============================================================
async function generateCreative() {
    const files = document.getElementById('fileInput1').files;
    const produto = document.getElementById('produto1').value.trim();
    const publico = document.getElementById('publico1').value.trim();
    const tom = document.getElementById('tom1').value.trim() || 'profissional';
    const tipo = document.getElementById('tipo1').value;
    const variacoes = document.getElementById('variacoes1').value;

    if (!files.length) return showError('results1', 'Envie pelo menos um arquivo .srt ou .txt');
    if (!produto) return showError('results1', 'Preencha o nome do produto');
    if (!publico) return showError('results1', 'Preencha o público-alvo');

    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    formData.append('tipo', tipo);
    formData.append('variacoes', variacoes);
    formData.append('produto', produto);
    formData.append('publico_alvo', publico);
    formData.append('tom_voz', tom);

    document.getElementById('loading1').style.display = 'flex';
    document.getElementById('btnGenerate1').disabled = true;
    document.getElementById('results1').innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/v1/creative/generate`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro na geração');

        renderCreativeResults(data, tipo);
    } catch (err) {
        showError('results1', `Erro: ${err.message}`);
    } finally {
        document.getElementById('loading1').style.display = 'none';
        document.getElementById('btnGenerate1').disabled = false;
    }
}

function renderCreativeResults(data, tipo) {
    const container = document.getElementById('results1');
    const results = data.resultados || [];

    if (!results.length) {
        container.innerHTML = '<div class="error-msg">Nenhum resultado gerado</div>';
        return;
    }

    let html = `<div class="results-header">
        <h3>✅ ${results.length} criativo(s) gerado(s)</h3>
        <p>Produto: <strong>${escapeHtml(data.produto)}</strong> | Público: <strong>${escapeHtml(data.publico_alvo)}</strong> | Palavras-base: ${data.total_palavras_base}</p>
    </div>`;

    results.forEach((r, idx) => {
        const varId = `creative_${idx}`;
        html += `<div class="result-card" id="${varId}">`;
        html += `<div class="result-header">`;
        html += `<h4>Variação ${r.variacao || idx + 1}</h4>`;
        if (r.framework) html += `<span class="badge badge-framework">${escapeHtml(r.framework)}</span>`;
        if (r.angulo_criativo || r.angulo) html += `<span class="badge badge-angle">${escapeHtml(r.angulo_criativo || r.angulo)}</span>`;
        if (r._fallback) html += `<span class="badge badge-fallback">Fallback</span>`;
        html += `</div>`;

        if (tipo === 'video') {
            html += renderVideoCreative(r);
        } else {
            html += renderImageCreative(r);
        }

        // Prompts Nano Banana e Veo 3
        html += renderPromptSection(r, idx, data.produto);

        // Avaliação do Diretor
        if (r.avaliacao_diretor) {
            html += renderDirectorEvaluation(r.avaliacao_diretor, varId, idx, data.produto, data.publico_alvo, tipo);
        }

        html += `</div>`;
    });

    container.innerHTML = html;

    // FIX v8.1: Guardar dados para correção iterativa DEPOIS de inserir HTML
    results.forEach((r, idx) => {
        window['creativeData_' + idx] = r;
        window['evalData_' + idx] = r.avaliacao_diretor;
    });
}

function renderVideoCreative(r) {
    const roteiro = r.roteiro || {};
    let html = '<div class="creative-content">';

    if (roteiro.hook) {
        html += `<div class="segment segment-hook">
            <div class="segment-label">🎯 HOOK (${escapeHtml(roteiro.hook.duracao || '3-5s')})</div>
            <div class="segment-text">${escapeHtml(roteiro.hook.texto || '')}</div>
            ${roteiro.hook.visual ? `<div class="segment-visual">🎥 ${escapeHtml(roteiro.hook.visual)}</div>` : ''}
        </div>`;
    }

    if (roteiro.corpo && roteiro.corpo.length) {
        roteiro.corpo.forEach((c, i) => {
            html += `<div class="segment segment-body">
                <div class="segment-label">📝 CORPO ${i + 1} (${escapeHtml(c.duracao || '5-8s')})</div>
                <div class="segment-text">${escapeHtml(c.texto || '')}</div>
                ${c.visual ? `<div class="segment-visual">🎥 ${escapeHtml(c.visual)}</div>` : ''}
            </div>`;
        });
    }

    if (roteiro.cta) {
        html += `<div class="segment segment-cta">
            <div class="segment-label">🔥 CTA (${escapeHtml(roteiro.cta.duracao || '3-5s')})</div>
            <div class="segment-text">${escapeHtml(roteiro.cta.texto || '')}</div>
            ${roteiro.cta.visual ? `<div class="segment-visual">🎥 ${escapeHtml(roteiro.cta.visual)}</div>` : ''}
        </div>`;
    }

    html += '</div>';
    return html;
}

function renderImageCreative(r) {
    const copy = r.copy || {};
    let html = `<div class="creative-content">
        <div class="image-copy-block">
            ${r.formato ? `<div class="format-badge">${escapeHtml(r.formato)} (${escapeHtml(r.ratio || '')})</div>` : ''}
            <div class="copy-headline">${escapeHtml(copy.headline || '')}</div>
            <div class="copy-sub">${escapeHtml(copy.sub_headline || '')}</div>
            <div class="copy-cta-text">${escapeHtml(copy.cta_texto || '')}</div>
            ${copy.texto_apoio ? `<div class="copy-support">${escapeHtml(copy.texto_apoio)}</div>` : ''}
        </div>
        ${r.conceito_visual ? `<div class="concept-visual">🎨 Conceito: ${escapeHtml(r.conceito_visual)}</div>` : ''}
    </div>`;
    return html;
}

function renderPromptSection(r, idx, produto) {
    let html = '<div class="prompts-section">';
    html += '<h5 class="prompts-title">🎨 Produção Visual — Prompts para Copiar</h5>';

    // Nano Banana (Imagem)
    if (r.prompt_nano_banana) {
        const promptImgId = `prompt_img_${idx}`;
        html += `<div class="prompt-block" id="${promptImgId}">
            <div class="prompt-header">
                <span class="prompt-label">🖼️ Prompt Nano Banana (Imagem)</span>
                <button class="btn-copy" onclick="copyToClipboard('${promptImgId}_text')">📋 Copiar</button>
            </div>
            <div class="prompt-text" id="${promptImgId}_text">${escapeHtml(r.prompt_nano_banana)}</div>`;

        if (r.avaliacao_prompt_imagem) {
            html += renderPromptEvaluation(r.avaliacao_prompt_imagem, promptImgId, r.prompt_nano_banana, 'image', produto, idx);
        }
        html += `</div>`;
    }

    // Veo 3 (Vídeo)
    if (r.prompt_veo3) {
        const promptVidId = `prompt_vid_${idx}`;
        html += `<div class="prompt-block" id="${promptVidId}">
            <div class="prompt-header">
                <span class="prompt-label">🎬 Prompt Veo 3 (Vídeo)</span>
                <button class="btn-copy" onclick="copyToClipboard('${promptVidId}_text')">📋 Copiar</button>
            </div>
            <div class="prompt-text" id="${promptVidId}_text">${escapeHtml(r.prompt_veo3)}</div>`;

        if (r.avaliacao_prompt_video) {
            html += renderPromptEvaluation(r.avaliacao_prompt_video, promptVidId, r.prompt_veo3, 'video', produto, idx);
        }
        html += `</div>`;
    }

    html += '</div>';
    return html;
}

function renderPromptEvaluation(evaluation, blockId, promptText, tipoPrompt, produto, idx) {
    if (!evaluation || !evaluation.nota_geral) return '';

    const nota = evaluation.nota_geral || 0;
    const criterios = evaluation.criterios || {};
    const veredito = evaluation.veredito || '';
    const melhorias = evaluation.melhorias || [];

    let barColor = nota >= 80 ? '#10b981' : nota >= 60 ? '#f59e0b' : '#ef4444';

    let html = `<div class="prompt-evaluation">
        <div class="eval-header">
            <span class="eval-label">Diretor de Produção</span>
            <span class="eval-score" style="color:${barColor}">${nota}/100</span>
        </div>
        <div class="eval-bar"><div class="eval-bar-fill" style="width:${nota}%;background:${barColor}"></div></div>`;

    if (veredito) {
        html += `<div class="eval-veredito">${escapeHtml(veredito)}</div>`;
    }

    const criterioLabels = {
        "precisao_tecnica": "Precisão Técnica",
        "visual_storytelling": "Visual Storytelling",
        "coerencia_marca": "Coerência Marca",
        "valor_producao": "Valor de Produção",
    };

    html += '<div class="eval-criterios">';
    for (const [key, label] of Object.entries(criterioLabels)) {
        const val = criterios[key] || 0;
        let cColor = val >= 80 ? '#10b981' : val >= 60 ? '#f59e0b' : '#ef4444';
        html += `<div class="eval-criterio">
            <span class="criterio-name">${label}</span>
            <div class="criterio-bar"><div class="criterio-bar-fill" style="width:${val}%;background:${cColor}"></div></div>
            <span class="criterio-val">${val}</span>
        </div>`;
    }
    html += '</div>';

    if (melhorias.length) {
        html += '<div class="eval-melhorias"><strong>Melhorias:</strong><ul>';
        melhorias.forEach(m => { html += `<li>${escapeHtml(m)}</li>`; });
        html += '</ul></div>';
    }

    // Botão corrigir prompt
    const correctPromptBtnId = `correctPromptBtn_${tipoPrompt}_${idx}`;
    html += `<button class="btn-correct-prompt" id="${correctPromptBtnId}" onclick="correctPrompt(${idx}, '${tipoPrompt}', decodeURIComponent('${encodeURIComponent(produto)}'))">🔄 Corrigir Prompt</button>`;

    html += '</div>';
    return html;
}

// FIX v8.1: Sem <script> inline, dados via window[]
function renderDirectorEvaluation(evaluation, varId, idx, produto, publico, tipo) {
    if (!evaluation || !evaluation.nota_geral) return '';

    const nota = evaluation.nota_geral || 0;
    const criterios = evaluation.criterios || {};
    const veredito = evaluation.veredito || '';
    const melhorias = evaluation.melhorias || [];
    const avaliador = evaluation.avaliado_por || '';

    let barColor = nota >= 80 ? '#10b981' : nota >= 60 ? '#f59e0b' : '#ef4444';

    let html = `<div class="director-evaluation">
        <div class="director-header">
            <h5>🎬 Diretor Criativo ${avaliador ? `(${escapeHtml(avaliador)})` : ''}</h5>
            <span class="director-score" style="color:${barColor}">${nota}/100</span>
        </div>
        <div class="eval-bar"><div class="eval-bar-fill" style="width:${nota}%;background:${barColor}"></div></div>`;

    if (veredito) {
        html += `<div class="eval-veredito">${escapeHtml(veredito)}</div>`;
    }

    const criterioLabels = {
        "hook_power": "Hook Power",
        "especificidade": "Especificidade",
        "coerencia": "Coerência",
        "corpo_persuasivo": "Corpo Persuasivo",
        "cta_clarity": "CTA Clarity",
        "originalidade": "Originalidade",
    };

    html += '<div class="eval-criterios">';
    for (const [key, label] of Object.entries(criterioLabels)) {
        const val = criterios[key] || 0;
        let cColor = val >= 80 ? '#10b981' : val >= 60 ? '#f59e0b' : '#ef4444';
        html += `<div class="eval-criterio">
            <span class="criterio-name">${label}</span>
            <div class="criterio-bar"><div class="criterio-bar-fill" style="width:${val}%;background:${cColor}"></div></div>
            <span class="criterio-val">${val}</span>
        </div>`;
    }
    html += '</div>';

    if (melhorias.length) {
        html += '<div class="eval-melhorias"><strong>Melhorias sugeridas:</strong><ul>';
        melhorias.forEach(m => { html += `<li>${escapeHtml(m)}</li>`; });
        html += '</ul></div>';
    }

    // FIX v8.1: Botão corrigir criativo — dados vêm de window[], não de inline script
    const correctBtnId = `correctBtn_${idx}`;
    html += `<button class="btn-correct" id="${correctBtnId}" onclick="correctCreative(${idx}, decodeURIComponent('${encodeURIComponent(produto)}'), decodeURIComponent('${encodeURIComponent(publico)}'), '${tipo}')">🔄 Corrigir com base no feedback do Diretor</button>`;

    html += '</div>';
    return html;
}

// ==============================================================
// ABA 1 — CORREÇÃO ITERATIVA DE CRIATIVOS
// ==============================================================
async function correctCreative(idx, produto, publico, tipo) {
    const creativeData = window['creativeData_' + idx];
    const evalData = window['evalData_' + idx];

    if (!creativeData || !evalData) {
        console.error('Dados não encontrados para correção idx=' + idx, creativeData, evalData);
        alert('Erro: dados de correção não encontrados. Gere os criativos novamente.');
        return;
    }

    const btn = document.getElementById(`correctBtn_${idx}`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Corrigindo...';
    }

    try {
        const formData = new FormData();
        formData.append('creative_data', JSON.stringify(creativeData));
        formData.append('evaluation_data', JSON.stringify(evalData));
        formData.append('produto', produto);
        formData.append('publico_alvo', publico);
        formData.append('tipo', tipo);

        const res = await fetch(`${API_BASE}/api/v1/creative/correct`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro na correção');

        // Atualizar dados
        const corrected = data.creative_corrigido;
        corrected.avaliacao_diretor = data.avaliacao_diretor;
        if (data.avaliacao_prompt_imagem) corrected.avaliacao_prompt_imagem = data.avaliacao_prompt_imagem;
        if (data.avaliacao_prompt_video) corrected.avaliacao_prompt_video = data.avaliacao_prompt_video;

        // Atualizar window
        window['creativeData_' + idx] = corrected;
        window['evalData_' + idx] = data.avaliacao_diretor;

        // Re-renderizar card
        const card = document.getElementById(`creative_${idx}`);
        if (card) {
            let html = `<div class="result-header">`;
            html += `<h4>Variação ${corrected.variacao || idx + 1} <span class="badge badge-corrected">✅ Corrigido</span></h4>`;
            if (corrected.framework) html += `<span class="badge badge-framework">${escapeHtml(corrected.framework)}</span>`;
            if (corrected.angulo_criativo || corrected.angulo) html += `<span class="badge badge-angle">${escapeHtml(corrected.angulo_criativo || corrected.angulo)}</span>`;
            html += `</div>`;

            if (tipo === 'video') {
                html += renderVideoCreative(corrected);
            } else {
                html += renderImageCreative(corrected);
            }

            html += renderPromptSection(corrected, idx, produto);

            if (corrected.avaliacao_diretor) {
                html += renderDirectorEvaluation(corrected.avaliacao_diretor, `creative_${idx}`, idx, produto, publico || '', tipo);
            }

            card.innerHTML = html;
        }

    } catch (err) {
        console.error('Erro correção:', err);
        alert(`Erro na correção: ${err.message}`);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔄 Corrigir com base no feedback do Diretor';
        }
    }
}

// ==============================================================
// ABA 1 — CORREÇÃO ITERATIVA DE PROMPTS
// ==============================================================
async function correctPrompt(idx, tipoPrompt, produto) {
    const creativeData = window['creativeData_' + idx];
    if (!creativeData) {
        alert('Erro: dados não encontrados. Gere os criativos novamente.');
        return;
    }

    const promptKey = tipoPrompt === 'image' ? 'prompt_nano_banana' : 'prompt_veo3';
    const evalKey = tipoPrompt === 'image' ? 'avaliacao_prompt_imagem' : 'avaliacao_prompt_video';
    const promptText = creativeData[promptKey];
    const evalData = creativeData[evalKey];

    if (!promptText || !evalData) {
        alert('Prompt ou avaliação não encontrados.');
        return;
    }

    const btnId = `correctPromptBtn_${tipoPrompt}_${idx}`;
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Corrigindo prompt...';
    }

    try {
        const formData = new FormData();
        formData.append('prompt_text', promptText);
        formData.append('evaluation_data', JSON.stringify(evalData));
        formData.append('tipo_prompt', tipoPrompt);
        formData.append('produto', produto);

        const res = await fetch(`${API_BASE}/api/v1/prompt/correct`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro na correção');

        // Atualizar dados
        creativeData[promptKey] = data.prompt_corrigido;
        creativeData[evalKey] = data.avaliacao;
        window['creativeData_' + idx] = creativeData;

        // Atualizar texto do prompt na tela
        const textElId = tipoPrompt === 'image' ? `prompt_img_${idx}_text` : `prompt_vid_${idx}_text`;
        const textEl = document.getElementById(textElId);
        if (textEl) {
            textEl.textContent = data.prompt_corrigido;
        }

        // Re-renderizar avaliação do prompt
        const blockId = tipoPrompt === 'image' ? `prompt_img_${idx}` : `prompt_vid_${idx}`;
        const block = document.getElementById(blockId);
        if (block) {
            // Remover avaliação antiga
            const oldEval = block.querySelector('.prompt-evaluation');
            if (oldEval) oldEval.remove();
            // Adicionar nova
            const evalHtml = renderPromptEvaluation(data.avaliacao, blockId, data.prompt_corrigido, tipoPrompt, produto, idx);
            block.insertAdjacentHTML('beforeend', evalHtml);
        }

        if (btn) btn.textContent = '✅ Prompt corrigido!';
        setTimeout(() => {
            if (btn) {
                btn.textContent = '🔄 Corrigir Prompt';
                btn.disabled = false;
            }
        }, 3000);

    } catch (err) {
        console.error('Erro correção prompt:', err);
        alert(`Erro: ${err.message}`);
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔄 Corrigir Prompt';
        }
    }
}

// ==============================================================
// ABA 2 — UPLOAD
// ==============================================================
async function uploadEditorFiles() {
    const files = document.getElementById('fileInput2').files;
    if (!files.length) {
        document.getElementById('uploadStatus2').innerHTML = '<div class="error-msg">Selecione pelo menos um arquivo</div>';
        return;
    }

    const formData = new FormData();
    for (const f of files) formData.append('files', f);

    document.getElementById('uploadStatus2').innerHTML = '<div class="loading-inline">📤 Enviando arquivos...</div>';
    document.getElementById('btnUpload2').disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/v2/editor/upload`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro no upload');

        editorSessionId = data.session_id;

        let html = '<div class="upload-success">';
        html += `<div class="success-header">✅ Upload concluído — Sessão: <code>${data.session_id.substring(0, 8)}...</code></div>`;

        if (data.pairs && data.pairs.length) {
            html += '<div class="pairs-list">';
            data.pairs.forEach(p => {
                html += `<div class="pair-item">
                    <span>🎬 ${escapeHtml(p.video)}</span>
                    <span>${p.srt ? '📝 ' + escapeHtml(p.srt) + ' (' + p.segments + ' segs)' : '⚠️ Sem SRT'}</span>
                </div>`;
            });
            html += '</div>';
        }

        if (data.rejected && data.rejected.length) {
            html += '<div class="rejected-files">⚠️ Rejeitados: ';
            html += data.rejected.map(r => escapeHtml(r.filename)).join(', ');
            html += '</div>';
        }

        html += '</div>';
        document.getElementById('uploadStatus2').innerHTML = html;
        document.getElementById('btnGenerate2').style.display = 'inline-flex';

    } catch (err) {
        document.getElementById('uploadStatus2').innerHTML = `<div class="error-msg">Erro: ${escapeHtml(err.message)}</div>`;
    } finally {
        document.getElementById('btnUpload2').disabled = false;
    }
}

// ==============================================================
// ABA 2 — GERAR CORTES INTELIGENTES
// ==============================================================
async function generateEditorCuts() {
    if (!editorSessionId) {
        showError('results2', 'Faça upload dos arquivos primeiro');
        return;
    }

    const duration = document.getElementById('duration2').value;
    const variations = document.getElementById('variations2').value;
    const mode = document.getElementById('mode2').value;
    const produto = (document.getElementById('produto2').value || '').trim();
    const publico = (document.getElementById('publico2').value || '').trim();

    const formData = new FormData();
    formData.append('session_id', editorSessionId);
    formData.append('target_duration', duration);
    formData.append('variations', variations);
    formData.append('mode', mode);
    formData.append('subtitle_enabled', subtitleEnabled);
    formData.append('subtitle_style', subtitleStyle);
    formData.append('produto', produto);
    formData.append('publico_alvo', publico);

    document.getElementById('loading2').style.display = 'flex';
    document.getElementById('btnGenerate2').disabled = true;
    document.getElementById('results2').innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/v2/editor/generate`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro na geração');

        editorOutputId = data.output_id;
        renderEditorResults(data, produto, publico);

    } catch (err) {
        showError('results2', `Erro: ${err.message}`);
    } finally {
        document.getElementById('loading2').style.display = 'none';
        document.getElementById('btnGenerate2').disabled = false;
    }
}

function renderEditorResults(data, produto, publico) {
    const container = document.getElementById('results2');
    const results = data.results || [];

    if (!results.length) {
        container.innerHTML = '<div class="error-msg">Nenhum resultado gerado</div>';
        return;
    }

    let html = `<div class="results-header">
        <h3>✅ ${results.length} corte(s) gerado(s)</h3>
        <p>Sessão: <code>${(data.session_id || '').substring(0, 8)}...</code> | Output: <code>${(data.output_id || '').substring(0, 8)}...</code></p>
    </div>`;

    results.forEach((r, idx) => {
        const resultId = `editor_result_${idx}`;
        html += `<div class="result-card" id="${resultId}">`;
        html += `<div class="result-header">`;
        html += `<h4>🎬 ${escapeHtml(r.source_video)} — Variação ${r.variation || idx + 1}</h4>`;
        if (r.planned_by) html += `<span class="badge badge-${r.planned_by === 'ia' ? 'ia' : 'fallback'}">${r.planned_by === 'ia' ? '🤖 IA' : '📐 Regras'}</span>`;
        html += `</div>`;

        if (r.error) {
            html += `<div class="error-msg">⚠️ ${escapeHtml(r.error)}</div>`;
        }

        // Estrutura dos cortes
        if (r.structure && r.structure.length) {
            html += '<div class="cuts-structure">';
            r.structure.forEach(s => {
                const roleClass = (s.role || 'BODY').toLowerCase();
                html += `<div class="cut-segment cut-${roleClass}">
                    <span class="cut-role">${escapeHtml(s.role || 'BODY')}</span>
                    <span class="cut-time">${(s.start || 0).toFixed(1)}s - ${(s.end || 0).toFixed(1)}s</span>
                    <span class="cut-text">${escapeHtml((s.text || '').substring(0, 100))}</span>
                </div>`;
            });
            html += '</div>';
        }

        // Info
        if (r.total_duration) {
            html += `<div class="cut-info">
                <span>⏱️ ${r.total_duration}s</span>
                <span>✂️ ${r.segment_count || 0} cortes</span>
                ${r.subtitle_style && r.subtitle_style !== 'sem_legenda' ? `<span>📝 Legenda: ${escapeHtml(r.subtitle_style)}</span>` : ''}
            </div>`;
        }

        if (r.ai_reasoning) {
            html += `<div class="ai-reasoning">💡 ${escapeHtml(r.ai_reasoning)}</div>`;
        }

        // Download
        if (r.download_url && r.filename) {
            html += `<div class="download-section">
                <a href="${API_BASE}${r.download_url}" class="btn-download" download="${escapeHtml(r.filename)}">
                    ⬇️ Download ${escapeHtml(r.filename)} ${r.file_size ? '(' + formatFileSize(r.file_size) + ')' : ''}
                </a>
            </div>`;
        }

        // Avaliação do Diretor (Aba 2)
        if (r.avaliacao_diretor) {
            html += renderEditorDirectorEvaluation(r.avaliacao_diretor, idx, r, produto, publico);
        }

        html += `</div>`;
    });

    container.innerHTML = html;

    // FIX v8.1: Guardar dados para correção de cortes
    results.forEach((r, idx) => {
        window['editorResult_' + idx] = r;
        window['editorEval_' + idx] = r.avaliacao_diretor;
    });
}

// FIX v8.1: correctBtnId declarado, sem <script> inline
function renderEditorDirectorEvaluation(evaluation, idx, resultData, produto, publico) {
    if (!evaluation || !evaluation.nota_geral) return '';

    const nota = evaluation.nota_geral || 0;
    const criterios = evaluation.criterios || {};
    const veredito = evaluation.veredito || '';
    const melhorias = evaluation.melhorias || [];

    let barColor = nota >= 80 ? '#10b981' : nota >= 60 ? '#f59e0b' : '#ef4444';

    let html = `<div class="director-evaluation">
        <div class="director-header">
            <h5>🎬 Diretor Criativo — Cortes</h5>
            <span class="director-score" style="color:${barColor}">${nota}/100</span>
        </div>
        <div class="eval-bar"><div class="eval-bar-fill" style="width:${nota}%;background:${barColor}"></div></div>`;

    if (veredito) {
        html += `<div class="eval-veredito">${escapeHtml(veredito)}</div>`;
    }

    const criterioLabels = {
        "hook_power": "Hook Power",
        "fluxo_narrativo": "Fluxo Narrativo",
        "ritmo": "Ritmo",
        "impacto_cta": "Impacto CTA",
        "coerencia": "Coerência",
        "engajamento": "Engajamento",
    };

    html += '<div class="eval-criterios">';
    for (const [key, label] of Object.entries(criterioLabels)) {
        const val = criterios[key] || 0;
        let cColor = val >= 80 ? '#10b981' : val >= 60 ? '#f59e0b' : '#ef4444';
        html += `<div class="eval-criterio">
            <span class="criterio-name">${label}</span>
            <div class="criterio-bar"><div class="criterio-bar-fill" style="width:${val}%;background:${cColor}"></div></div>
            <span class="criterio-val">${val}</span>
        </div>`;
    }
    html += '</div>';

    if (melhorias.length) {
        html += '<div class="eval-melhorias"><strong>Melhorias:</strong><ul>';
        melhorias.forEach(m => { html += `<li>${escapeHtml(m)}</li>`; });
        html += '</ul></div>';
    }

    // FIX v8.1: correctBtnId declarado corretamente
    const correctBtnId = `correctCutBtn_${idx}`;
    html += `<button class="btn-correct" id="${correctBtnId}" onclick="correctEditorCuts(${idx}, decodeURIComponent('${encodeURIComponent(produto || '')}'), decodeURIComponent('${encodeURIComponent(publico || '')}'))">🔄 Corrigir cortes com base no feedback</button>`;

    html += '</div>';
    return html;
}

// ==============================================================
// ABA 2 — CORREÇÃO ITERATIVA DE CORTES
// ==============================================================
async function correctEditorCuts(idx, produto, publico) {
    const resultData = window['editorResult_' + idx];
    const evalData = window['editorEval_' + idx];

    if (!resultData || !evalData) {
        alert('Erro: dados de correção não encontrados. Gere os cortes novamente.');
        return;
    }

    if (!editorSessionId) {
        alert('Sessão não encontrada. Faça upload novamente.');
        return;
    }

    const btn = document.getElementById(`correctCutBtn_${idx}`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Corrigindo cortes...';
    }

    try {
        const formData = new FormData();
        formData.append('session_id', editorSessionId);
        formData.append('output_id', editorOutputId || '');
        formData.append('source_video', resultData.source_video || '');
        formData.append('structure_data', JSON.stringify(resultData.structure || []));
        formData.append('evaluation_data', JSON.stringify(evalData));
        formData.append('segments_data', resultData._segments_json || '[]');
        formData.append('target_duration', document.getElementById('duration2').value || '30');
        formData.append('produto', produto);
        formData.append('publico_alvo', publico);
        formData.append('subtitle_enabled', subtitleEnabled);
        formData.append('subtitle_style', subtitleStyle);

        const res = await fetch(`${API_BASE}/api/v2/editor/correct`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro na correção');

        // Atualizar dados
        window['editorResult_' + idx] = data;
        window['editorEval_' + idx] = data.avaliacao_diretor;

        // Re-renderizar card
        const card = document.getElementById(`editor_result_${idx}`);
        if (card) {
            let html = `<div class="result-header">
                <h4>🎬 ${escapeHtml(resultData.source_video)} — Corrigido <span class="badge badge-corrected">✅</span></h4>
            </div>`;

            if (data.error) {
                html += `<div class="error-msg">⚠️ ${escapeHtml(data.error)}</div>`;
            }

            if (data.structure && data.structure.length) {
                html += '<div class="cuts-structure">';
                data.structure.forEach(s => {
                    const roleClass = (s.role || 'BODY').toLowerCase();
                    html += `<div class="cut-segment cut-${roleClass}">
                        <span class="cut-role">${escapeHtml(s.role || 'BODY')}</span>
                        <span class="cut-time">${(s.start || 0).toFixed(1)}s - ${(s.end || 0).toFixed(1)}s</span>
                        <span class="cut-text">${escapeHtml((s.text || '').substring(0, 100))}</span>
                    </div>`;
                });
                html += '</div>';
            }

            if (data.total_duration) {
                html += `<div class="cut-info">
                    <span>⏱️ ${data.total_duration}s</span>
                    <span>✂️ ${data.segment_count || 0} cortes</span>
                </div>`;
            }

            if (data.download_url && data.filename) {
                html += `<div class="download-section">
                    <a href="${API_BASE}${data.download_url}" class="btn-download" download="${escapeHtml(data.filename)}">
                        ⬇️ Download ${escapeHtml(data.filename)} ${data.file_size ? '(' + formatFileSize(data.file_size) + ')' : ''}
                    </a>
                </div>`;
            }

            if (data.avaliacao_diretor) {
                html += renderEditorDirectorEvaluation(data.avaliacao_diretor, idx, data, produto, publico);
            }

            card.innerHTML = html;
        }

        // Atualizar output_id se mudou
        if (data._output_id) {
            editorOutputId = data._output_id;
        }

    } catch (err) {
        console.error('Erro correção cortes:', err);
        alert(`Erro: ${err.message}`);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔄 Corrigir cortes com base no feedback';
        }
    }
}
