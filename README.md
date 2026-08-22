# MKA.ARCH — Senior Mobile / Android App Architect Portfolio

**Moe Kyaw Aung (မိုးကျော်အောင်)**  
Dark-glass · 3D floating UI · Animated skill graphs · Burmese/English

## Theme
- Dark glassmorphism (blur + translucent panels)
- Floating 3D cards (`float-3d` / perspective)
- Soft glow orbs + particle field
- Cinematic fade-up reveals
- Multilingual EN ↔ မြန်မာ
- Architect AI assistant (design Q&A)

## Home sections
1. Hero (typing + counters + 3D avatar stack)
2. About
3. Skills Matrix (animated bars + focus map)
4. Android Roadmap
5. Compose UI Gallery
6. Architecture Lab (offline-first stack)
7. Performance Benchmarks
8. CI/CD Pipelines
9. Projects
10. Security
11. On-Device AI
12. Contact

## Pages (`pages/`)
- lab.html — Architecture Lab deep dive
- roadmap.html — Full career/skill roadmap
- resume.html — Online resume + PDF download
- about, skills, compose, projects, performance, cicd, security, aiml, certificates, contact

## Assets
- `assets/Moe_Kyaw_Aung_Resume.pdf`

## Run
Open `index.html` in a browser, or deploy the folder to GitHub Pages / Netlify / Vercel.

## Philosophy
> Code with culture. Build with purpose.

© 2026 Moe Kyaw Aung

## CI / CD (GitHub Actions)

Workflows live in `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | push + PR | Validate JSON, HTML structure, JS syntax, smoke HTTP |
| `deploy-pages.yml` | push to main | Deploy static site to GitHub Pages |

### Enable Pages
1. Push this folder as a GitHub repository
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Push to `main` — site deploys automatically

### Local check (same idea as CI)
```bash
jq empty data/*.json
node --check js/main.js
node --check js/fetch-data.js
python3 -m http.server 8080
```
