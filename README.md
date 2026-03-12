# 🚀 Halley Criativos Studio

**IA Especialista em Vendas Sênior & Direct Response Marketing**

Sistema completo com Machine Learning para geração de criativos de alta conversão e edição automática baseada em análise persuasiva.

---

## 🏗️ Arquitetura

| Componente | Tecnologia | Deploy |
|---|---|---|
| **Frontend** | HTML + CSS + Vanilla JS | Cloudflare Pages (via GitHub) |
| **Backend** | Python + FastAPI + Transformers | Hugging Face Spaces (Docker) |
| **ML Models** | BERT Multilingual + BART MNLI | Carregados no HF Spaces |

---

## ⚡ Funcionalidades

### Aba 1 — Gerador de Criativos
- **Vídeo**: Roteiro completo + Storyboard com cortes + Prompt Veo 3 por cena
- **Imagem**: Conceito + Headline + Subheadline + CTA + Prompt Nano Banana em PT-BR
- Stepper de 1–10 variações
- 5 frameworks de Direct Response (AIDA, PAS, BAB, QUEST, Storytelling)
- Botão copiar individual em cada prompt
- Formatos: Feed (1:1) / Story (9:16) / Banner (16:9) / Todos

### Aba 2 — Editor Automático
- Upload de vídeos + SRTs com indicador visual de par encontrado/faltando
- Duração configurável: 30/45/60/90 segundos
- Modo individual ou mix
- 1–10 variações
- Análise de poder persuasivo com ML (15 gatilhos mapeados)
- Relatório detalhado por corte: timestamp, fala, score, gatilhos, motivo de seleção

---

## 🚀 Deploy — Passo a Passo

### 1. Backend (Hugging Face Spaces)

1. Acesse [huggingface.co/new-space](https://huggingface.co/new-space)
2. Configure:
   - **Space name**: `halley-criativos-studio`
   - **SDK**: Docker
   - **Hardware**: CPU Basic (gratuito)
   - **Visibility**: Public
3. Faça upload dos arquivos da pasta `backend/`:
   - `app.py`
   - `ai_engine.py`
   - `srt_processor.py`
   - `requirements.txt`
   - `Dockerfile`
4. Aguarde o build (pode levar 3-5 min)
5. Copie a URL do Space: `https://SEU-USUARIO-halley-criativos-studio.hf.space`

### 2. Frontend (Cloudflare Pages via GitHub)

1. Crie um repositório no GitHub com os arquivos da pasta `frontend/`
2. **IMPORTANTE**: Edite `frontend/js/app.js` linha 13 e coloque a URL do seu HF Space:
   ```javascript
   API_BASE: 'https://SEU-USUARIO-halley-criativos-studio.hf.space',
