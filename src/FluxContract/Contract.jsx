import PageMarks from "./PageMarks";
import { SECTIUNI_CONTRACT } from "./contractTemplate";
import { aplicaOverrides, renderText, reactToText, ClauzaControls, AdaugaLaFinal } from "./clauzeUtils";

const Contract = ({ clientData, editMode = false, onClauzeChange }) => {
  const dataCurenta =
    clientData.dataContract ||
    (() => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    })();
  const nrContract = clientData.numarContract || "......";

  const custom = clientData.clauzeCustom?.contract || {};
  const { sectiuniFinale, idMap } = aplicaOverrides(SECTIUNI_CONTRACT, custom);

  const ctxData = { ...clientData, _idMap: idMap, _dataCurenta: dataCurenta };

  const setCustom = (next) => {
    if (!onClauzeChange) return;
    onClauzeChange({ ...(clientData.clauzeCustom || {}), contract: next });
  };

  // Index secțiuni numerotate (excluzând fara_numerotare)
  let secNum = 0;

  return (
    <div
      className="document-page"
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
              <h2 className="doc-title">CONTRACT DE PRESTĂRI SERVICII FOTOGRAFICE</h2>
              <p className="doc-subtitle">
                Nr. <strong>{nrContract}</strong> / <strong>{dataCurenta}</strong>
              </p>

              {sectiuniFinale.map((sec) => {
                const showNum = !sec.fara_numerotare;
                if (showNum) secNum++;
                const secCls = "doc-section" + (sec.pageBreakBefore ? " page-break-before" : "");
                let clauzaNum = 0;
                return (
                  <div className={secCls} key={sec.id}>
                    {!sec.fara_titlu && (
                      <h3>
                        {showNum ? `${secNum}. ` : ""}
                        {sec.titlu}
                      </h3>
                    )}
                    {sec.clauzeFinale.map((cl) => {
                      const isNumbered = !cl.noNum && !sec.fara_numerotare && !sec.fara_numerotare_clauze;
                      if (isNumbered) clauzaNum++;
                      const numarStr = isNumbered ? `${secNum}.${clauzaNum}` : "";

                      let inner;
                      if (cl.render) {
                        inner = cl.render({ numar: numarStr, data: ctxData });
                        if (inner == null) return null;
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
                        <div key={cl.id} style={editMode ? { position: "relative" } : undefined}>
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

export default Contract;
