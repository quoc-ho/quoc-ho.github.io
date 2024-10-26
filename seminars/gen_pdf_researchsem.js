// ==UserScript==
// @name         Research Seminar Pdf Generator
// @namespace    http://tampermonkey.net/
// @version      2024-10-26
// @description  try to take over the world!
// @author       You
// @match        https://researchseminars.org/talk/HKUST-AG/*
// @grant        none
// ==/UserScript==

async function getInfo() {
  const talkNo = window.location.hash.substring(1);
  const regex = /talk\/([^\/]+)\/(\d+)/;

  let res = await fetch(`https://researchseminars.org/api/0/lookup/talk?series_id="HKUST-AG"&series_ctr=${talkNo}`).then(res => res.json())
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

\usepackage{amsmath,amssymb,amsthm,tikz}

\setlength\parindent{0pt}
\linespread{1.05}

\begin{document}
\pagenumbering{gobble}
% \maketitle

\scalebox{1.4}{\uppercase{\textbf{\textsf{Algebra and Geometry Seminar}}}}

\textsf{The Hong Kong University of Science and Technology}

\textsf{Department of Mathematics}

\vspace{8em}

\vspace{2em}

\textbf{\textsf{${info.title}}}

\vspace{0.5em}

\textit{by }\textsf{${info.speaker}}

\textit{from }\textsf{${info.speaker_affiliation}}
\vspace{2em}

${info.abstract}

\vspace{5em}
\begin{flushright}
  {\small
    \textsf{Room ${info.room}}

  \textsf{${date} ${time}}}
\end{flushright}
\end{document}
  `;
  return document;
}

async function getPdfLink() {
  let info = await getInfo();
  let document = makeDocument(info);
  let url = `https://latexonline.cc/compile?text=${document}`;
  let encodedUrl = encodeURI(url);
  return encodedUrl;
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

(function () {
  'use strict';

  getPdfLink().then(link => insertPdfLink(link));
})();