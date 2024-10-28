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
\documentclass[14pt, a4paper]{extarticle}

\usepackage{amsmath,amssymb,amsthm,minibox,graphicx,xcolor,tikz}

\definecolor{hkustblue}{HTML}{153870}

\setlength\parindent{0pt}
\linespread{1.05}

\newcommand{\logo}{
  \includegraphics{HKUST_logo.pdf}
}
\frenchspacing
\begin{document}
\pagenumbering{gobble}

\begin{tikzpicture}[remember picture, overlay]
  \fill[hkustblue!10] (current page.north west) rectangle ([yshift=-\paperheight/5.8]current page.north east);
\end{tikzpicture}

\begin{minipage}{0.07\textwidth}
  \vspace{-12.5em}\hspace{-3.8em}
  \scalebox{0.11}{\logo}
\end{minipage}\hfill
\begin{minipage}{0.93\textwidth}
  \vspace{-12.5em}
  \vspace{1.2em}
  \scalebox{1.35}{\uppercase{\textbf{\textsf{Algebra and Geometry Seminar}}}}

  \textsf{The Hong Kong University of Science and Technology}

  \textsf{Department of Mathematics}
\end{minipage}

\vspace{5em}

\textbf{\textsf{${info.title}}}

\vspace{0.2em}

\textit{by }\textsf{${info.speaker}}

\textit{from }\textsf{${info.speaker_affiliation}}
\vspace{1em}

${info.abstract}

\vspace{3.5em}
\begin{flushright}
  {\small
    \textsf{\textbf{${info.room}}}

  \textsf{\textbf{${date} ${time}}}}
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
