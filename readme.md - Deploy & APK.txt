# S19 School Planner — Deploy & APK

## 1) Préparer les fichiers
- Place `index.html`, `style.css`, `script.js`, `manifest.json`, `sw.js` et un dossier `assets/` (icônes `logo-192.png` et `logo-512.png`) dans un dossier root.

## 2) Déployer sur Netlify
Option 1 (drag & drop):
- Aller sur https://app.netlify.com/sites -> New site -> Deploy manually -> drag-and-drop le dossier build.
- Netlify fournira un lien du type: `https://your-site-name.netlify.app` (HTTPS activé automatiquement).

Option 2 (Git):
- Pousse le dossier sur GitHub -> Netlify -> New site from Git -> choisis le repo -> Deploy.

## 3) Générer APK (Web -> App)
### PWABuilder (recommandé pour fiabilité)
1. Va sur https://www.pwabuilder.com/ et entre ton URL Netlify (ex: `https://your-site-name.netlify.app`).
2. PWABuilder analysera le site et te proposera des options; choisis Android.
3. Télécharge le projet Android ou l'APK prêt à l'emploi.

### Alternative: Web2Apk services
- https://www.web2apk.com/ ou https://www.pwabuilder.com/ peuvent produire APK. Fournis l'URL Netlify et icon, version, package name.

## 4) Remarques
- Netlify fournit automatiquement HTTPS (certificat SSL).
- L'app est offline-ready grâce au service worker.
- Pour mettre sur Google Play, il faudra signer l'APK et créer un compte Google Developer.
