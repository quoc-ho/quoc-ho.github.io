async function getInfo() {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let talkNo = urlParams.get('talk');
  let title = urlParams.get('title');

  let res = await fetch(`https://researchseminars.org/api/0/lookup/talk?series_id="HKUST-AG"&series_ctr=${talkNo}`).then(res => res.json())

  if (title) {
    res.properties.speaker = `${title} ${res.properties.speaker}`;
  }
  return res.properties;
}

function makeDocument(info) {
  let dateTime = new Date(info.start_time);
  let date = dateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  let time = dateTime.toLocaleTimeString('en-US', {
    hour: "2-digit",
    minute: "2-digit"
  });
  let document = String.raw`
\documentclass[12pt, a4paper]{amsart}

\usepackage{amsmath,amssymb,amsthm,minibox,graphicx}

\setlength\parindent{0pt}
\linespread{1.05}

\newcommand{\logo}{
  \includegraphics{HKUST_logo.pdf}
}
\frenchspacing
\begin{document}
\pagenumbering{gobble}

\hspace{-1.6em}
\begin{minipage}{0.13\textwidth}
  \scalebox{0.5}{\logo}
\end{minipage}\hfill
\begin{minipage}{0.89\textwidth}
  \vspace{0.9em}
  \scalebox{1.3}{\uppercase{\textbf{\textsf{Algebra and Geometry Seminar}}}}

  \textsf{The Hong Kong University of Science and Technology}

  \textsf{Department of Mathematics}
\end{minipage}

\vspace{10em}

\scalebox{1.1}{\textbf{\textsf{${info.title}}}}

\vspace{0.5em}

\textit{by }\textsf{${info.speaker}}

\textit{from }\textsf{${info.speaker_affiliation}}
\vspace{2em}

${info.abstract}

\vspace{5em}
\begin{flushright}
  {\small
    \textsf{${info.room}}

  \textsf{${date} ${time}}}
\end{flushright}

\end{document}
  `;
  console.log('Source document:');
  console.log('--------------------------------');
  console.log(document);
  console.log('--------------------------------');
  return document;
}

async function compile(document) {
  let downloadReq = await fetch('HKUST_logo.pdf');
  let imageBlob = await downloadReq.arrayBuffer();
  globalEn.writeMemFSFile("main.tex", document);
  globalEn.writeMemFSFile("HKUST_logo.pdf", new Uint8Array(imageBlob));
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
