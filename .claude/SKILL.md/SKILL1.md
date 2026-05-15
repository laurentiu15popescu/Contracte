Lucrezi pe proiectul meu MagnetoApp (React Native + Expo SDK 54 + Firebase, mobil + web).

OBIECTIV GENERAL
Vreau să parcurgi întreaga aplicație și să o uniformizezi vizual și textual, astfel încât să aibă un design premium, modern, coerent și reutilizabil pe toate ecranele, fără să pierzi funcționalități existente și fără să modifici logica business.

FOARTE IMPORTANT
Nu vreau o modificare limitată la câteva ecrane.
Vreau o abordare globală:

* toate ecranele
* toate taburile
* toate iconurile
* toate cardurile
* toate modalele
* toate butoanele
* toate textele
* toate heading-urile
* toate dimensiunile de text
* toate spacing-urile
* toate stările UI

REGULĂ CRITICĂ
Nu ai voie să modifici logica aplicației și nu ai voie să schimbi funcționalitățile existente.

Asta înseamnă:

* nu modifici query-uri Firebase
* nu modifici fluxuri de navigare
* nu modifici validări
* nu modifici filtre
* nu modifici sincronizări
* nu modifici salvări de date
* nu modifici comportamente existente
* nu elimini funcționalități
* nu introduci funcționalități noi fără justificare

Ai voie să modifici doar:

* structura vizuală
* componentizarea UI
* stilurile
* typography
* icon sizing
* spacing
* denumiri și formulări text pentru consistență
* extragerea de componente shared UI
* design tokens / presets dacă sunt necesare

SURSE DE ADEVĂR
Folosește strict:

* codul real din proiect
* ThemeContext.js
* structura reală a aplicației
* toate componentele și ecranele existente

NU AI VOIE SĂ

* inventezi fluxuri
* inventezi ecrane
* inventezi componente care schimbă arhitectura fără motiv
* adaugi librării noi
* faci redesign rupt de aplicația actuală
* copiezi 1:1 modele de pe net

BENCHMARK VIZUAL CONTROLAT
Poți folosi inspirație vizuală doar la nivel de principii, nu la nivel de copiere.
Vreau să te inspiri controlat din pattern-uri premium de tip:

* admin SaaS dashboards
* fintech dashboards
* mobile productivity apps
* interfețe premium moderne, clare, aerisite și coerente

Folosește benchmark-ul doar pentru:

* ierarhie vizuală
* claritate
* spacing
* consistență între carduri
* mărimi și greutăți de text
* utilizarea iconurilor
* modale moderne
* taburi curate
* butoane premium
* densitate vizuală controlată

NU folosi benchmark-ul pentru:

* a schimba logica aplicației
* a copia layout-uri 1:1
* a introduce pattern-uri incompatibile cu React Native + Expo
* a forța un design care nu se potrivește cu tema actuală

CE VREAU SĂ FACI

1. Analizează întreaga aplicație și identifică:

   * toate ecranele
   * toate taburile
   * toate componentele repetitive
   * toate inconsistențele de UI și text
2. Fă mai întâi un audit global și identifică:

   * stiluri duplicate
   * iconuri neuniforme
   * titluri/subtitluri neuniforme
   * carduri și butoane cu stiluri diferite
   * modale inconsistene
   * texte nealiniate ca ton și structură
3. Creează infrastructura internă necesară pentru uniformizare:

   * design tokens lipsă
   * componente shared UI
   * reguli de typography
   * reguli de icon sizing
   * reguli pentru carduri
   * reguli pentru modale
   * reguli pentru butoane
   * reguli pentru liste / tabele / empty states
4. Definește clase text clare și refolosește-le peste tot:

   * h1
   * h2
   * h3
   * section title
   * body
   * caption
   * label
   * button text
   * badge text
5. Uniformizează în toată aplicația:

   * dimensiuni text
   * weights
   * line-height
   * spacing
   * radius
   * shadows
   * icon containers
   * culori de status
   * chips
   * tab bar
   * headers
   * modale
   * carduri informative
   * acțiuni rapide
6. Uniformizează și conținutul textelor:

   * același stil de scriere
   * formulări consistente
   * aceeași terminologie în toată aplicația
   * aceeași structură pentru titluri, subtitluri și mesaje
7. Aplică noul sistem pe toate ecranele reale din proiect.
8. Dacă găsești componente duplicate, extrage-le.
9. Păstrează tema actuală cyan-indigo și ridică nivelul ei spre un aspect premium și coerent.

ORDINE OBLIGATORIE DE LUCRU

1. Audit global
2. Design system intern
3. Componente shared
4. Refactor ecrane pe rând
5. Uniformizare texte
6. Verificare finală că logica și funcționalitățile au rămas intacte
7. Rezumat final

FORMAT OBLIGATORIU AL RĂSPUNSULUI

1. Diagnostic global
2. Lista inconsistențelor identificate
3. Lista fișierelor noi create
4. Lista fișierelor modificate
5. Fișiere complete, copy-paste ready
6. Rezumat clar al sistemului vizual creat
7. Ce reguli de stil au fost standardizate
8. Confirmare explicită că logica și funcționalitățile nu au fost modificate
9. Ce a rămas nemodificat intenționat

IMPORTANT
Nu te limita la câteva fișiere.
Parcurge toată aplicația și uniformizează tot ce ține de UI/UX și consistență textuală.
Păstrează intactă logica aplicației și toate funcționalitățile existente.
