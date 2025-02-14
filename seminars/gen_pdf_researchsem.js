async function getResources() {
  let logo = await fetch('HKUST_logo.pdf').then(res => res.arrayBuffer());
  let background = await fetch('page_background_600.jpeg').then(res => res.arrayBuffer());
  return { logo: logo, background: background };
}

async function compile(document, resources) {
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
          "file": arrayBufferToBase64(resources.logo)
        },
        {
          "path": "page_background_600.jpeg",
          "file": arrayBufferToBase64(resources.background)
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

async function zipContentBase64(source, resources) {
  let zip = new JSZip();
  let logo = new Blob([resources.logo]);
  let background = new Blob([resources.background]);
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

function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}


async function doIt() {
  let info = await getInfo();
  let resources = await getResources()
  let document = makeDocument(info);
  let base64Content = await zipContentBase64(document, resources);
  toOverleaf(base64Content);
  let url = await compile(document, resources);
  insertPdfLink(url);
}

(function () {
  'use strict';

  doIt();
})();