# Brug EP01-pakken i Google AI Studio

Repoet indeholder kun løse filer — ingen `.zip`/`.rar`. Alt, der skal til, er
tekst og referencebilleder, så det kan uploades direkte i AI Studio.

## 1. Upload filerne (rækkefølge er ligegyldig)

**Kerntekst — skal med (ca. 180 KB i alt)**

| Fil | Indhold |
|---|---|
| `SCRIPT.md` | Manuskriptet |
| `NARRATION.txt` | De indtalte ord, scene for scene |
| `STORYBOARD.md` | Beat-for-beat, tagget [E] eller [F] |
| `PROMPT_EP01.md` | Shot-liste: 11 scener, hvert nummer = ét shot |
| `MAGICAI_EP01.md` | Klar-til-paste blokke: indstillinger + én blok pr. scene |
| `ASSETS.md`, `ASSET_MANIFEST.md` | Hvilke aktiver der findes og genbruges |
| `RELEASE_DRAFTS.md` | Titel, beskrivelse, kapitler, tags, thumbnail-idé |
| `PRONUNCIATION.md`, `NARRATION_AUDIO.md` | Udtale og lydleverance |
| `SOURCES_AND_FACT_QA.md` | Intern faktaliste — aldrig visuel |
| `STYLE_6THINGS.md` | Stil-låsen (E Editorial + F Cinematic) |
| `SERIES_NOTE_SIX_THINGS.md` | Seriens note |
| `LOCAL_PRODUCTION.md` | Produktionslayout og tjek |
| `sixthings_ep01_p1_timing.csv` | Målt timing pr. scene |
| `scene-index.json` | Sceneindeks |

**Referencebilleder — upload som billeder**

- `a_thumbnail_1920x1080.png`, `a_thumbnail_1280x720.jpg`
- `b_sign01_titlecard_propwash.png`
- `c_F_hud_beat_sign01.png`
- `d_recap_card.png`
- `e_end_card.png`
- `ref_E_editorial.jpg`, `ref_F_cinematic.jpg`
- `quad_cutout_PLACEHOLDER.png`, `plate_F_clean_PLACEHOLDER.jpg` (kun koncept-pladsholdere)
- `eqt-icon-1024.png` (den eneste tilladte branding)

Ikke nødvendige for AI Studio: `*.phonemes.json`, `lexicon.json`,
`sixthings_ep01_respell_log.*`, `SHA256SUMS.txt`, `FILE_MANIFEST.json`,
`VALIDATION.json`, `DELIVERY_STATUS.json`, fonte og `shared/animation-reference/`.

## 2. Prompt — kopiér hele blokken ind som første besked

```text
You are producing "6 Signs Your Quad Has a Tuning Problem, Not a Hardware Problem" — episode 1 of the EasyQuadTune long-form series "6 Things". The attached files are the complete text production handoff for one single-part episode of about 14.6 minutes.

Read these attached files in full before you write anything: STYLE_6THINGS.md, SERIES_NOTE_SIX_THINGS.md, LOCAL_PRODUCTION.md, SCRIPT.md, STORYBOARD.md, NARRATION.txt, ASSETS.md, PRONUNCIATION.md, NARRATION_AUDIO.md, RELEASE_DRAFTS.md, PROMPT_EP01.md, MAGICAI_EP01.md, sixthings_ep01_p1_timing.csv, scene-index.json.

All files are flat uploads, so ignore folder paths in the documents. Refer to files by name only.

MANDATORY STYLE: the 6 Things style lock in STYLE_6THINGS.md — [E] Editorial cards and [F] Cinematic explanation beats; every storyboard beat is tagged [E] or [F]. Match the attached reference frames. The red-orange accent #EC4118 is the only highlight in E; teal means measured data in F. Hard cut or fast wipe on the beat. If a beat cannot be done inside the lock, stop and ask — never invent a third look.

HARD RULES: faceless — no people, faces, hands, presenters, avatars or lip-sync. No sources in the video: no source names, citations, URLs, document, page or channel titles, no screenshots of docs, no "source:"/"according to" captions, no footnotes or credit overlays, in any scene, lower third or end card. SOURCES_AND_FACT_QA.md is internal research input only, never visual material. One text block on screen at a time, no overlapping text, no corner watermarks or brand bugs. Every chart is synthetic and labelled once as a synthetic example. EasyQuadTune appears only as the attached icon, sparingly, with no invented app UI or product claims.

NARRATION IS FINISHED: do not rewrite, shorten, extend, re-synthesize, re-time or alter the narration or the voice. Cut visuals to the supplied audio and to sixthings_ep01_p1_timing.csv. The respellings in the audio files were text-to-speech only; captions and graphics keep the manuscript wording.

YOU CANNOT RUN CODE HERE: you have no shell, no Python, no ffmpeg and no local filesystem. When a step needs build_frames.py, render_narration.py, ffmpeg or any other command, output the exact command or code for Thomas to run himself on Windows PowerShell 5.1, and say plainly that you did not run it. Never claim to have rendered, heard or watched anything.

DEFAULT MUSIC: none. No paid APIs, no accounts, no uploads, no publication.

Work in the shot order of PROMPT_EP01.md, one scene block at a time, each shot as one continuous 3D animation. Start by confirming in a short list what you have read, then produce Scene 1 and stop for my review.
```

## 3. Praktisk

- Vælg en Gemini-model med lang kontekst (Pro-klassen). Pakken er under 200 KB tekst, så alt kan være i konteksten på én gang.
- AI Studio kan ikke køre Python, ffmpeg eller Kokoro. `style/build_frames.py`, `shared/voice/render_narration.py` og al lydbehandling kører fortsat lokalt.
- De færdige EP01-lydfiler (`sixthings_ep01_p1_s01…s11`, `…_full`, WAV/MP3) ligger **ikke** i repoet — de blev leveret ved siden af ZIP-pakken. Upload dem kun, hvis du vil have Gemini til at forholde sig til dem; til klipning er `sixthings_ep01_p1_timing.csv` nok.
- `MAGICAI_EP01.md` kan bruges direkte som blokke til et videogenereringsværktøj uden om AI Studio.
- Hvis upload-grænsen rammes, så upload kernteksten først og referencebillederne i en ekstra besked.
