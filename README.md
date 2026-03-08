# Criativo Studio v3 — Facebook Ads

Sistema de análise de SRTs e geração de criativos com storyboard para Facebook Ads.

## Deploy no Cloudflare Pages via GitHub

### 1. Criar repositório no GitHub
1. Acesse github.com e crie um novo repositório (ex: `criativo-studio`)
2. Faça upload de todos os arquivos desta pasta para o repositório

### 2. Conectar ao Cloudflare Pages
1. Acesse dash.cloudflare.com
2. Vá em **Workers & Pages → Pages → Create a project**
3. Clique em **Connect to Git**
4. Selecione seu repositório `criativo-studio`
5. Em **Build settings**, configure:
   - Framework preset: `None`
   - Build command: *(deixar vazio)*
   - Build output directory: `/` ou `.`
6. Clique em **Save and Deploy**

### 3. Pronto
Seu sistema estará disponível em `criativo-studio.pages.dev` (ou domínio customizado).

## Estrutura de arquivos

```
criativo-studio/
├── index.html       ← Aplicação principal
├── _redirects       ← Configuração de rotas Cloudflare
└── README.md        ← Este arquivo
```

## Como usar
1. Acesse a URL do Cloudflare Pages
2. Insira sua chave de API do Groq (console.groq.com/keys)
3. Faça upload dos arquivos .srt nomeados como video1.srt, video2.srt...
4. Configure os parâmetros e clique em Gerar
5. Clique em qualquer criativo para ver o storyboard completo
