# Pete's Notes

Peter's own notes app: notebooks, tags, job numbers, checklists, attachments and an encrypted locked notebook.
Works offline and syncs between PC, laptop, iPhone and iPad through Supabase. Live at https://notes.archimedia.ie

- `index.html`, `styles.css`, `app.js`: the app (no build step)
- `sw.js`, `manifest.webmanifest`: installable, offline-ready
- `vendor/`: pinned copies of supabase-js 2.45.4, DOMPurify 3.1.6, JSZip 3.10.1

The Supabase publishable key in `app.js` is meant to be public. Each account can only read its own rows (row-level security).
