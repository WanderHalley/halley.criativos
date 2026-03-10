---
title: Criativo Studio Backend
emoji: 🎬
colorFrom: orange
colorTo: red
sdk: docker
pinned: false
---

# Criativo Studio — Backend de Renderização

Backend Flask + FFmpeg para corte e edição automática de vídeos.

## Endpoints

- `GET /health` — status do servidor
- `POST /render` — renderiza variações de vídeo
- `GET /download/{session}/{filename}` — baixa vídeo gerado
- `DELETE /cleanup/{session}` — limpa arquivos temporários

## Como fazer deploy

1. Crie um Space no Hugging Face (huggingface.co/spaces)
2. Escolha **Docker** como SDK
3. Faça upload dos arquivos: `app.py`, `requirements.txt`, `Dockerfile`, `README.md`
4. O Space builda automaticamente
5. Copie a URL do Space (ex: `https://seu-user-criativo-studio-backend.hf.space`)
6. Cole essa URL no campo "URL do Backend" no Criativo Studio
