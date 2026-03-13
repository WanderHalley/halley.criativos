/**
 * HALLEY CRIATIVOS STUDIO — Frontend v8.0
 * Diretor Criativo híbrido, Correção iterativa, Prompts Nano Banana/Veo3 com avaliação
 */

const API_BASE = "https://wanderhalleylee-criativo-studio-backend.hf.space";

// ============================================================
// STATE
// ============================================================
let editorSessionId = null;
let editorOutputId = null;
let subtitleEnabled = "sem_legenda";
let subtitleStyle = "branca";

// ============================================================
// TABS
// ============================================================
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// ============================================================
// FILE HANDLING
// ============================================================
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

// ============================================================
// SUBTITLE CONTROLS
// ============================================================
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

// ============================================================
// ABA 1 — GERAR CRIATIVOS
// ============================================================
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
        <p>Produto: <strong>${data.produto}</strong> | Público: <strong>${data.publico_alvo}</strong> | Palavras-base: ${data.total_palavras_base}</p>
    </div>`;

    results.forEach((r, idx) => {
        const varId = `creative_${idx}`;
        html += `<div class="result-card" id="${varId}">`;
        html += `<div class="result-header">`;
        html += `<h4>Variação ${r.variacao || idx + 1}</h4>`;
        if (r.framework) html += `<span class="badge badge-framework">${r.framework}</span>`;
        if (r.angulo_criativo || r.angulo) html += `<span class="badge badge-angle">${r.angulo_criativo || r.angulo}</span>`;
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
            html += renderDirectorEvaluation(r.avaliacao_diretor, varId, idx, data.produto, data.publico_alvo, tipo, r);
        }

        html += `</div>`;
    });

    container.innerHTML = html;

    // Guardar dados para correção iterativa
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
            <div class="segment-label">🎯 HOOK (${roteiro.hook.duracao || '3-5s'})</div>
            <div class="segment-text">${roteiro.hook.texto || ''}</div>
            ${roteiro.hook.visual ? `<div class="segment-visual">🎥 ${roteiro.hook.visual}</div>` : ''}
        </div>`;
    }

    if (roteiro.corpo && roteiro.corpo.length) {
        roteiro.corpo.forEach((c, i) => {
            html += `<div class="segment segment-body">
                <div class="segment-label">📝 CORPO ${i + 1} (${c.duracao || '5-8s'})</div>
                <div class="segment-text">${c.texto || ''}</div>
                ${c.visual ? `<div class="segment-visual">🎥 ${c.visual}</div>` : ''}
            </div>`;
        });
    }

    if (roteiro.cta) {
        html += `<div class="segment segment-cta">
            <div class="segment-label">🔥 CTA (${roteiro.cta.duracao || '3-5s'})</div>
            <div class="segment-text">${roteiro.cta.texto || ''}</div>
            ${roteiro.cta.visual ? `<div class="segment-visual">🎥 ${roteiro.cta.visual}</div>` : ''}
        </div>`;
    }

    html += '</div>';
    return html;
}

function renderImageCreative(r) {
    const copy = r.copy || {};
    let html = `<div class="creative-content">
        <div class="image-copy-block">
            ${r.formato ? `<div class="format-badge">${r.formato} (${r.ratio || ''})</div>` : ''}
            <div class="copy-headline">${copy.headline || ''}</div>
            <div class="copy-sub">${copy.sub_headline || ''}</div>
            <div class="copy-cta-text">${copy.cta_texto || ''}</div>
            ${copy.texto_apoio ? `<div class="copy-support">${copy.texto_apoio}</div>` : ''}
        </div>
        ${r.conceito_visual ? `<div class="concept-visual">🎨 Conceito: ${r.conceito_visual}</div>` : ''}
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
    const nota = evaluation.nota_geral || 0;
    const colorClass = nota >= 80 ? 'rating-high' : nota >= 60 ? 'rating-mid' : 'rating-low';
    const criterios = evaluation.criterios || {};

    let html = `<div class="prompt-evaluation">
        <div class="eval-mini-header">
            <span class="eval-mini-badge ${colorClass}">${nota}%</span>
            <span class="eval-mini-label">Avaliação do Diretor de Produção</span>
        </div>
        <div class="eval-mini-bars">`;

    const criterioLabels = {
        "precisao_tecnica": "Precisão Técnica",
        "visual_storytelling": "Visual Storytelling",
        "coerencia_marca": "Coerência Marca",
        "valor_producao": "Valor de Produção",
    };

    for (const [key, label] of Object.entries(criterioLabels)) {
        const val = criterios[key] || 0;
        const barColor = val >= 80 ? '#10b981' : val >= 60 ? '#f59e0b' : '#ef4444';
        html += `<div class="eval-mini-bar-row">
            <span class="eval-mini-bar-label">${label}</span>
            <div class="eval-mini-bar-track"><div class="eval-mini-bar-fill" style="width:${val}%;background:${barColor}"></div></div>
            <span class="eval-mini-bar-val">${val}</span>
        </div>`;
    }

    html += `</div>`;

    if (evaluation.melhorias && evaluation.melhorias.length) {
        html += `<div class="eval-mini-tips">`;
        evaluation.melhorias.forEach(m => {
            if (m) html += `<div class="eval-mini-tip">💡 ${escapeHtml(m)}</div>`;
        });
        html += `</div>`;
    }

    // Botão Corrigir Prompt
    const correctBtnId = `correctPrompt_${tipoPrompt}_${idx}`;
    html += `<button class="btn-correct btn-correct-small" id="${correctBtnId}"
        onclick="correctPrompt('${blockId}', '${correctBtnId}', \`${escapeForAttr(promptText)}\`, '${tipoPrompt}', '${escapeForAttr(produto)}', ${idx})">
        🔄 Corrigir Prompt
    </button>`;

    html += `</div>`;
    return html;
}

function renderDirectorEvaluation(evaluation, parentId, idx, produto, publico, tipo, creativeData) {
    const nota = evaluation.nota_geral || 0;
    const colorClass = nota >= 80 ? 'rating-high' : nota >= 60 ? 'rating-mid' : 'rating-low';
    const criterios = evaluation.criterios || {};
    const avaliador = evaluation.avaliado_por || 'ia';

    let html = `<div class="director-evaluation" id="eval_${parentId}">
        <div class="eval-header">
            <div class="eval-title">
                <span class="eval-icon">🎬</span>
                <span>Diretor Criativo</span>
                <span class="eval-method">${avaliador === 'hibrido_regras_ia' ? '(Híbrido: Regras + IA)' : avaliador === 'regras' ? '(Regras)' : '(IA)'}</span>
            </div>
            <div class="eval-rating ${colorClass}">${nota}%</div>
        </div>
        <div class="eval-criteria">`;

    const criterioLabels = {
        "hook_power": "Hook Power",
        "especificidade": "Especificidade",
        "coerencia": "Coerência",
        "corpo_persuasivo": "Corpo Persuasivo",
        "cta_clarity": "CTA Clarity",
        "originalidade": "Originalidade",
    };

    for (const [key, label] of Object.entries(criterioLabels)) {
        const val = criterios[key] || 0;
        const barColor = val >= 80 ? '#10b981' : val >= 60 ? '#f59e0b' : '#ef4444';
        html += `<div class="eval-bar-row">
            <span class="eval-bar-label">${label}</span>
            <div class="eval-bar-track"><div class="eval-bar-fill" style="width:${val}%;background:${barColor}"></div></div>
            <span class="eval-bar-val">${val}</span>
        </div>`;
    }

    html += `</div>`;

    if (evaluation.veredito) {
        html += `<div class="eval-verdict">${escapeHtml(evaluation.veredito)}</div>`;
    }

    if (evaluation.melhorias && evaluation.melhorias.length) {
        html += `<div class="eval-improvements">`;
        evaluation.melhorias.forEach(m => {
            if (m) html += `<div class="eval-improvement">💡 ${escapeHtml(m)}</div>`;
        });
        html += `</div>`;
    }

    // Botão Corrigir
    const correctBtnId = `correctBtn_${idx}`;
    const creativeJson = JSON.stringify(creativeData);
    const evalJson = JSON.stringify(evaluation);
    html += `<button class="btn-correct" id="${correctBtnId}"
        onclick='correctCreative(${idx}, "${escapeForAttr(produto)}", "${escapeForAttr(publico)}", "${tipo}")'>
        🔄 Corrigir com base no feedback
    </button>`;
    html += `<div id="correctLoading_${idx}" class="correct-loading" style="display:none">
        <div class="spinner-small"></div> Corrigindo...
    </div>`;
    html += `<div id="correctHistory_${idx}" class="correct-history"></div>`;

    html += `</div>`;

    return html;
}

// ============================================================
// ABA 1 — CORREÇÃO ITERATIVA
// ============================================================
async function correctCreative(idx, produto, publico, tipo) {
    const creativeData = window['creativeData_' + idx];
    const evalData = window['evalData_' + idx];

    if (!creativeData || !evalData) {
        console.error('Dados não encontrados para correção idx=' + idx, creativeData, evalData);
        return;
    }

    const btnId = `correctBtn_${idx}`;
    const loadingId = `correctLoading_${idx}`;
    const historyId = `correctHistory_${idx}`;

    document.getElementById(btnId).disabled = true;
    document.getElementById(loadingId).style.display = 'flex';

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

        const corrected = data.creative_corrigido;
        const newEval = data.avaliacao_diretor;

        // Atualizar dados para próxima correção
        window[`creativeData_${idx}`] = corrected;
        window[`evalData_${idx}`] = newEval;

        // Adicionar ao histórico
        const historyDiv = document.getElementById(historyId);
        const version = historyDiv.children.length + 2;
        const oldNota = evalData.nota_geral || 0;
        const newNota = newEval.nota_geral || 0;
        const delta = newNota - oldNota;
        const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
        const deltaColor = delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#666';

        let versionHtml = `<div class="history-item">
            <div class="history-header">
                <span class="history-version">v${version}</span>
                <span class="history-score ${newNota >= 80 ? 'rating-high' : newNota >= 60 ? 'rating-mid' : 'rating-low'}">${newNota}%</span>
                <span class="history-delta" style="color:${deltaColor}">(${deltaStr})</span>
            </div>`;

        // Mostrar criativo corrigido resumido
        if (tipo === 'video' && corrected.roteiro) {
            const hook = corrected.roteiro.hook?.texto || '';
            const cta = corrected.roteiro.cta?.texto || '';
            versionHtml += `<div class="history-preview">
                <div><strong>Hook:</strong> ${escapeHtml(hook.substring(0, 100))}${hook.length > 100 ? '...' : ''}</div>
                <div><strong>CTA:</strong> ${escapeHtml(cta.substring(0, 100))}${cta.length > 100 ? '...' : ''}</div>
            </div>`;
        } else if (corrected.copy) {
            versionHtml += `<div class="history-preview">
                <div><strong>Headline:</strong> ${escapeHtml(corrected.copy.headline || '')}</div>
                <div><strong>CTA:</strong> ${escapeHtml(corrected.copy.cta_texto || '')}</div>
            </div>`;
        }

        // Prompts corrigidos
        if (corrected.prompt_nano_banana) {
            versionHtml += `<div class="history-prompt">
                <span class="prompt-label-small">🖼️ Nano Banana:</span>
                <span class="prompt-preview">${escapeHtml(corrected.prompt_nano_banana.substring(0, 120))}...</span>
                <button class="btn-copy-small" onclick="copyText(\`${escapeForAttr(corrected.prompt_nano_banana)}\`)">📋</button>
            </div>`;
        }
        if (corrected.prompt_veo3) {
            versionHtml += `<div class="history-prompt">
                <span class="prompt-label-small">🎬 Veo 3:</span>
                <span class="prompt-preview">${escapeHtml(corrected.prompt_veo3.substring(0, 120))}...</span>
                <button class="btn-copy-small" onclick="copyText(\`${escapeForAttr(corrected.prompt_veo3)}\`)">📋</button>
            </div>`;
        }

        if (newEval.veredito) {
            versionHtml += `<div class="history-verdict">${escapeHtml(newEval.veredito)}</div>`;
        }

        if (newEval.melhorias && newEval.melhorias.length) {
            newEval.melhorias.forEach(m => {
                if (m) versionHtml += `<div class="history-tip">💡 ${escapeHtml(m)}</div>`;
            });
        }

        versionHtml += `</div>`;
        historyDiv.innerHTML += versionHtml;

    } catch (err) {
        showError(`correctHistory_${idx}`, `Erro na correção: ${err.message}`);
    } finally {
        document.getElementById(btnId).disabled = false;
        document.getElementById(loadingId).style.display = 'none';
    }
}

async function correctPrompt(blockId, btnId, promptText, tipoPrompt, produto, idx) {
    const evalKey = tipoPrompt === 'image' ? 'avaliacao_prompt_imagem' : 'avaliacao_prompt_video';
    const creativeData = window[`creativeData_${idx}`];
    const evaluation = creativeData ? creativeData[evalKey] : null;

    if (!evaluation) return;

    const btn = document.getElementById(btnId);
    btn.disabled = true;
    btn.textContent = '⏳ Corrigindo...';

    try {
        const formData = new FormData();
        formData.append('prompt_text', promptText);
        formData.append('evaluation_data', JSON.stringify(evaluation));
        formData.append('tipo_prompt', tipoPrompt);
        formData.append('produto', produto);

        const res = await fetch(`${API_BASE}/api/v1/prompt/correct`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro');

        // Atualizar prompt no DOM
        const textId = blockId + '_text';
        const textEl = document.getElementById(textId);
        if (textEl) {
            textEl.textContent = data.prompt_corrigido;
        }

        // Atualizar avaliação no creativeData
        if (creativeData) {
            if (tipoPrompt === 'image') {
                creativeData.prompt_nano_banana = data.prompt_corrigido;
                creativeData.avaliacao_prompt_imagem = data.avaliacao;
            } else {
                creativeData.prompt_veo3 = data.prompt_corrigido;
                creativeData.avaliacao_prompt_video = data.avaliacao;
            }
            window[`creativeData_${idx}`] = creativeData;
        }

        btn.textContent = `✅ Corrigido (${data.avaliacao.nota_geral}%)`;
        setTimeout(() => { btn.textContent = '🔄 Corrigir Prompt'; btn.disabled = false; }, 3000);

    } catch (err) {
        btn.textContent = `❌ Erro`;
        setTimeout(() => { btn.textContent = '🔄 Corrigir Prompt'; btn.disabled = false; }, 3000);
    }
}

// ============================================================
// ABA 2 — UPLOAD
// ============================================================
async function uploadEditorFiles() {
    const files = document.getElementById('fileInput2').files;
    if (!files.length) return;

    const status = document.getElementById('uploadStatus2');
    status.innerHTML = '<div class="spinner-small"></div> Enviando...';

    const formData = new FormData();
    for (const f of files) formData.append('files', f);

    try {
        const res = await fetch(`${API_BASE}/api/v2/editor/upload`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro no upload');

        editorSessionId = data.session_id;

        let html = '<div class="pairs-list">';
        if (data.pairs && data.pairs.length) {
            data.pairs.forEach(p => {
                const srtInfo = p.srt ? `📝 ${p.srt} (${p.segments} segs)` : '⚠️ Sem SRT';
                html += `<div class="pair-item">
                    <span class="pair-video">🎬 ${p.video}</span>
                    <span class="pair-srt">${srtInfo}</span>
                    <span class="pair-preview">${p.text_preview || ''}</span>
                </div>`;
            });
        }
        if (data.rejected && data.rejected.length) {
            data.rejected.forEach(r => {
                html += `<div class="pair-item pair-rejected">❌ ${r.filename}: ${r.reason}</div>`;
            });
        }
        html += '</div>';
        status.innerHTML = html;

        document.getElementById('btnGenerate2').style.display = 'inline-flex';
    } catch (err) {
        status.innerHTML = `<div class="error-msg">Erro: ${err.message}</div>`;
    }
}

// ============================================================
// ABA 2 — GERAR CORTES
// ============================================================
async function generateEditorCuts() {
    if (!editorSessionId) return showError('results2', 'Envie os arquivos primeiro');

    const formData = new FormData();
    formData.append('session_id', editorSessionId);
    formData.append('target_duration', document.getElementById('duration2').value);
    formData.append('variations', document.getElementById('variations2').value);
    formData.append('mode', document.getElementById('mode2').value);
    formData.append('subtitle_enabled', subtitleEnabled);
    formData.append('subtitle_style', subtitleStyle);
    formData.append('produto', document.getElementById('produto2').value.trim());
    formData.append('publico_alvo', document.getElementById('publico2').value.trim());

    document.getElementById('loading2').style.display = 'flex';
    document.getElementById('btnGenerate2').disabled = true;
    document.getElementById('results2').innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}/api/v2/editor/generate`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro na geração');

        editorOutputId = data.output_id;
        renderEditorResults(data);
    } catch (err) {
        showError('results2', `Erro: ${err.message}`);
    } finally {
        document.getElementById('loading2').style.display = 'none';
        document.getElementById('btnGenerate2').disabled = false;
    }
}

function renderEditorResults(data) {
    const container = document.getElementById('results2');
    const results = data.results || [];

    if (!results.length) {
        container.innerHTML = '<div class="error-msg">Nenhum resultado gerado</div>';
        return;
    }

    let html = `<div class="results-header">
        <h3>✅ ${results.length} resultado(s)</h3>
    </div>`;

    results.forEach((r, idx) => {
        const cutId = `cut_${idx}`;
        html += `<div class="result-card" id="${cutId}">`;
        html += `<div class="result-header">
            <h4>🎬 ${r.source_video} — Variação ${r.variation || 1}</h4>`;

        if (r.planned_by) {
            const planBadge = r.planned_by === 'ia' ? 'badge-ia' : 'badge-fallback';
            html += `<span class="badge ${planBadge}">Planejado por: ${r.planned_by}</span>`;
        }
        html += `</div>`;

        if (r.error) {
            html += `<div class="error-msg">❌ ${r.error}</div>`;
        }

        // Estrutura de cortes
        if (r.structure && r.structure.length) {
            html += '<div class="cut-structure">';
            r.structure.forEach(s => {
                const roleClass = `segment-${(s.role || 'body').toLowerCase()}`;
                html += `<div class="segment ${roleClass}">
                    <div class="segment-label">${roleIcon(s.role)} ${s.role || 'BODY'} (${(s.start || 0).toFixed(1)}s - ${(s.end || 0).toFixed(1)}s)</div>
                    <div class="segment-text">${escapeHtml(s.text || '')}</div>
                </div>`;
            });
            html += '</div>';
        }

        // Info
        if (r.total_duration) {
            html += `<div class="cut-info">
                ⏱️ ${r.total_duration}s | 📊 ${r.segment_count || 0} segmentos
                ${r.subtitle_style && r.subtitle_style !== 'sem_legenda' ? ` | 📝 Legenda: ${r.subtitle_style}` : ''}
            </div>`;
        }

        // Download
        if (r.filename && r.download_url) {
            const cleanUrl = r.download_url.replace(/%20/g, '');
            const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : API_BASE + cleanUrl;
            html += `<div class="download-section">
                <a href="${fullUrl}" download="${r.filename}" class="btn-download" onclick="downloadFile(event, '${fullUrl}', '${r.filename}')">
                    ⬇️ Baixar ${r.filename} (${((r.file_size || 0) / 1024 / 1024).toFixed(2)} MB)
                </a>
            </div>`;
        }

        // Avaliação do Diretor (Aba 2)
        if (r.avaliacao_diretor) {
            html += renderEditorDirectorEvaluation(r.avaliacao_diretor, cutId, idx, r, data);
        }

        html += `</div>`;
    });

    container.innerHTML = html;

    // Guardar dados para correção
    results.forEach((r, idx) => {
        window[`editorResult_${idx}`] = r;
        window[`editorData_${idx}`] = data;
    });
}

function renderEditorDirectorEvaluation(evaluation, parentId, idx, resultData, fullData) {
    const nota = evaluation.nota_geral || 0;
    const colorClass = nota >= 80 ? 'rating-high' : nota >= 60 ? 'rating-mid' : 'rating-low';
    const criterios = evaluation.criterios || {};

    let html = `<div class="director-evaluation" id="editorEval_${idx}">
        <div class="eval-header">
            <div class="eval-title">
                <span class="eval-icon">🎬</span>
                <span>Diretor Criativo — Cortes</span>
            </div>
            <div class="eval-rating ${colorClass}">${nota}%</div>
        </div>
        <div class="eval-criteria">`;

    const criterioLabels = {
        "hook_power": "Hook Power",
        "fluxo_narrativo": "Fluxo Narrativo",
        "ritmo": "Ritmo",
        "impacto_cta": "Impacto CTA",
        "coerencia": "Coerência",
        "engajamento": "Engajamento",
    };

    for (const [key, label] of Object.entries(criterioLabels)) {
        const val = criterios[key] || 0;
        const barColor = val >= 80 ? '#10b981' : val >= 60 ? '#f59e0b' : '#ef4444';
        html += `<div class="eval-bar-row">
            <span class="eval-bar-label">${label}</span>
            <div class="eval-bar-track"><div class="eval-bar-fill" style="width:${val}%;background:${barColor}"></div></div>
            <span class="eval-bar-val">${val}</span>
        </div>`;
    }

    html += `</div>`;

    if (evaluation.veredito) {
        html += `<div class="eval-verdict">${escapeHtml(evaluation.veredito)}</div>`;
    }

    if (evaluation.melhorias && evaluation.melhorias.length) {
        html += `<div class="eval-improvements">`;
        evaluation.melhorias.forEach(m => {
            if (m) html += `<div class="eval-improvement">💡 ${escapeHtml(m)}</div>`;
        });
        html += `</div>`;
    }

    // Botão Corrigir Cortes
       html += `<button class="btn-correct" id="${correctBtnId}"
        onclick="correctCreative(${idx}, decodeURIComponent('${encodeURIComponent(produto)}'), decodeURIComponent('${encodeURIComponent(publico)}'), '${tipo}')">
        🔄 Corrigir com base no feedback
    </button>`;

    html += `<div id="correctCutLoading_${idx}" class="correct-loading" style="display:none">
        <div class="spinner-small"></div> Corrigindo e regenerando vídeo...
    </div>`;
    html += `<div id="correctCutHistory_${idx}" class="correct-history"></div>`;

    html += `</div>`;
    return html;
}

// ============================================================
// ABA 2 — CORREÇÃO ITERATIVA DE CORTES
// ============================================================
async function correctEditorCut(idx) {
    const resultData = window[`editorResult_${idx}`];
    const fullData = window[`editorData_${idx}`];
    if (!resultData || !fullData) return;

    const btnId = `correctCutBtn_${idx}`;
    const loadingId = `correctCutLoading_${idx}`;
    const historyId = `correctCutHistory_${idx}`;

    document.getElementById(btnId).disabled = true;
    document.getElementById(loadingId).style.display = 'flex';

    try {
        const formData = new FormData();
        formData.append('session_id', resultData._session_id || fullData.session_id);
        formData.append('output_id', resultData._output_id || fullData.output_id);
        formData.append('source_video', resultData.source_video);
        formData.append('structure_data', JSON.stringify(resultData.structure || []));
        formData.append('evaluation_data', JSON.stringify(resultData.avaliacao_diretor || {}));
        formData.append('segments_data', resultData._segments_json || '[]');
        formData.append('target_duration', document.getElementById('duration2').value);
        formData.append('produto', document.getElementById('produto2').value.trim());
        formData.append('publico_alvo', document.getElementById('publico2').value.trim());
        formData.append('subtitle_enabled', subtitleEnabled);
        formData.append('subtitle_style', subtitleStyle);

        const res = await fetch(`${API_BASE}/api/v2/editor/correct`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Erro');

        // Atualizar dados para próxima correção
        const newResult = {
            ...resultData,
            structure: data.structure,
            avaliacao_diretor: data.avaliacao_diretor,
            _session_id: data._session_id || resultData._session_id,
            _output_id: data._output_id || resultData._output_id,
            _segments_json: data._segments_json || resultData._segments_json,
        };
        if (data.filename) {
            newResult.filename = data.filename;
            newResult.download_url = data.download_url;
            newResult.file_size = data.file_size;
        }
        window[`editorResult_${idx}`] = newResult;

        // Adicionar ao histórico
        const historyDiv = document.getElementById(historyId);
        const version = historyDiv.children.length + 2;
        const oldNota = resultData.avaliacao_diretor?.nota_geral || 0;
        const newNota = data.avaliacao_diretor?.nota_geral || 0;
        const delta = newNota - oldNota;
        const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
        const deltaColor = delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#666';

        let vHtml = `<div class="history-item">
            <div class="history-header">
                <span class="history-version">v${version}</span>
                <span class="history-score ${newNota >= 80 ? 'rating-high' : newNota >= 60 ? 'rating-mid' : 'rating-low'}">${newNota}%</span>
                <span class="history-delta" style="color:${deltaColor}">(${deltaStr})</span>
            </div>`;

        // Download do vídeo corrigido
        if (data.download_url) {
            const cleanUrl = data.download_url.replace(/%20/g, '');
            const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : API_BASE + cleanUrl;
            vHtml += `<div class="download-section">
                <a href="${fullUrl}" download="${data.filename}" class="btn-download" onclick="downloadFile(event, '${fullUrl}', '${data.filename}')">
                    ⬇️ Baixar corrigido (${((data.file_size || 0) / 1024 / 1024).toFixed(2)} MB)
                </a>
            </div>`;
        }

        if (data.avaliacao_diretor?.veredito) {
            vHtml += `<div class="history-verdict">${escapeHtml(data.avaliacao_diretor.veredito)}</div>`;
        }

        if (data.avaliacao_diretor?.melhorias) {
            data.avaliacao_diretor.melhorias.forEach(m => {
                if (m) vHtml += `<div class="history-tip">💡 ${escapeHtml(m)}</div>`;
            });
        }

        vHtml += `</div>`;
        historyDiv.innerHTML += vHtml;

    } catch (err) {
        const historyDiv = document.getElementById(historyId);
        historyDiv.innerHTML += `<div class="error-msg">❌ Erro: ${err.message}</div>`;
    } finally {
        document.getElementById(btnId).disabled = false;
        document.getElementById(loadingId).style.display = 'none';
    }
}

// ============================================================
// DOWNLOAD HELPER
// ============================================================
function downloadFile(event, url, filename) {
    event.preventDefault();
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
}

// ============================================================
// UTILITIES
// ============================================================
function showError(containerId, msg) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="error-msg">${msg}</div>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeForAttr(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function roleIcon(role) {
    const icons = { HOOK: '🎯', BODY: '📝', CTA: '🔥', FULL: '📹' };
    return icons[(role || '').toUpperCase()] || '📎';
}

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.textContent || el.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = el.parentElement?.querySelector('.btn-copy') || el.closest('.prompt-block')?.querySelector('.btn-copy');
        if (btn) {
            const orig = btn.textContent;
            btn.textContent = '✅ Copiado!';
            setTimeout(() => btn.textContent = orig, 2000);
        }
    });
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {}).catch(() => {});
}
