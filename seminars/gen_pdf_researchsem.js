async function getInfo() {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let talkNos = urlParams.get('talk');
  let title = urlParams.get('title');

  let infosPromise = talkNos.split(',')
    .map(async talkNo => await fetch(`https://researchseminars.org/api/0/lookup/talk?series_id="HKUST-AG"&series_ctr=${talkNo}`).then(res => res.json()));

  let infos = (await Promise.all(infosPromise)).map(res => res.properties);
  console.log(infos);

  if (title) {
    infos.forEach(info => info.speaker = `${title} ${info.speaker}`);
  }

  if (infos.length > 1 && infos[0].comments != '') {
    infos[0].title = infos[0].comments;
  }

  return infos;
}

function formatDateTime(dateTime) {
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

  return { date: date, time: time };
}

function makeDocument(infos) {
  let isSeries = infos.length > 1;
  let lastUpdate = formatDateTime(infos.map(info => new Date(info.edited_at)).sort((a, b) => b - a)[0]);
  let now = formatDateTime(new Date());

  let coords = infos.map(info => {
    let dateTime = new Date(info.start_time);
    let formattedDateTime = formatDateTime(dateTime);

    return { room: info.room, date: formattedDateTime.date, time: formattedDateTime.time };
  });

  let coordsString =
    coords
      .map(coord =>
        String.raw`${isSeries ? String.raw`\rownumber &` : ''} ${coord.room} & ${coord.date} ${coord.time}`
      )
      .join(String.raw`\\ \hline`);

  let coordsTable = String.raw`
\begin{table}[h]
  \begin{flushright}
    {\small\ttfamily
      \begin{tabular}{${isSeries ? '@{}r|lr@{}' : '@{}lr@{}'}}
        \arrayrulecolor{black!18}
        ${coordsString}
      \end{tabular}
    }
  \end{flushright}
\end{table}
  `;

  let qrCodes = infos.map(info => info.seminar_ctr).map(seminarCtr => String.raw`\qrcode{researchseminars.org/talk/HKUST-AG/${seminarCtr}}`).join(String.raw`\hspace{1.7em}`);
  let genDateTime = formatDateTime(new Date());

  let info = infos[0];
  let document = String.raw`
\documentclass[14pt, a4paper]{extarticle}

\usepackage{sansmathfonts}
%\usepackage[T1]{fontenc}
\renewcommand*\familydefault{\sfdefault}

\usepackage{amsmath,amssymb,amsthm,minibox,graphicx,tikz,qrcode}
\usepackage[table]{xcolor}
\usepackage[protrusion=true]{microtype}

\definecolor{hkustblue}{HTML}{153870}

\setlength\parindent{0pt}

\newcounter{magicrownumbers}
\newcommand\rownumber{\stepcounter{magicrownumbers}\Roman{magicrownumbers}}

\newcommand{\logo}{
  \includegraphics{HKUST_logo.pdf}
}

\usepackage[
  a4paper,
  textheight=23.7cm,
  textwidth=14.15cm,
	bottom=1.5cm
]{geometry}


\frenchspacing
\begin{document}
\pagenumbering{gobble}

\begin{tikzpicture}[remember picture, overlay]
  \fill[hkustblue!25] (current page.north west) rectangle ([yshift=-\paperheight/6.1]current page.north east);
\end{tikzpicture}

\begin{minipage}{0.07\textwidth}
  \vspace{-12.5em}\hspace{-3.5em}
  \scalebox{0.11}{\logo}
\end{minipage}\hfill
\begin{minipage}{0.93\textwidth}
  \vspace{-12.5em}
  \vspace{1.2em}
  \scalebox{1.3}{\uppercase{\textbf{\textsf{Algebra and Geometry Seminar}}}}

  \scalebox{1.05}{\textsf{The Hong Kong University of Science and Technology}}

  \scalebox{1.105}{\textsf{Department of Mathematics}}
\end{minipage}

\textbf{\textsf{${info.title}}}

\vspace{0.2em}

{\itshape\rmfamily by }\textsf{${info.speaker}}

{\itshape\rmfamily from }\textsf{${info.speaker_affiliation}}
\vspace{1em}

{
\setlength\parskip{3.5pt}
${info.abstract}
\setlength\parskip{0pt}
}

\vspace{0.4em}
${coordsTable}
\begin{flushright}
  \vspace{-1.5em}
  ${qrCodes}
\end{flushright}
\vfill
{\tiny\ttfamily\color{black!9}  Last updated at ${lastUpdate.time} on ${lastUpdate.date}. Generated at ${now.time} on ${now.date}.}
\end{document}
  `;
  console.log('Source document:');
  console.log('--------------------------------');
  console.log(document);
  console.log('--------------------------------');
  return document;
}

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
  let logo = await fetch('https://quocho.com/seminars/HKUST_logo.pdf').then(res => res.blob())
  zip.file("AGSeminar.tex", source);
  zip.file('HKUST_logo.pdf', logo);
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