import PageMarks from "./PageMarks";
import { SECTIUNI_ANEXA } from "./contractTemplate";
import { aplicaOverrides, renderText, reactToText, ClauzaControls, AdaugaLaFinal } from "./clauzeUtils";

const dmyToIso = (s) => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s || "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

const Anexa = ({
  clientData,
  eventData,
  budgetData,
  calculeazaTotal,
  anexaNumber = 1,
  editMode = false,
  onClauzeChange,
  onDataChange,
}) => {
  const dataCurenta =
    eventData?.dataEmitere ||
    (() => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    })();
  const nrContract = clientData.numarContract || "......";

  const custom = clientData.clauzeCustom?.anexa || {};
  const { sectiuniFinale, idMap } = aplicaOverrides(SECTIUNI_ANEXA, custom);

  const ctxData = {
    ...clientData,
    _idMap: idMap,
    _dataCurenta: dataCurenta,
    _event: eventData,
    _budget: budgetData,
  };

  const setCustom = (next) => {
    if (!onClauzeChange) return;
    onClauzeChange({ ...(clientData.clauzeCustom || {}), anexa: next });
  };

  return (
    <div
      className="document-page page-break"
      contentEditable={editMode}
      suppressContentEditableWarning
      style={editMode ? { outline: "2px dashed #d4a72c" } : undefined}
    >
      <PageMarks />
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
                <img src="/subsol3.jfif" alt="Linii subsol" />
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
                <strong>{clientData.dataContract || "......"}</strong>
              </h2>
              {eventData?.scop && (
                <h3 className="text-center doc-subtitle">{eventData.scop}</h3>
              )}
              {editMode && onDataChange && (
                <div
                  className="no-print"
                  contentEditable={false}
                  style={{ textAlign: "center", margin: "4px 0 10px", fontSize: 13 }}
                >
                  Data emiterii:{" "}
                  <input
                    type="date"
                    value={dmyToIso(dataCurenta)}
                    onChange={(e) => onDataChange(e.target.value)}
                  />
                </div>
              )}

              {sectiuniFinale.map((sec) => {
                let clauzaNum = 0;
                return (
                  <div className="doc-section" key={sec.id}>
                    {!sec.fara_titlu && <h3>{sec.titlu}</h3>}
                    {sec.clauzeFinale.map((cl) => {
                      const isNumbered = !cl.noNum;
                      if (isNumbered) clauzaNum++;
                      const numarStr = isNumbered ? String(clauzaNum) : "";

                      let inner;
                      if (cl.render) {
                        inner = cl.render({ numar: numarStr, data: ctxData });
                        if (inner == null) {
                          if (isNumbered) clauzaNum--; // nu consuma un număr
                          return null;
                        }
                      } else {
                        inner = (
                          <p>
                            {isNumbered && (
                              <>
                                <strong>{numarStr}.</strong>{" "}
                              </>
                            )}
                            {renderText(cl.text, idMap)}
                          </p>
                        );
                      }

                      return (
                        <div key={cl.id}>
                          {inner}
                          {cl.items && (
                            <ul>
                              {cl.items.map((it, i) => (
                                <li key={i}>{renderText(it, idMap)}</li>
                              ))}
                            </ul>
                          )}
                          {editMode && onClauzeChange && (
                            <ClauzaControls
                              clauza={cl}
                              custom={custom}
                              onChange={setCustom}
                              isCustom={cl._custom}
                              fallbackText={reactToText(inner).replace(/^\s*\d+(\.\d+)*\.\s*/, "").trim()}
                              idMap={idMap}
                            />
                          )}
                        </div>
                      );
                    })}
                    {editMode && onClauzeChange && (
                      <AdaugaLaFinal sectiuneId={sec.id} custom={custom} onChange={setCustom} idMap={idMap} />
                    )}
                  </div>
                );
              })}

              <div className="total-highlight">Total plată: {calculeazaTotal()} LEI</div>

              <div className="doc-signatures">
                <div className="signature-box">
                  <h4>FURNIZOR</h4>
                  <p><strong>ALUMA S.R.L.</strong></p>
                  <p><strong>Ioana-Adriana Apostol</strong></p>
                  <img src="/semnatura.png" alt="Semnătură" className="sign-img" />
                  <div className="sign-space"></div>
                </div>
                <div className="signature-box">
                  <h4>BENEFICIAR</h4>
                  <p><strong>{clientData.numeBeneficiar || ".............................."}</strong></p>
                  <p><strong>{clientData.reprezentant || ".............................."}</strong></p>
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
