async function compile(document) {
  let response = await fetch('https://latex.ytotech.com/builds/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      compiler: "pdflatex",
      resources: [
        {
          main: true,
          content: document,
        },
        {
          "path": "HKUST_logo.pdf",
          "url": "https://quocho.com/seminars/HKUST_logo.pdf"
        },
        {
          "path": "page_background_600.jpeg",
          "url": "https://quocho.com/seminars/page_background_600.jpeg"
        }
      ],
    })
  });
  let blob = await response.blob();
  let url = URL.createObjectURL(blob);

  return url;
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

async function zipContent(source) {
  let zip = new JSZip();
  let logo = await fetch('https://quocho.com/seminars/HKUST_logo.pdf').then(res => res.blob());
  let background = await fetch('https://quocho.com/seminars/page_background_600.jpeg').then(res => res.blob());
  zip.file("AGSeminar.tex", source);
  zip.file('HKUST_logo.pdf', logo);
  zip.file('page_background_600.jpeg', background);
  let zipBlob = await zip.generateAsync({ type: "blob" });
  let zipBase64 = await blobToBase64(zipBlob);

  return zipBase64;
}

function toOverleaf(base64Content) {
  document.getElementById("overleaf_data").value = base64Content;
  document.getElementById("overleaf_form").hidden = false;
}

function blobToBase64(blob) {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};


async function doIt() {
  let info = await getInfo();
  let document = makeDocument(info);
  let base64Content = await zipContent(document);
  toOverleaf(base64Content);
  let url = await compile(document);
  insertPdfLink(url);
}

(function () {
  'use strict';

  doIt();
})();