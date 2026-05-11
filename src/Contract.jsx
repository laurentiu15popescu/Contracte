const Contract = ({ clientData, editMode = false }) => {
  const dataCurenta = clientData.dataContract || (() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
  })();
  const nrContract = clientData.numarContract || "......";

  return (
    <div
      className="document-page"
      contentEditable={editMode}
      suppressContentEditableWarning
      style={editMode ? { outline: "2px dashed #d4a72c" } : undefined}
    >
      <table className="print-table">
        <thead className="print-header">
          <tr>
            <td>
              <div className="doc-header">
                <img src="/LOGO1.png" alt="Logo Aluma" />
              </div>
            </td>
          </tr>
        </thead>
        <tfoot className="print-footer">
          <tr>
            <td>
              <div className="doc-footer">
                <img src="/subsol.png" alt="Linii subsol" />
                <div className="page-number"></div>
              </div>
            </td>
          </tr>
        </tfoot>
        <tbody>
          <tr>
            <td>
              <h2 className="doc-title">
                CONTRACT DE PRESTĂRI SERVICII FOTOGRAFICE
              </h2>
              <p className="doc-subtitle">
                Nr. <strong>{nrContract}</strong> / <strong>{dataCurenta}</strong>
              </p>

              <div className="doc-section">
                <h3>Între</h3>
                <p>
                  <strong>ALUMA S.R.L.</strong>, cu sediul în Municipiul
                  București, str. Oboga, nr. 6A, etaj 3, ap. 27, sector 6,
                  înregistrată la Oficiul Registrului Comerțului sub nr.
                  J40/8061/2024, Cod Unic de Înregistrare 49953930, cont bancar
                  RO31BTRLRONCRT0CR7597701 deschis la Banca Transilvania,
                  reprezentată de <strong>Ioana-Adriana Apostol</strong> în
                  calitate de administrator, denumită în continuare{" "}
                  <strong>Furnizor</strong>,
                </p>
                <h3 className="text-center">și</h3>
                <p>
                  <strong>
                    {clientData.numeBeneficiar ||
                      ".............................."}
                  </strong>
                  , cu sediul/domiciliul în{" "}
                  <strong>
                    {clientData.sediu || ".............................."}
                  </strong>
                  , nr. de ordine în Registrul Comerțului{" "}
                  <strong>
                    {clientData.nrRegCom || ".............................."}
                  </strong>
                  , CIF/CNP{" "}
                  <strong>
                    {clientData.cui || ".............................."}
                  </strong>
                  , reprezentată de{" "}
                  <strong>
                    {clientData.reprezentant ||
                      ".............................."}
                  </strong>
                  , cont bancar nr.{" "}
                  <strong>
                    {clientData.iban || ".............................."}
                  </strong>
                  , deschis la banca{" "}
                  <strong>
                    {clientData.banca || ".............................."}
                  </strong>
                  , denumită în continuare <strong>Beneficiar</strong>,
                </p>
                <p>au convenit următoarele:</p>
              </div>

              <div className="doc-section">
                <h3>1. Obiectul Contractului</h3>
                <p>
                  <strong>1.1.</strong> Obiectul prezentului contract îl
                  constituie prestarea de servicii fotografice și videografice
                  profesionale de către Furnizor, în cadrul evenimentelor și
                  proiectelor organizate de Beneficiar, conform anexelor
                  semnate de părți, în condițiile și la standardele agreate.
                </p>
                <p>
                  <strong>1.2.</strong> Pentru fiecare serviciu sau proiect
                  comandat în baza prezentului contract, părțile vor stabili
                  prin anexă, după caz, natura serviciilor solicitate, data sau
                  perioada de desfășurare, locația, durata prestației,
                  intervalul orar, componența echipei Furnizorului, livrabilele
                  asumate, termenul de predare, formatul materialelor livrate,
                  prețul și orice alte condiții particulare aplicabile
                  proiectului respectiv.
                </p>
                <p>
                  <strong>1.3.</strong> Furnizorul se obligă să presteze
                  serviciile cu diligența, atenția și profesionalismul specifice
                  unui profesionist din domeniu, în conformitate cu standardele
                  uzuale ale industriei și cu cerințele rezonabile comunicate de
                  Beneficiar pentru fiecare proiect.
                </p>
                <p>
                  <strong>1.4.</strong> Anexele semnate de părți fac parte
                  integrantă din prezentul contract. În cazul unor neconcordanțe
                  între prevederile generale ale contractului și prevederile
                  specifice cuprinse într-o anexă aferentă unui anumit proiect,
                  prevederile anexei vor prevala exclusiv cu privire la acel
                  proiect, în măsura în care nu derogă expres de la dispozițiile
                  esențiale ale prezentului contract.
                </p>
              </div>

              <div className="doc-section">
                <h3>2. Durata Contractului</h3>
                <p>
                  <strong>2.1.</strong> Prezentul contract intră în vigoare la
                  data semnării sale de către ambele părți și{" "}
                  {clientData.dataExpirare ? (
                    <>
                      este valabil până la data de{" "}
                      <strong>{clientData.dataExpirare}</strong> și poate fi
                      prelungit de comun acord prin semnarea unui act
                      adițional.
                    </>
                  ) : clientData.tipContract === "unic" ? (
                    <>
                      este valabil până la predarea integrală a materialelor și
                      stingerea tuturor obligațiilor părților conform anexei.
                    </>
                  ) : (
                    <>
                      este încheiat pe durată nedeterminată, putând fi denunțat
                      unilateral conform art. 7.3.
                    </>
                  )}
                </p>
                <p>
                  <strong>2.2.</strong> Încetarea sau expirarea prezentului
                  contract nu va afecta executarea obligațiilor deja asumate de
                  părți prin anexele sau comenzile confirmate anterior datei
                  încetării, acestea urmând să se execute până la îndeplinirea
                  integrală, cu excepția cazului în care părțile convin altfel
                  în scris.
                </p>
              </div>

              <div className="doc-section">
                <h3>3. Obligațiile Furnizorului</h3>
                <p>
                  <strong>3.1.</strong> Furnizorul se obligă să predea
                  Beneficiarului materialele rezultate din prestarea
                  serviciilor, respectiv fotografii și/sau materiale video, în
                  formă finală, editată conform celor agreate de părți, pe
                  suport digital, în formatul și la rezoluția stabilite prin
                  prezentul contract și prin anexele aplicabile.
                </p>
                <p>
                  <strong>3.2.</strong> Furnizorul are obligația de a informa
                  Beneficiarul de îndată ce ia cunoștință despre existența
                  oricărei împrejurări care ar putea afecta executarea
                  serviciilor la data, în intervalul orar sau în condițiile
                  convenite. În cazul în care Furnizorul nu se prezintă la
                  eveniment, refuză nejustificat executarea serviciilor sau se
                  află în imposibilitatea de a presta serviciile și nu asigură,
                  cu acordul prealabil al Beneficiarului, un înlocuitor cu
                  pregătire și experiență comparabile, Beneficiarul va avea
                  dreptul să solicite daune-interese de până la 50% din valoarea
                  serviciilor aferente proiectului sau evenimentului afectat,
                  fără a aduce atingere dreptului de a solicita repararea
                  integrală a prejudiciului dovedit, în condițiile legii, în
                  măsura în care acesta depășește cuantumul menționat.
                </p>
                <p>
                  <strong>3.3.</strong> Furnizorul se obligă să predea imaginile
                  finale în termenul agreat de comun acord de părți, termen care
                  va fi specificat în anexele contractului, în funcție de
                  particularitățile fiecărui proiect. Termenele de livrare vor
                  fi considerate esențiale, având în vedere utilitatea
                  comercială și de comunicare a materialelor pentru Beneficiar.
                </p>
                <p>
                  <strong>3.4.</strong> În cazul întârzierii livrării
                  materialelor finale cu mai mult de 5 zile lucrătoare față de
                  termenul convenit, Beneficiarul va avea dreptul să solicite
                  penalități de întârziere în cuantum de 0,1% din valoarea
                  serviciilor aferente livrării întârziate pentru fiecare zi de
                  întârziere, fără ca valoarea totală a acestor penalități să
                  poată depăși 10% din valoarea respectivelor servicii.
                </p>
                <p>
                  <strong>3.5.</strong> Furnizorul va utiliza numai echipament
                  fotografic de calitate profesională, adecvate naturii
                  serviciilor contractate, și să asigure personal calificat și
                  suficient pentru executarea.
                </p>
                <p>
                  <strong>3.6.</strong> Furnizorul se obligă să respecte
                  programul, locația, cerințele organizatorice și instrucțiunile
                  rezonabile comunicate de Beneficiar sau de reprezentanții
                  desemnați ai acestuia pe durata desfășurării evenimentului, în
                  măsura în care acestea nu contravin obiectului contractului și
                  uzanțelor profesionale aplicabile.
                </p>
                <p>
                  <strong>3.7.</strong> Furnizorul are obligația de a păstra
                  imaginile în formă finală, pe suport digital la rezoluție
                  mare, timp de 90 de zile calendaristice de la data predării
                  acestora către Beneficiar.
                </p>
                <p>
                  <strong>3.8.</strong> În cazul în care materialele livrate
                  prezintă erori tehnice evidente, sunt incomplete față de cele
                  asumate sau nu corespund în mod substanțial cerințelor
                  convenite, Furnizorul va avea obligația de a remedia
                  neconformitățile într-un termen rezonabil comunicat de
                  Beneficiar, fără costuri suplimentare pentru acesta.
                </p>
              </div>

              <div className="doc-section">
                <h3>4. Obligațiile Beneficiarului</h3>
                <p>
                  <strong>4.1.</strong> Beneficiarul se obligă să asigure, în
                  măsura în care acest lucru depinde de el, accesul Furnizorului
                  la locația de desfășurare a serviciilor și să pună la
                  dispoziția acestuia informațiile și coordonatele necesare
                  pentru executarea în condiții corespunzătoare a obligațiilor
                  contractuale.
                </p>
                <p>
                  <strong>4.2.</strong> Beneficiarul se obligă să efectueze
                  plata în lei, pe baza facturii fiscale emise de către
                  Furnizor, în termen de <strong>10 zile lucrătoare</strong> de
                  la primirea facturii, în contul indicat de Furnizor.
                </p>
                <p>
                  <strong>4.3.</strong> În considerarea faptului că Furnizorul
                  poate rezerva data și intervalul necesare prestării
                  serviciilor, anularea de către Beneficiar a unui proiect sau
                  eveniment deja confirmat va atrage obligația de plată a unei
                  compensații, după cum urmează:
                </p>
                <ul>
                  <li>
                    a) fără compensație, dacă anularea este notificată cu mai
                    mult de 7 zile calendaristice înainte de data stabilită
                    pentru prestarea serviciilor;
                  </li>
                  <li>
                    b) 25% din prețul serviciilor aferente proiectului sau
                    evenimentului respectiv, dacă anularea este notificată
                    într-un interval mai mic de 7 zile calendaristice, dar mai
                    mare de 48 de ore înainte de data stabilită;
                  </li>
                  <li>
                    c) 50% din prețul serviciilor aferente proiectului sau
                    evenimentului respectiv, dacă anularea este notificată cu
                    mai puțin de 48 de ore înainte de data stabilită.
                  </li>
                </ul>
                <p>
                  <strong>4.4.</strong> În cazul întârzierii plății cu mai mult
                  de 5 zile lucrătoare față de termenul convenit, Furnizorul va
                  avea dreptul să solicite{" "}
                  <strong>penalități de întârziere în cuantum de 0,1%</strong>{" "}
                  din valoarea neachitată pentru fiecare zi de întârziere, fără
                  ca valoarea totală a acestor penalități să poată depăși 10%
                  din suma datorată.
                </p>
              </div>

              <div className="doc-section">
                <h3>5. Drepturile de proprietate intelectuală</h3>
                <p>
                  <strong>5.1.</strong> Furnizorul este titularul drepturilor de
                  autor asupra tuturor materialelor vizuale realizate în cadrul
                  proiectului (fotografii, video sau alte creații), inclusiv
                  cele realizate de colaboratori sau subcontractori implicați în
                  executarea serviciilor.
                </p>
                <p>
                  <strong>5.2.</strong> Prin prezentul contract, Furnizorul
                  acordă Beneficiarului o licență de utilizare neexclusivă, cu
                  titlu oneros, valabilă pe durată nelimitată și pentru
                  teritoriul nelimitat, asupra materialelor livrate, în scopuri
                  de promovare, marketing, comunicare publică, publicitate,
                  prezentare comercială și arhivare internă, în legătură cu
                  activitatea, produsele, serviciile, campaniile și brandurile
                  Beneficiarului, în orice mediu și pe orice suport, inclusiv
                  digital, tipărit, audiovizual, online, social media, outdoor
                  sau în materiale destinate partenerilor comerciali ai
                  Beneficiarului.
                </p>
                <p>
                  <strong>5.3.</strong> Beneficiarul va avea dreptul de a
                  utiliza, reproduce, publica, distribui și adapta materialele
                  livrate în măsura necesară scopurilor prevăzute la art. 5.2,
                  inclusiv prin redimensionare, decupare, integrare în machete
                  grafice, adaptare de format, montaj sau alte intervenții
                  tehnice rezonabile necesare pentru exploatarea acestora, cu
                  condiția de a nu denatura în mod vădit caracterul ori mesajul
                  esențial al materialelor. Beneficiarul nu va putea cesiona
                  către terți, cu titlu autonom, drepturile dobândite asupra
                  materialelor, în afara cazurilor necesare executării
                  activităților sale prin agenți, contractori, parteneri,
                  tipografii, furnizori de servicii media sau alți colaboratori
                  implicați în promovarea sau exploatarea legitimă a
                  materialelor pentru Beneficiar.
                </p>
                <p>
                  <strong>5.4.</strong> Furnizorul va putea utiliza materialele
                  realizate în scop de portofoliu și promovare proprie numai în
                  măsura în care o asemenea utilizare nu aduce atingere
                  imaginii, intereselor comerciale, confidențialității sau
                  instrucțiunilor exprese comunicate în scris de către
                  Beneficiar. La solicitarea scrisă a Beneficiarului, Furnizorul
                  se obligă să se abțină de la publicarea ori utilizarea
                  anumitor materiale sau categorii de materiale indicate în mod
                  expres de Beneficiar.
                </p>
                <p>
                  <strong>5.5.</strong> În cazul în care Beneficiarul solicită
                  cesiunea exclusivă, totală sau parțială, a drepturilor
                  patrimoniale de autor asupra materialelor realizate, o
                  asemenea cesiune va face obiectul unui acord separat, încheiat
                  în formă scrisă, și al unei remunerații distincte, negociate
                  de părți.
                </p>
                <p>
                  <strong>5.6.</strong> Furnizorul garantează că deține toate
                  drepturile, autorizațiile și acordurile necesare pentru a
                  acorda Beneficiarului drepturile de utilizare prevăzute în
                  prezentul contract, inclusiv în situația în care la realizarea
                  materialelor au participat colaboratori, subcontractori sau
                  alți terți, și va despăgubi Beneficiarul pentru orice
                  prejudiciu rezultat din încălcarea acestei garanții.
                </p>
              </div>

              <div className="doc-section">
                <h3>6. Forță majoră</h3>
                <p>
                  <strong>6.1.</strong> Forța majoră, uzual definită, apără de
                  răspundere partea care o invocă. Intervenirea cazului de forță
                  majoră se va comunica în scris celeilalte părți, în termen de
                  3 zile de la producerea acesteia.
                </p>
                <p>
                  <strong>6.2.</strong> În cazul în care evenimentul de forță
                  majoră se prelungește pentru o perioadă mai mare de 15 zile
                  calendaristice și executarea contractului devine imposibilă
                  sau lipsită de utilitate pentru una dintre părți, oricare
                  dintre părți va avea dreptul de a înceta contractul prin
                  notificare scrisă, fără plata de despăgubiri.
                </p>
              </div>

              <div className="doc-section">
                <h3>7. Încetarea Contractului</h3>
                <p>
                  <strong>7.1.</strong> Prezentul contract încetează de drept la
                  expirarea duratei pentru care a fost încheiat, dacă părțile nu
                  convin prelungirea sa prin act adițional.
                </p>
                <p>
                  <strong>7.2.</strong> Prezentul contract poate înceta oricând
                  prin acordul scris al părților.
                </p>
                <p>
                  <strong>7.3.</strong> Oricare dintre părți poate denunța
                  unilateral prezentul contract, prin notificare scrisă
                  transmisă celeilalte părți cu cel puțin 15 zile calendaristice
                  înainte de data încetării, fără ca o asemenea denunțare să
                  afecteze executarea obligațiilor deja asumate prin anexele,
                  comenzile sau proiectele aflate în curs de derulare, dacă
                  părțile nu convin altfel în scris.
                </p>
                <p>
                  <strong>7.4.</strong> În cazul în care una dintre părți nu își
                  execută sau își execută în mod necorespunzător obligațiile
                  asumate prin prezentul contract, cealaltă parte va putea
                  transmite o notificare scrisă prin care va solicita remedierea
                  neexecutării într-un termen de 5 zile lucrătoare de la
                  primirea notificării. În cazul în care neexecutarea nu este
                  remediată în termenul acordat, partea diligentă va avea
                  dreptul de a rezilia contractul, de plin drept, fără
                  intervenția instanței și fără îndeplinirea altor formalități,
                  prin simpla transmitere a unei notificări scrise.
                </p>
                <p>
                  <strong>7.5.</strong> Încetarea prezentului contract,
                  indiferent de cauza acesteia, nu va aduce atingere drepturilor
                  și obligațiilor scadente anterior datei încetării și nici
                  prevederilor care, prin natura lor, sunt destinate să producă
                  efecte și după încetarea raporturilor contractuale, inclusiv
                  cele referitoare la plată, răspundere, proprietate
                  intelectuală, confidențialitate și soluționarea litigiilor.
                </p>
              </div>

              <div className="doc-section">
                <h3>8. Confidențialitate</h3>
                <p>
                  <strong>8.1.</strong> Părțile se obligă să păstreze
                  confidențialitatea tuturor informațiilor de natură comercială,
                  tehnică sau organizatorică de care iau cunoștință în
                  executarea prezentului contract, inclusiv, dar fără a se
                  limita la, strategii de marketing, planuri de eveniment,
                  concepte creative, liste de clienți, condiții comerciale și
                  orice alte informații care nu sunt publice.
                </p>
                <p>
                  <strong>8.2.</strong> Furnizorul se obligă să nu divulge, să
                  nu utilizeze și să nu pună la dispoziția unor terți
                  informațiile confidențiale ale Beneficiarului, decât în măsura
                  strict necesară pentru executarea prezentului contract.
                </p>
                <p>
                  <strong>8.3.</strong> Obligația de confidențialitate nu se
                  aplică informațiilor care: a) sunt sau devin publice fără
                  culpa părții care le divulgă; b) au fost legal obținute
                  dintr-o altă sursă decât cealaltă parte; c) trebuie divulgate
                  în baza unei obligații legale sau a unei dispoziții a unei
                  autorități competente.
                </p>
                <p>
                  <strong>8.4.</strong> Obligațiile de confidențialitate
                  prevăzute în prezentul articol rămân valabile pentru o
                  perioadă de 3 ani de la încetarea contractului, indiferent de
                  cauza încetării acestuia.
                </p>
                <p>
                  <strong>8.5.</strong> Furnizorul se obligă să se asigure că
                  orice colaboratori sau subcontractori implicați în executarea
                  serviciilor respectă obligații de confidențialitate cel puțin
                  echivalente cu cele prevăzute în prezentul contract.
                </p>
              </div>

              <div className="doc-section">
                <h3>9. Protecția datelor cu caracter personal</h3>
                <p>
                  <strong>9.1.</strong> Părțile se obligă să respecte
                  prevederile legislației aplicabile în materia protecției
                  datelor cu caracter personal, inclusiv ale Regulamentului (UE)
                  2016/679 privind protecția persoanelor fizice în ceea ce
                  privește prelucrarea datelor cu caracter personal (GDPR).
                </p>
                <p>
                  <strong>9.2.</strong> În măsura în care, în executarea
                  prezentului contract, Furnizorul prelucrează date cu caracter
                  personal în numele Beneficiarului, acesta va acționa exclusiv
                  pe baza instrucțiunilor documentate ale Beneficiarului și
                  numai în scopul executării obligațiilor contractuale.
                </p>
                <p>
                  <strong>9.3.</strong> Furnizorul se obligă să implementeze
                  măsuri tehnice și organizatorice adecvate pentru protejarea
                  datelor cu caracter personal împotriva accesului neautorizat,
                  pierderii, distrugerii sau divulgării neautorizate.
                </p>
                <p>
                  <strong>9.4.</strong> Furnizorul se obligă să asigure că
                  persoanele autorizate să prelucreze datele cu caracter
                  personal s-au angajat să respecte confidențialitatea sau au o
                  obligație legală corespunzătoare de confidențialitate.
                </p>
                <p>
                  <strong>9.5.</strong> În cazul în care Furnizorul constată o
                  încălcare a securității datelor cu caracter personal, acesta
                  va notifica Beneficiarul fără întârzieri nejustificate,
                  furnizând toate informațiile relevante necesare pentru
                  evaluarea și gestionarea incidentului.
                </p>
                <p>
                  <strong>9.6.</strong> Furnizorul nu va transfera și nu va
                  permite accesul terților la datele cu caracter personal
                  prelucrate în baza prezentului contract fără acordul
                  prealabil, scris, al Beneficiarului, cu excepția cazurilor
                  prevăzute de lege.
                </p>
                <p>
                  <strong>9.7.</strong> La încetarea prezentului contract,
                  Furnizorul va șterge sau va returna Beneficiarului, la
                  solicitarea acestuia, toate datele cu caracter personal
                  prelucrate în baza contractului, cu excepția cazurilor în care
                  păstrarea acestora este impusă de lege.
                </p>
                <p>
                  <strong>9.8.</strong> Beneficiarul își asumă întreaga
                  responsabilitate legală de a obține acordul prealabil, expres
                  și neechivoc al invitaților și participanților la eveniment
                  pentru a fi fotografiați și/sau filmați de către Furnizor, în
                  conformitate cu prevederile Regulamentului (UE) 2016/679
                  (GDPR), precum și acordul acestora pentru utilizarea
                  ulterioară a materialelor rezultate, inclusiv în portofoliul
                  de promovare al Furnizorului, exonerând Furnizorul de orice
                  răspundere decurgând din lipsa, nevaliditatea sau retragerea
                  unor astfel de acorduri.
                </p>
              </div>

              <div className="doc-section">
                <h3>10. Clauze finale</h3>
                <p>
                  Prezentul contract este guvernat de legea română. Orice
                  neînțelegere se va soluționa pe cale amiabilă. În caz de eșec
                  al concilierii, competența de soluționare a litigiului
                  aparține instanțelor judecătorești din Municipiul București.
                </p>
                <p>
                  Prezentul contract a fost încheiat astăzi,{" "}
                  <strong>{dataCurenta}</strong>, în 2 exemplare, câte unul
                  pentru fiecare parte.
                </p>
              </div>

              <div className="doc-signatures">
                <div className="signature-box">
                  <h4>FURNIZOR</h4>
                  <p>
                    <strong>ALUMA S.R.L.</strong>
                  </p>
                  <p>
                    <strong>Ioana-Adriana Apostol</strong>
                  </p>
                  <div className="sign-space"></div>
                </div>
                <div className="signature-box">
                  <h4>BENEFICIAR</h4>
                  <p>
                    <strong>
                      {clientData.numeBeneficiar ||
                        ".............................."}
                    </strong>
                  </p>
                  <p>
                    <strong>
                      {clientData.reprezentant ||
                        ".............................."}
                    </strong>
                  </p>
                  <div className="sign-space"></div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Contract;
