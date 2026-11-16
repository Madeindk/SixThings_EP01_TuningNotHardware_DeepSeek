# sixthings_ep01 narration respell log

Official manuscript files were not rewritten. These changes apply only to the TTS input (and, where noted, to the phoneme string after espeak).

Voice: bm_daniel, speed 1.0, lang en-gb.

## Events actually applied

| scene | stage | rule | original | spoken | why |
|---|---|---|---|---|---|
| P1-S01 | text | Blackbox | Blackbox | black box | Spoken 'black box', not one jammed word |
| P1-S02 | text | PID | PID | P I D | Letter names, EP2 NORM (for EP06–10) |
| P1-S05 | text | PID | PID | P I D | Letter names, EP2 NORM (for EP06–10) |
| P1-S06 | text | EasyQuadTune | EasyQuadTune | Easy Quad Tune | Channel name, three spoken words |
| P1-S06 | text | feedforward | feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S06 | text | feedforward | feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S07 | text | feedforward | Feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S07 | text | feedforward | feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S07 | text | feedforward | feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S07 | text | feedforward | feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S07 | text | feedforward | feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S07 | text | feedforward | feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S07 | text | feedforward | feedforward | feed-forward | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| P1-S08 | text | EasyQuadTune | EasyQuadTune | Easy Quad Tune | Channel name, three spoken words |
| P1-S08 | text | PID | PID | P I D | Letter names, EP2 NORM (for EP06–10) |
| P1-S08 | text | TPA | TPA | T P A | Letter names (throttle PID attenuation), Six Things EP01 |
| P1-S08 | text | TPA | TPA | T P A | Letter names (throttle PID attenuation), Six Things EP01 |
| P1-S08 | phoneme | Betaflight phoneme | bˌiːtəflˈaɪt hɐz ɐ fˈiːtʃə bˈɪlt fɔːɹ ɛɡzˈaktli ðˈɪs: tˈiː pˈiː ˈeɪ, θɹˈɒtəl pˈiː aɪ dˈiː ɐtˌɛnjuːˈeɪʃən, wˌɪtʃ ɹɪdjˈuːsɪz ɡˈeɪnz az θɹˈɒtəl ɹˈaɪzɪz pˈast ɐ bɹˈeɪkpɔɪnt. | bˈeɪtəflˌaɪt hɐz ɐ fˈiːtʃə bˈɪlt fɔːɹ ɛɡzˈaktli ðˈɪs: tˈiː pˈiː ˈeɪ, θɹˈɒtəl pˈiː aɪ dˈiː ɐtˌɛnjuːˈeɪʃən, wˌɪtʃ ɹɪdjˈuːsɪz ɡˈeɪnz az θɹˈɒtəl ɹˈaɪzɪz pˈast ɐ bɹˈeɪkpɔɪnt. | BAY-ta-flight, not British BEE-ta-flight |
| P1-S10 | text | EasyQuadTune | EasyQuadTune | Easy Quad Tune | Channel name, three spoken words |

## Counts

| rule | stage | count | why |
|---|---|---|---|
| Blackbox | text | 1 | Spoken 'black box', not one jammed word |
| PID | text | 3 | Letter names, EP2 NORM (for EP06–10) |
| EasyQuadTune | text | 3 | Channel name, three spoken words |
| feedforward | text | 9 | EP2 NORM (case-insensitive first letter, Six Things EP01) |
| TPA | text | 2 | Letter names (throttle PID attenuation), Six Things EP01 |
| Betaflight phoneme | phoneme | 1 | BAY-ta-flight, not British BEE-ta-flight |

## Rules considered but not applied on this episode

The renderer also knows ExpressLRS, GHz, MHz, kHz, CVBS, RF, PID, FFT, CSV, LiPo, feedforward and EasyQuadTune respells. They are logged only when the official text actually contains them. The EP4 phoneme rule that forces American 'lawg' on the word log was deliberately not used: with en-gb, 'log' already comes out as lˈɒɡ (LOG, not lock), and that rule can distort 'analog'.

