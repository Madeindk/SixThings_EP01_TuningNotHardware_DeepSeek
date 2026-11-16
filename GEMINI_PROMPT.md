# Prompt til Gemini — brug repoet, ikke upload

Repo: https://github.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek
Gren: `EP01`

Kopiér blokken nedenfor ind som første besked. Intet skal uploades: alt er tekst og
kode, og Gemini henter det selv via linket.

---

```text
Du er en erfaren motion-graphics- og 3D-instruktør.

Repo (gren EP01):
https://github.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek

OPGAVE: En 12:45 forklarende video om drone-tuning er genereret 100 % i kode.
Den er ikke god nok: 3D-quad'en ligner ikke en rigtig FPV-drone, den ser ud som en
stak kasser. Jeg vil have den bygget rigtigt.

LÆS DISSE FILER, I DENNE RÆKKEFØLGE:

1. SixThings_EP01/style/STYLE_6THINGS.md
   Stil-låsen. To modi: [E] Editorial (råhvidt papir, store Barlow Condensed-typer,
   udklippet quad, rød-orange accent #EC4118) og [F] Cinematic (mørkt studie,
   dimensional quad, ét køligt spotlys, tynd HUD, teal = målte data).

2. SixThings_EP01/shared/animation-reference/d.js
   DETTE ER DEN FUNGERENDE REFERENCE. Læs den grundigt. Det er en scene fra en
   tidligere serie der lykkedes med præcis det jeg fejler på. Læg især mærke til:
   - propellen: en CanvasTexture med 14 roterede bladlag pr. blad, tegnet på en
     CircleGeometry med transparent materiale. IKKE modellerede blade. Det giver
     motion blur og læses øjeblikkeligt som en quad i flugt.
   - motorerne: stator-cylinder + bjælde-cylinder + torus-ring, 40-48 segmenter
   - lyset: RoomEnvironment PMREM som scene.environment, plus én key-light med
     skygger, og en ShadowMaterial-gulvplade
   - kameraet: 30 mm FOV, langsom orbit, ease-in-out

3. SixThings_EP01/shared/animation-reference/lib.js
   Reference-arkitekturen: et canvas-2D-lag oven på Three.js-pladen bærer ALL
   typografi, HUD og grafer. Hver tekstboks registreres, og endFrame() rapporterer
   overlap og safe-area-brud i window.__issues. Det er QA-mekanismen.

4. build/renderer6/quad6.js  og  build/renderer6/main6.js
   MIT FORSØG. Det er her det går galt. Sammenlign med d.js og sig præcist hvad
   der er anderledes og hvorfor det ser forkert ud.

5. SixThings_EP01/EP01/STORYBOARD.md
   Beat-for-beat planen. 11 scener, 66 beats, hvert beat tagget [E] eller [F].

6. SixThings_EP01/EP01/audio/sixthings_ep01_p1_timing.csv
   Målte tider pr. scene. Billedet skal klippes til disse tal.

SVAR MIG KONKRET:

A. Hvorfor læses min quad ikke som en drone? Vær specifik: geometri, proportioner,
   materialer. Sammenlign linje for linje med d.js.

B. Skriv den korrekte THREE.js-kode til en 5-tommers freestyle-quad:
   - buildFrame(): X-ramme med fire separate, let tilspidsede carbon-arme
   - buildMotor(): stator + bjælde med ribber + metallring
   - buildProp(): CanvasTexture med roterede bladlag på CircleGeometry
   - materialer: carbon med weave-tekstur, aluminium, mat sort plast
   Brug millimeter som enhed og rigtige 5"-proportioner.

C. Hvilke kameravinkler og afstande får quad'en til at se ud som et produktfoto
   i stedet for en teknologi-demo? Giv konkrete tal for position og lookAt.

D. Hvordan får jeg de 66 beats til at se forskellige ud? Lige nu genbruger jeg
   8 visuelle primitiver, så beats i samme scene ligner hinanden. Foreslå en
   struktur hvor hvert beat har sin egen staging inden for stil-låsen.

REGLER:
- Ingen kilder på skærmen: ingen kildenavne, citater, URL'er, dokumenttitler,
  skærmbilleder af dokumentation, eller credit-overlays.
- Ansigtsløst: ingen mennesker, hænder, ansigter, avatars.
- Én tekstblok ad gangen. Ingen overlap.
- Alle grafer er syntetiske og mærkes én gang som syntetiske.
- Ingen tuning-tal (PID, filter, TPA, idle) på skærmen.
- Du kan ikke køre koden. Skriv den, og skriv de kommandoer jeg skal køre.

Vær direkte. Jeg vil have kritik, ikke ros. Start med at bekræfte hvilke filer du
har læst, og hvad du har forstået om forskellen på d.js og mit forsøg.
```

---

## Hvorfor repo og ikke upload

| | Repo-link | Upload |
|---|---|---|
| Gemini kan se min fejl **og** den fungerende reference | ja | nej, med mindre du uploader dem |
| Koden kan læses linje for linje | ja | kun hvis du kopierer den ind |
| Du kan pege på en bestemt fil eller commit | ja | nej |
| Virker med 65 MB video | nej | ja |

Videoen kan ikke afspilles fra et link. Skal Gemini se selve filmen, skal den
uploades som fil — men til at rette quad-geometrien er koden nok, og det er
koden der er problemet.

## Hvis Gemini ikke kan læse filerne

Nogle modeller henter ikke GitHub-indhold. Så brug raw-links, ét ad gangen:

```text
https://raw.githubusercontent.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek/EP01/SixThings_EP01/shared/animation-reference/d.js
https://raw.githubusercontent.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek/EP01/build/renderer6/quad6.js
https://raw.githubusercontent.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek/EP01/SixThings_EP01/style/STYLE_6THINGS.md
```
