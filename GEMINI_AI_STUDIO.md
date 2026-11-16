# Brug repoet og filmen i Google AI Studio

Status: episoden er **bygget**. Filmen ligger i repoet, og der er tre ting, det giver
mening at spørge AI Studio om. Vælg efter hvad du vil opnå.

Repo: https://github.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek
Gren: `EP01`

---

## 1. Få filmen gennemgået (uploadvideo)

AI Studio kan se video, men den skal **uploades som fil** — et GitHub-link giver kun
tekst, ikke afspilning. Filen er 64,9 MB:

```
SixThings_EP01/EP01/out/SixThings_EP01_TuningNotHardware.mp4
```

Upload den og indsæt:

```text
Du får en færdig 12:45 lang forklarende video om drone-tuning: "6 Signs Your Quad
Has a Tuning Problem, Not a Hardware Problem".

Jeg vil have en teknisk og visuel gennemgang, ikke ros. Vær konkret og brug
tidsstempler.

1. Er der steder hvor noget visuelt er i konflikt med det der bliver sagt — fx et
   diagram der viser noget andet end ordene, eller en markering der peger forkert?
2. Er der frames hvor tekst overlapper, er skåret af, eller er for lille til at
   læses på 1080p?
3. Skifter billedet mellem to visuelle modi (råhvidt papir med store typer, og
   mørkt studie med HUD-paneler)? Er hvert skift på en sætningsgrænse, eller sker
   der skift midt i en sætning?
4. Er der øjeblikke hvor der ikke sker noget i billedet i mere end 5 sekunder,
   mens der bliver talt?
5. Lyder fortællestemmen ens hele vejen igennem, eller falder kvaliteten i
   bestemte afsnit?

Svar som en nummereret liste med tidsstempel, hvad du ser, og hvad der er galt.
Afslut med de tre vigtigste ting jeg bør rette.
```

Kapitler, hvis du vil pege på et bestemt afsnit:

| Tid | Afsnit |
|---|---|
| 0:00 | Intro |
| 0:50 | Setpoint, gyro og én regel |
| 1:47 | Tegn 1: propwash |
| 3:13 | Tegn 2: varme motorer |
| 4:36 | Tegn 3: bounce-back |
| 6:00 | Tegn 4: gyro sent eller for langt |
| 7:16 | Tegn 5: twitch efter tommelfingrene |
| 8:30 | Tegn 6: rysten ved høj gas |
| 9:46 | Når det virkelig er hardware |
| 11:08 | Sådan flyver du en log der kan svare |
| 12:09 | Recap |

---

## 2. Få repos og dokumenter gennemgået (link, ingen upload)

Her er linket nok, fordi det hele er tekst.

```text
Her er et repo: https://github.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek
(gren EP01)

Det er produktionsmaterialet til én episode af en serie. Episoden er allerede
bygget og ligger som MP4 i EP01/out/. Jeg vil ikke have den bygget igen.

Læs README.md først — den er indgangen og siger hvad der gælder nu.

Kig derefter efter modsigelser på tværs af dokumenterne:
- Står der stadig noget om stemmen bm_daniel, Kokoro eller en 14:35-længde, som
  ikke længere er sandt?
- Passer kapiteltiderne i RELEASE_DRAFTS.md med timing-arket?
- Passer sceneindekset i scene-index.json med timing-arket?
- Refererer nogen dokument til filer der ikke findes i repoet?

Svar som en liste: fil, linje/citat, hvad der er forkert, og hvad der burde stå.
Hvis alt stemmer, så sig det tydeligt i stedet for at opfinde problemer.
```

---

## 3. Byg videre på serien

Når episode 2 findes i samme stil, kan du give den samme brief som episode 1 fik.
Brug filen `SixThings_EP01/EP01/START_EP01.txt` som skabelon — den indeholder de
regler, der gjaldt, og kan kopieres til næste episode.

```text
Her er repoet: https://github.com/Madeindk/SixThings_EP01_TuningNotHardware_DeepSeek
(gren EP01)

Læs README.md, derefter SixThings_EP01/EP01/START_EP01.txt og
SixThings_EP01/style/STYLE_6THINGS.md.

START_EP01.txt er reglerne for episode 1. Brug dem som skabelon for episode 2,
men ret dem hvor de er episodespecifikke (sceneantal, emne, lydfilnavne).

Du kan ikke køre Python, ffmpeg eller lokale builds. Når et trin kræver en
kommando, skriv kommandoen til mig i stedet for at lade som om du har kørt den.
Påstå ikke at have hørt lyd eller set et render.
```

---

## Hvad AI Studio kan og ikke kan

| Kan | Kan ikke |
|---|---|
| Læse alle tekstfiler via et offentligt link | Afspille en video fra et GitHub-link — upload filen |
| Se uploadet video, billeder og lyd | Køre Python, ffmpeg eller `build/render.js` |
| Transskribere og tidfæste tale | Klone en stemme (Google afviser syntetisk tale) |
| Foreslå rettelser i kode og tekst | Se hvad der sker i Cursor eller på din maskine |

Vil du have filmen ændret, skal ændringen ende som en kodeændring i `build/`, og
så skal `node build/render.js --fps 30 --encode` og `node build/assemble.js`
køres lokalt. Se `BUILD.md`.

## Praktisk

- Vælg en model i Pro-klassen; video kræver lang kontekst.
- Er upload-grænsen et problem, så upload i stedet et af de små
  scene-MP3-filer fra `SixThings_EP01/EP01/audio/andrew/` og spørg kun om lyden.
- `.secrets.baseline` og `.semgrepignore` er sikkerhedsværktøj. Ignorér dem.
- Repoet er offentligt. Alt i det kan læses af alle.
