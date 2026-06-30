# FinBot — Financial Assistant

Interface web de chatbot financier développée dans le cadre du hackathon Ynov M1.  
Elle connecte un modèle de langage local via Ollama à une interface conversationnelle pensée pour les questions financières.

---

## Fonctionnalités

- Chat en temps réel avec streaming token par token
- Rendu Markdown des réponses de l'IA
- Historique des conversations avec cache en session
- KPIs financiers en direct : CAC 40, S&P 500, EUR/USD, taux BCE
- Page profil utilisateur avec contrôles RGPD (export, partage, suppression)
- Pages WIP pour les sections à venir (Marchés, Portefeuille, Rapports)

---

## Stack

- HTML / CSS / JavaScript vanilla (aucun framework, aucun build)
- [Ollama](https://ollama.com/) — inférence locale du LLM
- [marked.js](https://marked.js.org/) — rendu Markdown (CDN)
- [Yahoo Finance](https://finance.yahoo.com/) via `corsproxy.io` — données boursières
- [Frankfurter API](https://www.frankfurter.app/) — taux de change EUR/USD

---

## Structure

```
chatbot_hackaton/
├── index.html              # Page principale (chat)
├── profile.html            # Page profil utilisateur
├── css/
│   ├── style.css           # Styles globaux
│   └── profile.css         # Styles de la page profil
├── js/
│   ├── main.js             # Logique principale (chat, streaming, KPIs)
│   ├── config.js           # Configuration sensible (gitignored)
│   └── config.example.js   # Template de configuration
└── .gitignore
```

---

## Installation

### Prérequis

- [Ollama](https://ollama.com/) installé et accessible sur le réseau
- Un modèle chargé, par exemple :
  ```bash
  ollama pull qwen2.5:3b-instruct
  ```

### Configuration

Copier le fichier exemple et renseigner l'URL du serveur Ollama :

```bash
cp js/config.example.js js/config.js
```

Editer `js/config.js` :

```js
const CONFIG = {
  API_URL: 'http://<IP_OLLAMA>:11434/api/generate',
  MODEL: 'qwen2.5:3b-instruct',
};
```

### Lancement

Aucun serveur nécessaire. Ouvrir directement `index.html` dans un navigateur, ou servir le dossier avec un serveur statique :

```bash
npx serve .
# ou
python -m http.server 8080
```

---

## Modèle utilisé

Le projet utilise `qwen2.5:3b-instruct` via Ollama.  
L'endpoint attendu est `/api/generate` avec `stream: true`.

---

## Auteur

Projet réalisé par **Jade Cottin** — Ynov M1 Hackathon
