async function compile(document) {
  let logo = await fetch('HKUST_logo.pdf').then(res => res.arrayBuffer());
  let background = await fetch('page_background_600.jpeg').then(res => res.arrayBuffer());
  globalEn.writeMemFSFile("main.tex", document);
  globalEn.writeMemFSFile("HKUST_logo.pdf", new Uint8Array(logo));
  globalEn.writeMemFSFile("page_background_600.jpeg", new Uint8Array(background));
  globalEn.setEngineMainFile("main.tex");
  let r = await globalEn.compileLaTeX();
  console.log(r.log);

  if (r.status === 0) {
    const pdfblob = new Blob([r.pdf], { type: 'application/pdf' });
    const objectURL = URL.createObjectURL(pdfblob);
    setTimeout(() => {
      URL.revokeObjectURL(objectURL);
    }, 30000);
    return objectURL;
  }
}
function insertPdfLink(url) {
  let link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.textContent = 'Get PDF of the announcement';
  document.body.appendChild(link)

  let pdfViewer = document.createElement('embed')
  pdfViewer.src = url;
  pdfViewer.width = '100%';
  pdfViewer.height = '95%';
  document.body.appendChild(pdfViewer);
}

async function doIt() {
  let info = await getInfo();
  let document = makeDocument(info);
  let url = await compile(document);
  insertPdfLink(url);
}

const globalEn = new PdfTeXEngine();

(function () {
  'use strict';

  async function init() {
    await globalEn.loadEngine();
    doIt()
  }

  init();
})();
