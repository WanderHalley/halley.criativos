/* ============================================================
   HALLEY CRIATIVOS STUDIO — Frontend v7.0
   Melhorias: Rating Diretor Criativo, legendas, pareamento flexível
   ============================================================ */

const CONFIG = {
    API_BASE: 'https://wanderhalleylee-criativo-studio-backend.hf.space',
    MAX_FILE_SIZE: 500 * 1024 * 1024,
};

const STATE = {
    // Aba 1
    creativeFiles: [],
    tipo: 'video',
    variacoes: 3,
    // Aba 2
    editorFiles: [],
    editorSessionId: null,
    editorPairs: [],
    editorDuration: 30,
    editorVariations: 1,
    editorMode: 'individual',
    subtitleEnabled: 'sem_legenda',
    subtitleStyle: 'branca',
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    setupUploadZone('creativeUploadZone', 'creativeFiles', handleCreativeFiles);
    setupUploadZone('editorUploadZone', 'editorFiles', handleEditorFiles);
});

function checkHealth() {
    const dot = document.getElementById('statusDot');
    fetch(CONFIG.API_BASE + '/')
        .then(r => r.json())
        .then(d => {
            dot.className = 'status-dot online';
            dot.title = 'Backend online v' + (d.version || '?');
        })
        .catch(() => {
            dot.className = 'status-dot offline';
            dot.title = 'Backend offline';
        });
}

/* ============================================================
   TABS
   ============================================================ */
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

/* ============================================================
   UPLOAD ZONES
   ============================================================ */
function setupUploadZone(zoneId, inputId, handler) {
    var zone = document.getElementById(zoneId);
    var input = document.getElementById(inputId);
    if (!zone || !input) return;

    zone.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () { handler(Array.from(input.files)); });

    zone.addEventListener('dragover', function (e) {
        e.preventDefault();
        zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', function () {
        zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', function (e) {
        e.preventDefault();
        zone.classList.remove('dragover');
        handler(Array.from(e.dataTransfer.files));
    });
}

function handleCreativeFiles(files) {
    var valid = files.filter(function (f) {
        return f.name.match(/\.(srt|txt)$/i) && f.size <= CONFIG.MAX_FILE_SIZE;
    });
    STATE.creativeFiles = valid;
    renderFileList('creativeFileList', valid);
}

function handleEditorFiles(files) {
    var valid = files.filter(function (f) {
        return f.name.match(/\.(mp4|mov|avi|mkv|webm|srt)$/i) && f.size <= CONFIG.MAX_FILE_SIZE;
    });
    STATE.editorFiles = valid;
    renderFileList('editorFileList', valid);
}

function renderFileList(containerId, files) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (files.length === 0) {
        container.innerHTML = '';
        return;
    }
    var html = '';
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var size = (f.size / 1024).toFixed(1);
        var icon = f.name.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? '🎬' : '📄';
        html += '<div class="file-item">' + icon + ' ' + escapeHtml(f.name) + ' (' + size + ' KB)</div>';
    }
    container.innerHTML = html;
}

/* ============================================================
   ABA 1 — CONTROLES
   ============================================================ */
function setTipo(t) {
    STATE.tipo = t;
    document.querySelectorAll('#tab-creative .config-item:first-child .toggle-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.value === t);
    });
    var hint = document.getElementById('tipoHint');
    if (t === 'video') {
        hint.innerHTML = '<strong>Modo Vídeo:</strong> Gera roteiros completos (Hook → Corpo → CTA) + Storyboard + Avaliação do Diretor Criativo';
    } else {
        hint.innerHTML = '<strong>Modo Imagem:</strong> Gera copies para Feed, Story e Banner + Prompts Nano Banana Pro + Avaliação do Diretor Criativo';
    }
}

function stepVariacoes(delta) {
    STATE.variacoes = Math.max(1, Math.min(10, STATE.variacoes + delta));
    document.getElementById('variacoesDisplay').textContent = STATE.variacoes;
}

/* ============================================================
   ABA 2 — CONTROLES
   ============================================================ */
function stepDuration(delta) {
    STATE.editorDuration = Math.max(5, Math.min(120, STATE.editorDuration + delta));
    document.getElementById('durationDisplay').textContent = STATE.editorDuration;
}

function stepEditorVar(delta) {
    STATE.editorVariations = Math.max(1, Math.min(5, STATE.editorVariations + delta));
    document.getElementById('editorVarDisplay').textContent = STATE.editorVariations;
}

function setEditorMode(mode) {
    STATE.editorMode = mode;
    document.querySelectorAll('#tab-editor .config-row:first-of-type .config-item:last-child .toggle-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.value === mode);
    });
}

function setSubtitle(value) {
    STATE.subtitleEnabled = value;
    // Toggle botões
    var btns = document.querySelectorAll('#tab-editor .step-container:nth-child(4) .config-item:first-child .toggle-btn');
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.value === value); });

    // Mostrar/ocultar estilos
    var stylesContainer = document.getElementById('subtitleStylesContainer');
    var hint = document.getElementById('subtitleHint');
    if (value === 'com_legenda') {
        stylesContainer.style.display = 'block';
        hint.innerHTML = '<strong>Com legenda:</strong> O texto do SRT será sobreposto no vídeo final no estilo escolhido.';
    } else {
        stylesContainer.style.display = 'none';
        hint.innerHTML = 'Sem legenda: vídeo limpo, sem texto sobreposto.';
    }
}

function setSubtitleStyle(style) {
    STATE.subtitleStyle = style;
    document.querySelectorAll('.subtitle-style-group .toggle-btn').forEach(function (b) {
        b.classList.toggle('active', b.dataset.value === style);
    });

    var descs = {
        branca: '<strong>Branca Clássica:</strong> Texto branco com sombra, posição inferior. Estilo profissional/clean.',
        amarela: '<strong>Amarela Destaque:</strong> Texto amarelo com outline preto. Chamativo, ótimo para ads.',
        tiktok: '<strong>TikTok Palavra por Palavra:</strong> Cada palavra aparece destacada no centro. Estilo viral.'
    };
    document.getElementById('subtitleHint').innerHTML = descs[style] || '';
}

/* ============================================================
   ABA 1 — GERAR CRIATIVOS
   ============================================================ */
function generateCreatives() {
    if (STATE.creativeFiles.length === 0) {
        showToast('Envie pelo menos 1 arquivo .srt ou .txt', 'error');
        return;
    }
    var produto = document.getElementById('produto').value.trim();
    var publico = document.getElementById('publicoAlvo').value.trim();
    if (!produto || !publico) {
        showToast('Preencha Produto e Público-Alvo', 'error');
        return;
    }

    var btn = document.getElementById('btnGenerate');
    btn.disabled = true;
    btn.innerHTML = '⏳ Gerando criativos + avaliação do Diretor Criativo...';

    var fd = new FormData();
    for (var i = 0; i < STATE.creativeFiles.length; i++) {
        fd.append('files', STATE.creativeFiles[i]);
    }
    fd.append('tipo', STATE.tipo);
    fd.append('variacoes', STATE.variacoes);
    fd.append('produto', produto);
    fd.append('publico_alvo', publico);
    fd.append('tom_voz', document.getElementById('tomVoz').value);

    fetch(CONFIG.API_BASE + '/api/v1/creative/generate', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            btn.disabled = false;
            btn.innerHTML = '🚀 Gerar Criativos com Avaliação';
            if (data.status === 'success') {
                renderCreativeResults(data);
                showToast('Criativos gerados com sucesso!', 'success');
            } else {
                showToast('Erro: ' + (data.detail || 'falha'), 'error');
            }
        })
        .catch(function (e) {
            btn.disabled = false;
            btn.innerHTML = '🚀 Gerar Criativos com Avaliação';
            showToast('Erro de conexão: ' + e.message, 'error');
        });
}

/* ============================================================
   ABA 1 — RENDERIZAR RESULTADOS
   ============================================================ */
function renderCreativeResults(data) {
    var container = document.getElementById('creativeResults');
    var results = data.resultados || [];
    if (results.length === 0) {
        container.innerHTML = '<p class="empty">Nenhum resultado gerado.</p>';
        return;
    }

    var html = '<h3>Resultados (' + results.length + ' variações)</h3>';
    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        if (data.tipo === 'video') {
            html += renderVideoCreative(r);
        } else {
            html += renderImageCreative(r);
        }
    }
    container.innerHTML = html;
}

function renderVideoCreative(r) {
    var roteiro = r.roteiro || {};
    var hook = roteiro.hook || {};
    var corpo = roteiro.corpo || [];
    var cta = roteiro.cta || {};
    var eval_data = r.avaliacao_diretor || null;

    var html = '<div class="result-card">';
    html += '<div class="card-header">';
    html += '<div class="card-title">🎬 Variação #' + r.variacao + ' — ' + escapeHtml(r.framework || '') + '</div>';
    if (eval_data) {
        html += renderRatingBadge(eval_data.nota_geral);
    }
    html += '</div>';
    html += '<div class="card-meta">';
    html += '<span>Framework: ' + escapeHtml(r.framework_descricao || '') + '</span>';
    html += '<span>Ângulo: ' + escapeHtml(r.angulo_criativo || '') + '</span>';
    html += '<span>Duração: ' + escapeHtml(r.duracao_total_estimada || '') + '</span>';
    html += '</div>';

    // Roteiro
    html += '<div class="script-block">';
    html += '<div class="script-section hook-section"><div class="section-label">🎯 HOOK</div>';
    html += '<div class="section-text">' + escapeHtml(hook.texto || '') + '</div>';
    if (hook.instrucao_visual) html += '<div class="section-visual">📷 ' + escapeHtml(hook.instrucao_visual) + '</div>';
    html += '<div class="section-duration">⏱️ ' + escapeHtml(hook.duracao || '') + '</div></div>';

    for (var j = 0; j < corpo.length; j++) {
        var c = corpo[j];
        html += '<div class="script-section body-section"><div class="section-label">📝 CORPO ' + (j + 1) + '</div>';
        html += '<div class="section-text">' + escapeHtml(c.texto || '') + '</div>';
        if (c.instrucao_visual) html += '<div class="section-visual">📷 ' + escapeHtml(c.instrucao_visual) + '</div>';
        html += '<div class="section-duration">⏱️ ' + escapeHtml(c.duracao || '') + '</div></div>';
    }

    html += '<div class="script-section cta-section"><div class="section-label">🔥 CTA</div>';
    html += '<div class="section-text">' + escapeHtml(cta.texto || '') + '</div>';
    if (cta.instrucao_visual) html += '<div class="section-visual">📷 ' + escapeHtml(cta.instrucao_visual) + '</div>';
    html += '<div class="section-duration">⏱️ ' + escapeHtml(cta.duracao || '') + '</div></div>';
    html += '</div>';

    // Gatilhos
    var gatilhos = r.gatilhos_usados || [];
    if (gatilhos.length > 0) {
        html += '<div class="triggers">';
        for (var g = 0; g < gatilhos.length; g++) {
            html += '<span class="trigger-badge">' + escapeHtml(gatilhos[g]) + '</span>';
        }
        html += '</div>';
    }

    // Avaliação do Diretor Criativo
    if (eval_data) {
        html += renderDirectorEvaluation(eval_data);
    }

    // Storyboard
    var storyboard = r.storyboard || [];
    if (storyboard.length > 0) {
        html += '<details class="storyboard-details"><summary>🎨 Storyboard + Prompts (' + storyboard.length + ' cenas)</summary>';
        html += '<div class="storyboard">';
        for (var s = 0; s < storyboard.length; s++) {
            var scene = storyboard[s];
            html += '<div class="storyboard-scene">';
            html += '<div class="scene-header">' + escapeHtml(scene.cena) + ' — ' + escapeHtml(scene.duracao || '') + '</div>';
            html += '<div class="scene-text">' + escapeHtml(scene.texto_narrado || '') + '</div>';
            html += '<div class="scene-visual">' + escapeHtml(scene.descricao_visual || '') + '</div>';
            if (scene.prompt_nano_banana) {
                html += '<div class="prompt-block"><strong>🍌 Nano Banana:</strong><pre>' + escapeHtml(scene.prompt_nano_banana) + '</pre>';
                html += '<button class="btn-copy" onclick="copyText(this, \'' + escapeForAttr(scene.prompt_nano_banana) + '\')">📋 Copiar</button></div>';
            }
            if (scene.prompt_veo3) {
                html += '<div class="prompt-block"><strong>🎥 Veo 3:</strong><pre>' + escapeHtml(scene.prompt_veo3) + '</pre>';
                html += '<button class="btn-copy" onclick="copyText(this, \'' + escapeForAttr(scene.prompt_veo3) + '\')">📋 Copiar</button></div>';
            }
            html += '</div>';
        }
        html += '</div></details>';
    }

    // Botão copiar roteiro
    html += '<div class="card-actions">';
    html += '<button class="btn-secondary" onclick="copyFullScript(' + r.variacao + ', \'video\')">📋 Copiar Roteiro Completo</button>';
    html += '</div>';

    html += '</div>';
    return html;
}

function renderImageCreative(r) {
    var copy = r.copy || {};
    var formatos = r.formatos || {};
    var eval_data = r.avaliacao_diretor || null;

    var html = '<div class="result-card">';
    html += '<div class="card-header">';
    html += '<div class="card-title">🖼️ Variação #' + r.variacao + ' — Ângulo: ' + escapeHtml(r.angulo || '') + '</div>';
    if (eval_data) {
        html += renderRatingBadge(eval_data.nota_geral);
    }
    html += '</div>';

    html += '<div class="copy-block">';
    html += '<div class="copy-headline">' + escapeHtml(copy.headline || '') + '</div>';
    html += '<div class="copy-sub">' + escapeHtml(copy.sub_headline || '') + '</div>';
    html += '<div class="copy-cta">' + escapeHtml(copy.cta_texto || '') + '</div>';
    if (copy.texto_apoio) html += '<div class="copy-support">' + escapeHtml(copy.texto_apoio) + '</div>';
    html += '</div>';

    // Gatilhos
    var gatilhos = r.gatilhos_usados || [];
    if (gatilhos.length > 0) {
        html += '<div class="triggers">';
        for (var g = 0; g < gatilhos.length; g++) {
            html += '<span class="trigger-badge">' + escapeHtml(gatilhos[g]) + '</span>';
        }
        html += '</div>';
    }

    // Avaliação do Diretor Criativo
    if (eval_data) {
        html += renderDirectorEvaluation(eval_data);
    }

    // Formatos
    var fmtNames = { feed: 'Feed 1:1', story: 'Story 9:16', banner: 'Banner 16:9' };
    var fmtKeys = ['feed', 'story', 'banner'];
    html += '<details class="storyboard-details"><summary>🎨 Formatos + Prompts Nano Banana</summary>';
    for (var fi = 0; fi < fmtKeys.length; fi++) {
        var fk = fmtKeys[fi];
        var fmt = formatos[fk] || {};
        html += '<div class="format-block">';
        html += '<div class="format-header">' + (fmtNames[fk] || fk) + '</div>';
        if (fmt.layout) html += '<div class="format-layout">Layout: ' + escapeHtml(fmt.layout) + '</div>';
        if (fmt.prompt_nano_banana) {
            html += '<div class="prompt-block"><strong>🍌 Prompt:</strong><pre>' + escapeHtml(fmt.prompt_nano_banana) + '</pre>';
            html += '<button class="btn-copy" onclick="copyText(this, \'' + escapeForAttr(fmt.prompt_nano_banana) + '\')">📋 Copiar</button></div>';
        }
        html += '</div>';
    }
    html += '</details>';

    html += '<div class="card-actions">';
    html += '<button class="btn-secondary" onclick="copyFullScript(' + r.variacao + ', \'image\')">📋 Copiar Copy Completa</button>';
    html += '</div>';

    html += '</div>';
    return html;
}

/* ============================================================
   RATING BADGE & DIRECTOR EVALUATION
   ============================================================ */
function renderRatingBadge(nota) {
    var colorClass = 'rating-low';
    if (nota >= 70) colorClass = 'rating-high';
    else if (nota >= 40) colorClass = 'rating-mid';
    return '<div class="rating-badge ' + colorClass + '">' + nota + '%</div>';
}

function renderDirectorEvaluation(eval_data) {
    if (!eval_data) return '';

    var nota = eval_data.nota_geral || 0;
    var criterios = eval_data.criterios || {};
    var veredito = eval_data.veredito || '';
    var melhorias = eval_data.melhorias || [];

    var colorClass = 'rating-low';
    if (nota >= 70) colorClass = 'rating-high';
    else if (nota >= 40) colorClass = 'rating-mid';

    var html = '<div class="director-evaluation">';
    html += '<div class="director-header">';
    html += '<span class="director-icon">🎬</span>';
    html += '<span class="director-title">Avaliação do Diretor Criativo</span>';
    html += '<div class="director-score ' + colorClass + '">' + nota + '%</div>';
    html += '</div>';

    // Barras de critérios
    var criterioNames = {
        hook_power: '🎯 Hook Power',
        especificidade: '🔬 Especificidade',
        coerencia: '🔗 Coerência',
        corpo_persuasivo: '💪 Corpo Persuasivo',
        cta_clarity: '🔥 CTA Clarity',
        originalidade: '✨ Originalidade'
    };

    html += '<div class="criteria-bars">';
    var keys = ['hook_power', 'especificidade', 'coerencia', 'corpo_persuasivo', 'cta_clarity', 'originalidade'];
    for (var ci = 0; ci < keys.length; ci++) {
        var key = keys[ci];
        var val = criterios[key] || 0;
        var barColor = val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444';
        html += '<div class="criteria-row">';
        html += '<span class="criteria-label">' + (criterioNames[key] || key) + '</span>';
        html += '<div class="criteria-bar-bg"><div class="criteria-bar-fill" style="width:' + val + '%;background:' + barColor + '"></div></div>';
        html += '<span class="criteria-value">' + val + '</span>';
        html += '</div>';
    }
    html += '</div>';

    // Veredito
    if (veredito) {
        html += '<div class="director-verdict">"' + escapeHtml(veredito) + '"</div>';
    }

    // Melhorias
    if (melhorias.length > 0) {
        html += '<div class="director-improvements"><strong>Melhorias sugeridas:</strong>';
        for (var mi = 0; mi < melhorias.length; mi++) {
            html += '<div class="improvement-item">→ ' + escapeHtml(melhorias[mi]) + '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

/* ============================================================
   ABA 2 — UPLOAD
   ============================================================ */
function uploadEditorFiles() {
    if (STATE.editorFiles.length === 0) {
        showToast('Selecione vídeos e/ou SRTs primeiro', 'error');
        return;
    }

    var btn = document.getElementById('btnUploadEditor');
    btn.disabled = true;
    btn.innerHTML = '⏳ Enviando...';

    var fd = new FormData();
    for (var i = 0; i < STATE.editorFiles.length; i++) {
        fd.append('files', STATE.editorFiles[i]);
    }

    fetch(CONFIG.API_BASE + '/api/v2/editor/upload', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            btn.disabled = false;
            btn.innerHTML = '📁 Enviar Arquivos';
            if (data.status === 'success') {
                STATE.editorSessionId = data.session_id;
                STATE.editorPairs = data.pairs || [];
                renderEditorPairs(data);
                document.getElementById('btnGenerateCuts').disabled = false;
                showToast('Arquivos enviados! ' + STATE.editorPairs.length + ' par(es) encontrado(s)', 'success');
            } else {
                showToast('Erro: ' + (data.detail || 'falha no upload'), 'error');
            }
        })
        .catch(function (e) {
            btn.disabled = false;
            btn.innerHTML = '📁 Enviar Arquivos';
            showToast('Erro de conexão: ' + e.message, 'error');
        });
}

function renderEditorPairs(data) {
    var container = document.getElementById('editorPairs');
    var pairs = data.pairs || [];
    var rejected = data.rejected || [];

    var html = '';
    for (var i = 0; i < pairs.length; i++) {
        var p = pairs[i];
        var srtInfo = p.srt ? ('+ ' + p.srt + ' (' + p.segments + ' segs)') : '(sem SRT)';
        html += '<div class="pair-item pair-ok">✅ ' + escapeHtml(p.video) + ' ' + escapeHtml(srtInfo) + '</div>';
    }
    for (var j = 0; j < rejected.length; j++) {
        var r = rejected[j];
        html += '<div class="pair-item pair-rejected">❌ ' + escapeHtml(r.filename) + ': ' + escapeHtml(r.reason) + '</div>';
    }
    container.innerHTML = html;
}

/* ============================================================
   ABA 2 — GERAR CORTES
   ============================================================ */
function generateEditorCuts() {
    if (!STATE.editorSessionId) {
        showToast('Envie os arquivos primeiro', 'error');
        return;
    }

    var btn = document.getElementById('btnGenerateCuts');
    btn.disabled = true;
    btn.innerHTML = '⏳ Gerando cortes com IA + avaliação...';

    var fd = new FormData();
    fd.append('session_id', STATE.editorSessionId);
    fd.append('target_duration', STATE.editorDuration);
    fd.append('variations', STATE.editorVariations);
    fd.append('mode', STATE.editorMode);
    fd.append('subtitle_enabled', STATE.subtitleEnabled);
    fd.append('subtitle_style', STATE.subtitleStyle);
    fd.append('produto', document.getElementById('editorProduto').value.trim());
    fd.append('publico_alvo', document.getElementById('editorPublico').value.trim());

    fetch(CONFIG.API_BASE + '/api/v2/editor/generate', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            btn.disabled = false;
            btn.innerHTML = '✂️ Gerar Cortes Automáticos';
            if (data.status === 'success') {
                renderEditorResults(data);
                showToast('Cortes gerados! ' + data.total_results + ' resultado(s)', 'success');
            } else {
                showToast('Erro: ' + (data.detail || 'falha na geração'), 'error');
            }
        })
        .catch(function (e) {
            btn.disabled = false;
            btn.innerHTML = '✂️ Gerar Cortes Automáticos';
            showToast('Erro de conexão: ' + e.message, 'error');
        });
}

/* ============================================================
   ABA 2 — RENDERIZAR RESULTADOS
   ============================================================ */
function renderEditorResults(data) {
    var container = document.getElementById('editorResults');
    var results = data.results || [];

    if (results.length === 0) {
        container.innerHTML = '<p class="empty">Nenhum resultado gerado.</p>';
        return;
    }

    var html = '<h3>Resultados (' + results.length + ' corte(s))</h3>';

    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        html += '<div class="result-card">';

        if (r.error) {
            html += '<div class="card-header"><div class="card-title">❌ ' + escapeHtml(r.source_video || '') + ' — Variação ' + r.variation + '</div></div>';
            html += '<div class="error-msg">' + escapeHtml(r.error) + '</div>';

            // Mesmo com erro, mostrar avaliação se existir
            if (r.avaliacao_diretor) {
                html += renderDirectorEvaluation(r.avaliacao_diretor);
            }
        } else {
            var eval_data = r.avaliacao_diretor || null;

            html += '<div class="card-header">';
            html += '<div class="card-title">✅ ' + escapeHtml(r.source_video || '') + ' — Variação ' + r.variation + '</div>';
            if (eval_data) {
                html += renderRatingBadge(eval_data.nota_geral);
            }
            html += '</div>';

            html += '<div class="card-meta">';
            html += '<span>Duração: ' + (r.total_duration || 0).toFixed(1) + 's</span>';
            html += '<span>Segmentos: ' + (r.segment_count || 0) + '</span>';
            html += '<span>Tamanho: ' + ((r.file_size || 0) / 1024 / 1024).toFixed(1) + ' MB</span>';
            if (r.planned_by) html += '<span>Planejado por: ' + escapeHtml(r.planned_by) + '</span>';
            if (r.subtitle_style && r.subtitle_style !== 'sem_legenda') html += '<span>Legenda: ' + escapeHtml(r.subtitle_style) + '</span>';
            html += '</div>';

            if (r.ai_reasoning) {
                html += '<div class="ai-reasoning">🤖 ' + escapeHtml(r.ai_reasoning) + '</div>';
            }

            // Download
            if (r.download_url) {
                var cleanUrl = CONFIG.API_BASE + r.download_url.replace(/\s+/g, '');
                html += '<div class="download-section">';
                html += '<a href="' + cleanUrl + '" download="' + escapeForAttr(r.filename || 'video.mp4') + '" class="btn-primary btn-download">⬇️ Download Vídeo</a>';
                html += '</div>';
            }

            // Estrutura
            var structure = r.structure || [];
            if (structure.length > 0) {
                html += '<details class="storyboard-details"><summary>📋 Estrutura de cortes (' + structure.length + ' segmentos)</summary>';
                html += '<div class="storyboard">';
                for (var si = 0; si < structure.length; si++) {
                    var seg = structure[si];
                    var roleClass = (seg.role || '').toLowerCase();
                    html += '<div class="storyboard-scene segment-' + roleClass + '">';
                    html += '<div class="scene-header">' + escapeHtml(seg.role || 'BODY');
                    if (seg.start !== undefined) html += ' (' + seg.start.toFixed(1) + 's → ' + seg.end.toFixed(1) + 's)';
                    if (seg.score) html += ' — Score: ' + seg.score;
                    html += '</div>';
                    html += '<div class="scene-text">' + escapeHtml(seg.text || '') + '</div>';
                    var triggers = seg.triggers || [];
                    if (triggers.length > 0) {
                        html += '<div class="triggers">';
                        for (var ti = 0; ti < triggers.length; ti++) {
                            html += '<span class="trigger-badge">' + escapeHtml(triggers[ti]) + '</span>';
                        }
                        html += '</div>';
                    }
                    html += '</div>';
                }
                html += '</div></details>';
            }

            // Avaliação do Diretor Criativo
            if (eval_data) {
                html += renderDirectorEvaluation(eval_data);
            }
        }

        html += '</div>';
    }

    container.innerHTML = html;
}

/* ============================================================
   UTILITÁRIOS
   ============================================================ */
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeForAttr(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}

function copyText(btn, text) {
    var decoded = text.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    navigator.clipboard.writeText(decoded).then(function () {
        var original = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        setTimeout(function () { btn.innerHTML = original; }, 2000);
    }).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = decoded;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        var original = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        setTimeout(function () { btn.innerHTML = original; }, 2000);
    });
}

function copyFullScript(variacao, tipo) {
    var results = document.getElementById('creativeResults');
    if (!results) return;

    var cards = results.querySelectorAll('.result-card');
    var card = cards[variacao - 1];
    if (!card) return;

    var text = '';
    if (tipo === 'video') {
        var sections = card.querySelectorAll('.script-section');
        for (var i = 0; i < sections.length; i++) {
            var label = sections[i].querySelector('.section-label');
            var txt = sections[i].querySelector('.section-text');
            var vis = sections[i].querySelector('.section-visual');
            if (label) text += label.textContent + '\n';
            if (txt) text += txt.textContent + '\n';
            if (vis) text += vis.textContent + '\n';
            text += '\n';
        }
    } else {
        var headline = card.querySelector('.copy-headline');
        var sub = card.querySelector('.copy-sub');
        var cta = card.querySelector('.copy-cta');
        var support = card.querySelector('.copy-support');
        if (headline) text += 'HEADLINE: ' + headline.textContent + '\n';
        if (sub) text += 'SUB: ' + sub.textContent + '\n';
        if (cta) text += 'CTA: ' + cta.textContent + '\n';
        if (support) text += 'APOIO: ' + support.textContent + '\n';
    }

    navigator.clipboard.writeText(text.trim()).then(function () {
        showToast('Roteiro copiado!', 'success');
    }).catch(function () {
        showToast('Erro ao copiar', 'error');
    });
}

function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast toast-' + (type || 'info') + ' show';
    setTimeout(function () { toast.className = 'toast'; }, 4000);
}
