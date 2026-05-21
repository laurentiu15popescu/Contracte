/* Template clauze contract și anexă.
   Format clauză:
     { id, text }                  → <p>{nr}. {text}</p>      ** = bold, <ref:id/> = referință
     { id, text, items: [...] }    → <p>...</p><ul>...</ul>
     { id, render: (ctx) => JSX }  → JSX custom, dar tot numerotat (primește {numar, data})
     { id, noNum: true, ... }      → fără numerotare individuală
   Format secțiune:
     { id, titlu, clauze: [...] }
     fara_titlu: true              → fără <h3>
     fara_numerotare: true         → secțiunea nu se include în numerotare (titlul oricum apare cu prefix? — vezi shell)
*/

export const SECTIUNI_CONTRACT = [
  {
    id: "parti",
    fara_titlu: true,
    fara_numerotare: true,
    clauze: [
      {
        id: "parti-intre",
        noNum: true,
        render: () => <h3>Între</h3>,
      },
      {
        id: "parti-furnizor",
        noNum: true,
        render: () => (
          <p>
            <strong>ALUMA S.R.L.</strong>, cu sediul în Municipiul București, str. Oboga, nr. 6A, etaj 3, ap. 27, sector 6,
            înregistrată la Oficiul Registrului Comerțului sub nr. J40/8061/2024, Cod Unic de Înregistrare 49953930, cont bancar
            RO31BTRLRONCRT0CR7597701 deschis la Banca Transilvania, reprezentată de <strong>Ioana-Adriana Apostol</strong> în
            calitate de administrator, denumită în continuare <strong>Furnizor</strong>,
          </p>
        ),
      },
      {
        id: "parti-si",
        noNum: true,
        render: () => <h3 className="text-center">și</h3>,
      },
      {
        id: "parti-beneficiar",
        noNum: true,
        render: ({ data }) => {
          const ph = "..............................";
          return (
            <p>
              <strong>{data.numeBeneficiar || ph}</strong>, cu sediul/domiciliul în{" "}
              <strong>{data.sediu || ph}</strong>, nr. de ordine în Registrul Comerțului{" "}
              <strong>{data.nrRegCom || ph}</strong>, CIF/CNP <strong>{data.cui || ph}</strong>,
              reprezentată de <strong>{data.reprezentant || ph}</strong>, cont bancar nr.{" "}
              <strong>{data.iban || ph}</strong>, deschis la banca <strong>{data.banca || ph}</strong>,
              denumită în continuare <strong>Beneficiar</strong>,
            </p>
          );
        },
      },
      { id: "parti-convenit", noNum: true, render: () => <p>au convenit următoarele:</p> },
    ],
  },

  {
    id: "obiect",
    titlu: "Obiectul Contractului",
    clauze: [
      {
        id: "obiect-1",
        render: ({ numar, data }) => {
          const v = data._anyVideo;
          return (
            <p>
              <strong>{numar}.</strong> Obiectul prezentului contract îl constituie prestarea de servicii fotografice{v ? " și videografice" : ""} profesionale de către Furnizor, în cadrul evenimentelor și proiectelor organizate de Beneficiar, conform anexelor semnate de părți, în condițiile și la standardele agreate.
            </p>
          );
        },
      },
      { id: "obiect-anexe", text: "Pentru fiecare serviciu sau proiect comandat în baza prezentului contract, părțile vor stabili prin anexă, după caz, natura serviciilor solicitate, data sau perioada de desfășurare, locația, durata prestației, intervalul orar, componența echipei Furnizorului, livrabilele asumate, termenul de predare, formatul materialelor livrate, prețul și orice alte condiții particulare aplicabile proiectului respectiv." },
      { id: "obiect-diligenta", text: "Furnizorul se obligă să presteze serviciile cu diligența, atenția și profesionalismul specifice unui profesionist din domeniu, în conformitate cu standardele uzuale ale industriei și cu cerințele rezonabile comunicate de Beneficiar pentru fiecare proiect." },
      { id: "obiect-prevalare", text: "Anexele semnate de părți fac parte integrantă din prezentul contract. În cazul unor neconcordanțe între prevederile generale ale contractului și prevederile specifice cuprinse într-o anexă aferentă unui anumit proiect, prevederile anexei vor prevala exclusiv cu privire la acel proiect, în măsura în care nu derogă expres de la dispozițiile esențiale ale prezentului contract." },
    ],
  },

  {
    id: "durata",
    titlu: "Durata Contractului",
    clauze: [
      {
        id: "durata-vigoare",
        render: ({ numar, data }) => (
          <p>
            <strong>{numar}.</strong> Prezentul contract intră în vigoare la data semnării sale de către ambele părți și{" "}
            {data.tipContract === "unic" ? (
              <>este valabil până la predarea integrală a materialelor și stingerea tuturor obligațiilor de plată ale părților, conform anexei.</>
            ) : (
              <>
                este valabil până la data de <strong>{data.dataExpirare || "..............................."}</strong> și poate fi prelungit de comun acord prin semnarea unui act adițional.
              </>
            )}
          </p>
        ),
      },
      { id: "durata-supravietuire", text: "Încetarea sau expirarea prezentului contract nu va afecta executarea obligațiilor deja asumate de părți prin anexele sau comenzile confirmate anterior datei încetării, acestea urmând să se execute până la îndeplinirea integrală, cu excepția cazului în care părțile convin altfel în scris." },
    ],
  },

  {
    id: "obl-furnizor",
    titlu: "Obligațiile Furnizorului",
    clauze: [
      {
        id: "of-predare-format",
        render: ({ numar, data }) => {
          const v = data._anyVideo;
          return (
            <p>
              <strong>{numar}.</strong> Furnizorul se obligă să predea Beneficiarului materialele rezultate din prestarea serviciilor, respectiv fotografii{v ? " și/sau materiale video" : ""}, în formă finală, editată conform celor agreate de părți, pe suport digital, în formatul și la rezoluția stabilite prin prezentul contract și prin anexele aplicabile.
            </p>
          );
        },
      },
      { id: "of-informare", text: "Furnizorul are obligația de a informa Beneficiarul de îndată ce ia cunoștință despre existența oricărei împrejurări care ar putea afecta executarea serviciilor la data, în intervalul orar sau în condițiile convenite. În cazul în care Furnizorul nu se prezintă la eveniment, refuză nejustificat executarea serviciilor sau se află în imposibilitatea de a presta serviciile și nu asigură, cu acordul prealabil al Beneficiarului, un înlocuitor cu pregătire și experiență comparabile, Beneficiarul va avea dreptul să solicite daune-interese de până la 50% din valoarea serviciilor aferente proiectului sau evenimentului afectat, fără a aduce atingere dreptului de a solicita repararea integrală a prejudiciului dovedit, în condițiile legii, în măsura în care acesta depășește cuantumul menționat." },
      { id: "of-termen", text: "Furnizorul se obligă să predea imaginile finale în termenul agreat de comun acord de părți, termen care va fi specificat în anexele contractului, în funcție de particularitățile fiecărui proiect. Termenele de livrare vor fi considerate esențiale, având în vedere utilitatea comercială și de comunicare a materialelor pentru Beneficiar." },
      { id: "of-penalitati", text: "În cazul întârzierii livrării materialelor finale cu mai mult de **5 zile lucrătoare** față de termenul convenit, Beneficiarul va avea dreptul să solicite penalități de întârziere în cuantum de **0,1%** din valoarea serviciilor aferente livrării întârziate pentru fiecare zi de întârziere, fără ca valoarea totală a acestor penalități să poată depăși **10%** din valoarea respectivelor servicii." },
      {
        id: "of-echipament",
        render: ({ numar, data }) => {
          const v = data._anyVideo;
          return (
            <p>
              <strong>{numar}.</strong> Furnizorul va utiliza numai echipament fotografic{v ? " și videografic" : ""} de calitate profesională, adecvat naturii serviciilor contractate, și se obligă să asigure personal calificat și suficient pentru executarea serviciilor în condițiile și la standardele convenite cu Beneficiarul.
            </p>
          );
        },
      },
      { id: "of-program", text: "Furnizorul se obligă să respecte programul, locația, cerințele organizatorice și instrucțiunile rezonabile comunicate de Beneficiar sau de reprezentanții desemnați ai acestuia pe durata desfășurării evenimentului, în măsura în care acestea nu contravin obiectului contractului și uzanțelor profesionale aplicabile." },
      { id: "of-pastrare", text: "Furnizorul are obligația de a păstra imaginile în formă finală, pe suport digital la rezoluție mare, timp de **90 de zile calendaristice** de la data predării acestora către Beneficiar. După expirarea acestui termen, Furnizorul nu mai răspunde pentru indisponibilitatea, pierderea sau distrugerea materialelor, Beneficiarul având obligația de a-și constitui propria arhivă în interiorul termenului menționat." },
      { id: "of-remediere", text: "În cazul în care materialele livrate prezintă erori tehnice evidente, sunt incomplete față de cele asumate sau nu corespund în mod substanțial cerințelor convenite, Furnizorul va avea obligația de a remedia neconformitățile într-un termen rezonabil comunicat de Beneficiar, fără costuri suplimentare pentru acesta." },
    ],
  },

  {
    id: "obl-beneficiar",
    titlu: "Obligațiile Beneficiarului",
    pageBreakBefore: true,
    clauze: [
      { id: "ob-acces", text: "Beneficiarul se obligă să asigure, în măsura în care acest lucru depinde de el, accesul Furnizorului la locația de desfășurare a serviciilor și să pună la dispoziția acestuia informațiile și coordonatele necesare pentru executarea în condiții corespunzătoare a obligațiilor contractuale." },
      { id: "ob-plata", text: "Beneficiarul se obligă să efectueze plata în lei, pe baza facturii fiscale emise de către Furnizor, în termen de **10 zile lucrătoare** de la primirea facturii, în contul indicat de Furnizor." },
      {
        id: "ob-anulare",
        text: "În considerarea faptului că Furnizorul poate rezerva data și intervalul necesare prestării serviciilor, anularea de către Beneficiar a unui proiect sau eveniment deja confirmat va atrage obligația de plată a unei compensații, după cum urmează:",
        items: [
          "a) fără compensație, dacă anularea este notificată cu mai mult de **7 zile calendaristice** înainte de data stabilită pentru prestarea serviciilor;",
          "b) **25%** din prețul serviciilor aferente proiectului sau evenimentului respectiv, dacă anularea este notificată într-un interval mai mic de **7 zile calendaristice**, dar mai mare de **48 de ore** înainte de data stabilită;",
          "c) **50%** din prețul serviciilor aferente proiectului sau evenimentului respectiv, dacă anularea este notificată cu mai puțin de **48 de ore** înainte de data stabilită.",
        ],
      },
      { id: "ob-intarziere", text: "În cazul întârzierii plății cu mai mult de **5 zile lucrătoare** față de termenul convenit, Furnizorul va avea dreptul să solicite **penalități de întârziere în cuantum de 0,1%** din valoarea neachitată pentru fiecare zi de întârziere, fără ca valoarea totală a acestor penalități să poată depăși **10%** din suma datorată." },
    ],
  },

  {
    id: "ip",
    titlu: "Drepturile de proprietate intelectuală",
    clauze: [
      { id: "ip-titular", text: "Furnizorul este titularul drepturilor de autor asupra tuturor materialelor vizuale realizate în cadrul proiectului (fotografii, video sau alte creații), inclusiv cele realizate de colaboratori sau subcontractori implicați în executarea serviciilor." },
      { id: "licenta-utilizare", text: "Prin prezentul contract, Furnizorul acordă Beneficiarului o licență de utilizare neexclusivă, cu titlu oneros, valabilă pe durată nelimitată și pentru teritoriul nelimitat, asupra materialelor livrate, în scopuri de promovare, marketing, comunicare publică, publicitate, prezentare comercială și arhivare internă, în legătură cu activitatea, produsele, serviciile, campaniile și brandurile Beneficiarului, în orice mediu și pe orice suport, inclusiv digital, tipărit, audiovizual, online, social media, outdoor sau în materiale destinate partenerilor comerciali ai Beneficiarului." },
      { id: "ip-utilizare", text: "Beneficiarul va avea dreptul de a utiliza, reproduce, publica, distribui și adapta materialele livrate în măsura necesară scopurilor prevăzute la <ref:licenta-utilizare/>, inclusiv prin redimensionare, decupare, integrare în machete grafice, adaptare de format, montaj sau alte intervenții tehnice rezonabile necesare pentru exploatarea acestora, cu condiția de a nu denatura în mod vădit caracterul ori mesajul esențial al materialelor. Beneficiarul nu va putea cesiona către terți, cu titlu autonom, drepturile dobândite asupra materialelor, în afara cazurilor necesare executării activităților sale prin agenți, contractori, parteneri, tipografii, furnizori de servicii media sau alți colaboratori implicați în promovarea sau exploatarea legitimă a materialelor pentru Beneficiar." },
      { id: "ip-portofoliu", text: "Furnizorul va putea utiliza materialele realizate în scop de portofoliu și promovare proprie numai în măsura în care o asemenea utilizare nu aduce atingere imaginii, intereselor comerciale, confidențialității sau instrucțiunilor exprese comunicate în scris de către Beneficiar. La solicitarea scrisă a Beneficiarului, Furnizorul se obligă să se abțină de la publicarea ori utilizarea anumitor materiale sau categorii de materiale indicate în mod expres de Beneficiar." },
      { id: "ip-cesiune", text: "În cazul în care Beneficiarul solicită cesiunea exclusivă, totală sau parțială, a drepturilor patrimoniale de autor asupra materialelor realizate, o asemenea cesiune va face obiectul unui acord separat, încheiat în formă scrisă, și al unei remunerații distincte, negociate de părți." },
      { id: "ip-garantie", text: "Furnizorul garantează că deține toate drepturile, autorizațiile și acordurile necesare pentru a acorda Beneficiarului drepturile de utilizare prevăzute în prezentul contract, inclusiv în situația în care la realizarea materialelor au participat colaboratori, subcontractori sau alți terți, și va despăgubi Beneficiarul pentru orice prejudiciu rezultat din încălcarea acestei garanții." },
    ],
  },

  {
    id: "fm",
    titlu: "Forță majoră",
    clauze: [
      { id: "fm-1", text: "Forța majoră, astfel cum este definită la art. 1.351 alin. (2) din Codul civil, respectiv orice eveniment extern, imprevizibil, absolut invincibil și inevitabil, apără de răspundere partea care o invocă. Sunt asimilate forței majore, în condițiile mai sus menționate, pandemiile, restricțiile dispuse de autorități, dezastrele naturale și actele autorităților publice care fac imposibilă executarea contractului. Intervenirea cazului de forță majoră se va comunica în scris celeilalte părți, în termen de **3 zile calendaristice** de la producerea acesteia, sub sancțiunea decăderii din dreptul de a o invoca." },
      { id: "fm-2", text: "În cazul în care evenimentul de forță majoră se prelungește pentru o perioadă mai mare de **15 zile calendaristice** și executarea contractului devine imposibilă sau lipsită de utilitate pentru una dintre părți, oricare dintre părți va avea dreptul de a înceta contractul prin notificare scrisă, fără plata de despăgubiri." },
    ],
  },

  {
    id: "incetare",
    titlu: "Încetarea Contractului",
    clauze: [
      { id: "inc-expirare", text: "Prezentul contract încetează de drept la expirarea duratei pentru care a fost încheiat, dacă părțile nu convin prelungirea sa prin act adițional." },
      { id: "inc-acord", text: "Prezentul contract poate înceta oricând prin acordul scris al părților." },
      { id: "denuntare-unilaterala", text: "Oricare dintre părți poate denunța unilateral prezentul contract, prin notificare scrisă transmisă celeilalte părți cu cel puțin **15 zile calendaristice** înainte de data încetării, fără ca o asemenea denunțare să afecteze executarea obligațiilor deja asumate prin anexele, comenzile sau proiectele aflate în curs de derulare, dacă părțile nu convin altfel în scris." },
      { id: "inc-reziliere", text: "În cazul în care una dintre părți nu își execută sau își execută în mod necorespunzător obligațiile asumate prin prezentul contract, cealaltă parte va putea transmite o notificare scrisă prin care va solicita remedierea neexecutării într-un termen de **5 zile lucrătoare** de la primirea notificării. În cazul în care neexecutarea nu este remediată în termenul acordat, partea diligentă va avea dreptul de a rezilia contractul, de plin drept, fără intervenția instanței și fără îndeplinirea altor formalități, prin simpla transmitere a unei notificări scrise." },
      { id: "inc-supravietuire", text: "Încetarea prezentului contract, indiferent de cauza acesteia, nu va aduce atingere drepturilor și obligațiilor scadente anterior datei încetării și nici prevederilor care, prin natura lor, sunt destinate să producă efecte și după încetarea raporturilor contractuale, inclusiv cele referitoare la plată, răspundere, proprietate intelectuală, confidențialitate și soluționarea litigiilor." },
    ],
  },

  {
    id: "confid",
    titlu: "Confidențialitate",
    clauze: [
      { id: "cf-1", text: "Părțile se obligă să păstreze confidențialitatea tuturor informațiilor de natură comercială, tehnică sau organizatorică de care iau cunoștință în executarea prezentului contract, inclusiv, dar fără a se limita la, strategii de marketing, planuri de eveniment, concepte creative, liste de clienți, condiții comerciale și orice alte informații care nu sunt publice." },
      { id: "cf-2", text: "Furnizorul se obligă să nu divulge, să nu utilizeze și să nu pună la dispoziția unor terți informațiile confidențiale ale Beneficiarului, decât în măsura strict necesară pentru executarea prezentului contract." },
      { id: "cf-3", text: "Obligația de confidențialitate nu se aplică informațiilor care: a) sunt sau devin publice fără culpa părții care le divulgă; b) au fost legal obținute dintr-o altă sursă decât cealaltă parte; c) trebuie divulgate în baza unei obligații legale sau a unei dispoziții a unei autorități competente." },
      { id: "cf-4", text: "Obligațiile de confidențialitate prevăzute în prezentul articol rămân valabile pentru o perioadă de **3 ani** de la încetarea contractului, indiferent de cauza încetării acestuia." },
      { id: "cf-5", text: "Furnizorul se obligă să se asigure că orice colaboratori sau subcontractori implicați în executarea serviciilor respectă obligații de confidențialitate cel puțin echivalente cu cele prevăzute în prezentul contract." },
    ],
  },

  {
    id: "gdpr",
    titlu: "Protecția datelor cu caracter personal",
    clauze: [
      { id: "g-1", text: "Părțile se obligă să respecte prevederile legislației aplicabile în materia protecției datelor cu caracter personal, inclusiv ale Regulamentului (UE) 2016/679 privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal (GDPR)." },
      { id: "g-2", text: "În măsura în care, în executarea prezentului contract, Furnizorul prelucrează date cu caracter personal în numele Beneficiarului, acesta va acționa exclusiv pe baza instrucțiunilor documentate ale Beneficiarului și numai în scopul executării obligațiilor contractuale." },
      { id: "g-3", text: "Furnizorul se obligă să implementeze măsuri tehnice și organizatorice adecvate pentru protejarea datelor cu caracter personal împotriva accesului neautorizat, pierderii, distrugerii sau divulgării neautorizate." },
      { id: "g-4", text: "Furnizorul se obligă să asigure că persoanele autorizate să prelucreze datele cu caracter personal s-au angajat să respecte confidențialitatea sau au o obligație legală corespunzătoare de confidențialitate." },
      { id: "g-5", text: "În cazul în care Furnizorul constată o încălcare a securității datelor cu caracter personal, acesta va notifica Beneficiarul fără întârzieri nejustificate, furnizând toate informațiile relevante necesare pentru evaluarea și gestionarea incidentului." },
      { id: "g-6", text: "Furnizorul nu va transfera și nu va permite accesul terților la datele cu caracter personal prelucrate în baza prezentului contract fără acordul prealabil, scris, al Beneficiarului, cu excepția cazurilor prevăzute de lege." },
      { id: "g-7", text: "La încetarea prezentului contract, Furnizorul va șterge sau va returna Beneficiarului, la solicitarea acestuia, toate datele cu caracter personal prelucrate în baza contractului, cu excepția cazurilor în care păstrarea acestora este impusă de lege." },
      { id: "g-8", text: "Beneficiarul își asumă întreaga responsabilitate legală de a obține acordul prealabil, expres și neechivoc al invitaților și participanților la eveniment pentru a fi fotografiați și/sau filmați de către Furnizor, în conformitate cu prevederile Regulamentului (UE) 2016/679 (GDPR), precum și acordul acestora pentru utilizarea ulterioară a materialelor rezultate, inclusiv în portofoliul de promovare al Furnizorului, exonerând Furnizorul de orice răspundere decurgând din lipsa, nevaliditatea sau retragerea unor astfel de acorduri." },
    ],
  },

  {
    id: "finale",
    titlu: "Clauze finale",
    fara_numerotare_clauze: true,
    clauze: [
      { id: "fin-cesiune", noNum: true, text: "Niciuna dintre părți nu poate cesiona, total sau parțial, drepturile și obligațiile decurgând din prezentul contract către terți fără acordul prealabil, scris și expres al celeilalte părți, cu excepția cesiunii efectuate în cadrul unei reorganizări corporative (fuziune, divizare, transfer de afaceri) a părții cedente, situație în care cesiunea operează cu simpla notificare scrisă transmisă celeilalte părți." },
      { id: "fin-lege", noNum: true, text: "Prezentul contract este guvernat de legea română. Orice neînțelegere se va soluționa pe cale amiabilă. În caz de eșec al concilierii, competența de soluționare a litigiului aparține instanțelor judecătorești din Municipiul București." },
      {
        id: "fin-incheiat",
        noNum: true,
        render: ({ data }) => (
          <p>
            Prezentul contract a fost încheiat astăzi, <strong>{data._dataCurenta}</strong>, în 2 exemplare, câte unul pentru fiecare parte.
          </p>
        ),
      },
    ],
  },
];

// Componentă Ref folosită inline în render-uri (export pentru template)
export function Ref({ to, idMap }) {
  return <>art. {idMap?.[to] || "?"}</>;
}

// Anexă — clauze de bază (numerotare 1..N globală în secțiunea unică)
export const SECTIUNI_ANEXA = [
  {
    id: "anexa",
    fara_titlu: true,
    clauze: [
      {
        id: "ax-obiect",
        render: ({ numar, data }) => {
          const v = data._event?.includeVideo;
          return (
            <p>
              <strong>{numar}.</strong> Obiectul prezentei anexe, semnată la data de <strong>{data._dataCurenta}</strong>, îl constituie prestarea de servicii fotografice{v ? " și videografice" : ""} profesionale de către Furnizor, contra cost, în favoarea Beneficiarului.
            </p>
          );
        },
      },
      {
        id: "ax-eveniment",
        render: ({ numar, data }) => {
          const ph = "..............................";
          return (
            <p>
              <strong>{numar}.</strong> Serviciile vor fi prestate în cadrul evenimentului{" "}
              <strong>{data._event?.scop || ph}</strong> ce se desfășoară la data de{" "}
              <strong>{data._event?.dataEveniment || ph}</strong>, în{" "}
              <strong>{data._event?.locatie || ph}</strong>.
            </p>
          );
        },
      },
      {
        id: "ax-predare",
        render: ({ numar, data }) => {
          const ph = "..............................";
          const v = data._event?.includeVideo;
          return (
            <p>
              <strong>{numar}.</strong> Furnizorul se obligă să predea Beneficiarului imaginile{v ? " și materialele video" : ""} în forma finală pe suport digital la rezoluție mare, până la data de <strong>{data._event?.dataPredare || ph}</strong>.
            </p>
          );
        },
      },
      {
        id: "ax-pastrare",
        render: ({ numar, data }) => {
          const v = data._event?.includeVideo;
          return (
            <p>
              <strong>{numar}.</strong> Furnizorul are obligația de a păstra imaginile{v ? " și materialele video" : ""} în forma finală pe suport digital la rezoluție mare, timp de <strong>90 zile calendaristice</strong> de la data predării către Beneficiar. După expirarea acestui termen, Furnizorul nu mai răspunde pentru indisponibilitatea, pierderea sau distrugerea materialelor, Beneficiarul având obligația de a-și constitui propria arhivă în interiorul termenului menționat.
            </p>
          );
        },
      },
      {
        id: "ax-valoare",
        render: ({ numar, data }) => {
          const v = data._event?.includeVideo;
          return (
            <p>
              <strong>{numar}.</strong> Valoarea totală a serviciilor este de <strong>{data._budget?.valoareServicii || "......"} LEI</strong>, ce presupune valoarea serviciilor profesionale prestate în locație, prelucrarea digitală de baza a imaginilor{v ? " și a materialelor video" : ""} și costurile privind echipamentele.
            </p>
          );
        },
      },
      {
        id: "ax-cheltuieli",
        render: ({ numar, data }) => {
          const b = data._budget || {};
          const total =
            (Number(b.transport) || 0) +
            (Number(b.diurna) || 0) +
            (Number(b.cazare) || 0) +
            (Number(b.alteCheltuieli) || 0);
          if (!total) return null;
          return (
            <>
              <p>
                <strong>{numar}.</strong> Următoarele cheltuieli vor fi suportate direct de către Beneficiar, sau, după caz, vor fi rambursate de către Beneficiar Furnizorului, considerându-se efectuate în numele și pentru Beneficiar:
              </p>
              <ul>
                {Number(b.transport) > 0 && <li>cheltuieli de transport până la suma de <strong>{b.transport} LEI</strong>;</li>}
                {Number(b.diurna) > 0 && <li>diurna <strong>{b.diurna} LEI</strong>;</li>}
                {Number(b.cazare) > 0 && <li>cheltuieli pentru cazare până la suma de <strong>{b.cazare} LEI</strong>;</li>}
                {Number(b.alteCheltuieli) > 0 && <li>alte cheltuieli precum: <strong>{b.alteCheltuieli} LEI</strong>.</li>}
              </ul>
            </>
          );
        },
      },
      {
        id: "ax-observatii",
        render: ({ data }) =>
          data._event?.observatii ? (
            <p>
              <strong>Observații / Condiții particulare:</strong> {data._event.observatii}
            </p>
          ) : null,
        noNum: true,
      },
      {
        id: "ax-plata",
        render: ({ numar, data }) => (
          <p>
            <strong>{numar}.</strong> Plata se va face în lei, pe baza facturii fiscale emise de către Furnizor, în termen de <strong>{data._event?.zileIncasare || "10"} zile lucrătoare</strong> de la primirea facturii, în contul indicat de Furnizor.
          </p>
        ),
      },
    ],
  },
];
