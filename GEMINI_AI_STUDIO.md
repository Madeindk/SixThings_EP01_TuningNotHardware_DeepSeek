# Brug repoet i Google AI Studio

Repoet er **offentligt**, så du kan nøjes med at give Gemini linket og sige
"lav den her episode". Det behøver ikke at uploade filer.

## Sådan gør du

1. Opret en ny chat i [Google AI Studio](https://aistudio.google.com) med en
   Gemini-model i Pro-klassen (lang kontekst).
2. Skriv din instruks og indsæt linket:

```text
Her er repoet: https://github.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek

Lav episode 1 "6 Signs Your Quad Has a Tuning Problem, Not a Hardware Problem"
af serien 6 Things.

Start med at læse README.md i roden. Den er indgangen og fortæller, hvilke
filer du skal læse i hvilken rækkefølge, og hvilke hard rules der gælder.
Følg den. Sig derefter kort, hvad du har læst, og hvad du har forstået omkring
stil-låsen, de faceless-regler og forbuddet mod kilder på skærmen.

Arbejd derefter i shot-ordenen fra PROMPT_EP01.md, én scene ad gangen, og stop
til gennemsyn efter scene 1.

Du kan ikke køre Python, ffmpeg eller lokale builds. Når et trin kræver en
kommando, så skriv kommandoen til mig i stedet for at lade som om du har kørt
den. Og du må ikke påstå at have hørt lyd eller set et render.
```

3. Gemini henter selv filerne via linket. Hvis den ikke kan læse dem, så brug
   **raw-links** i stedet, fx:

```text
https://raw.githubusercontent.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek/EP01/README.md
```

## Hvad der er vigtigt at vide

- **Grenen hedder `EP01`.** Hovedgrenen er ikke sat til `main`, så brug
  `EP01` i alle links.
- **Lyden ligger ikke i repoet.** Det er med vilje: rendered tale er en afledt
  fil og genskabes med `SixThings_EP01/shared/voice/render_narration_tts.py`.
  Til klipning er `audio/sixthings_ep01_p1_timing.csv` nok — den giver start,
  slut og varighed for hver scene.
- **Stemmen er Andrew**, ikke bm_daniel. Hvis Gemini læser et dokument, der
  stadig siger bm_daniel eller Kokoro, er det historisk materiale — README.md
  siger det, der gælder nu.
- **AI Studio kan ikke klone stemmen.** Googles Voice Replication afviser
  syntetisk tale. Klonen køres lokalt med Chatterbox og kræver din PC.
- **Repoet er offentligt.** Alt, hvad der lægges i det, kan læses af alle.
  Materialet her indeholder ingen hemmeligheder.

## Om de to filer der ikke er læsestof

- `SixThings_EP01/shared/animation-reference/` er tredjepartskode (Three.js,
  MIT). Den er kun teknikreference og skal re-skinnes til 6 Things' tokens.
- `.secrets.baseline` og `.semgrepignore` er sikkerhedsværktøj. Ignorér dem.
