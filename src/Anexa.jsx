const Anexa = ({ clientData, eventData, budgetData, calculeazaTotal, anexaNumber = 1, editMode = false }) => {
  const dataCurenta = clientData.dataContract || (() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
  })();
  const nrContract = clientData.numarContract || "......";

  return (
    <div
      className="document-page page-break"
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
                Anexa nr. {anexaNumber} la contractul nr. <strong>{nrContract}</strong> din{" "}
                <strong>{dataCurenta}</strong>
              </h2>
              <h3 className="text-center doc-subtitle">Comandă fermă client</h3>

              <div className="doc-section">
                <p>
                  <strong>1.</strong> Obiectul prezentei anexe îl constituie
                  prestarea de servicii fotografice și videografice
                  profesionale de către Furnizor, contra cost, în favoarea
                  Beneficiarului, la data de <strong>{dataCurenta}</strong>.
                </p>
                <p>
                  <strong>2.</strong> Serviciile vor fi prestate în cadrul
                  evenimentului{" "}
                  <strong>
                    {eventData.scop || ".............................."}
                  </strong>{" "}
                  ce se desfășoară la data de{" "}
                  <strong>
                    {eventData.dataEveniment ||
                      ".............................."}
                  </strong>
                  , în{" "}
                  <strong>
                    {eventData.locatie || ".............................."}
                  </strong>
                  .
                </p>
                <p>
                  <strong>3.</strong> Furnizorul se obligă să predea
                  Beneficiarului imaginile în forma finală pe suport digital la
                  rezoluție mare, până la data de{" "}
                  <strong>
                    {eventData.dataPredare || ".............................."}
                  </strong>
                  .
                </p>
                <p>
                  <strong>4.</strong> Furnizorul are obligația de a păstra
                  imaginile în forma finală pe suport digital la rezoluție
                  mare, timp de 90 zile de la data predării către Beneficiar.
                </p>
              </div>

              <div className="doc-section">
                <p>
                  <strong>5.</strong> Valoarea totală a serviciilor este de{" "}
                  <strong>{budgetData.valoareServicii || "......"} LEI</strong>,
                  ce presupune valoarea serviciilor profesionale prestate în
                  locație, prelucrarea digitală de baza a imaginilor și
                  costurile privind echipamentele.
                </p>

                {(Number(budgetData.transport) ||
                  Number(budgetData.diurna) ||
                  Number(budgetData.cazare) ||
                  Number(budgetData.alteCheltuieli)) > 0 && (
                  <>
                    <p>
                      <strong>6.</strong> Următoarele cheltuieli vor fi
                      suportate direct de către
                      Beneficiar, sau, după caz, vor fi rambursate de către
                      Beneficiar Furnizorului, considerându-se efectuate în
                      numele și pentru Beneficiar:
                    </p>
                    <ul>
                      {Number(budgetData.transport) > 0 && (
                        <li>
                          cheltuieli de transport până la suma de{" "}
                          <strong>{budgetData.transport} LEI</strong>;
                        </li>
                      )}
                      {Number(budgetData.diurna) > 0 && (
                        <li>
                          diurna <strong>{budgetData.diurna} LEI</strong>;
                        </li>
                      )}
                      {Number(budgetData.cazare) > 0 && (
                        <li>
                          cheltuieli pentru cazare până la suma de{" "}
                          <strong>{budgetData.cazare} LEI</strong>;
                        </li>
                      )}
                      {Number(budgetData.alteCheltuieli) > 0 && (
                        <li>
                          alte cheltuieli precum:{" "}
                          <strong>{budgetData.alteCheltuieli} LEI</strong>.
                        </li>
                      )}
                    </ul>
                  </>
                )}
                {eventData.observatii && (
                  <p>
                    <strong>Observații / Condiții particulare:</strong>{" "}
                    {eventData.observatii}
                  </p>
                )}

                <p>
                  <strong>7.</strong> Plata se va face în lei, pe baza facturii
                  fiscale emise de către Furnizor, în termen de{" "}
                  <strong>10 zile lucrătoare</strong> de la primirea facturii,
                  în contul indicat de Furnizor.
                </p>

                <div className="total-highlight">
                  Total plată: {calculeazaTotal()} LEI
                </div>
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

export default Anexa;
