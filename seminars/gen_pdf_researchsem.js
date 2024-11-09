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

function makeDocument(infos) {
  let isSeries = infos.length > 1;
  let coords = infos.map(info => {
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

    return { room: info.room, date: date, time: time };
  });

  let coordsString =
    coords
      .map(coord =>
        String.raw`${isSeries ? String.raw`\rownumber &` : ''} ${coord.room} & ${coord.date} & ${coord.time}`
      )
      .join(String.raw`\\`);

  let coordsTable = String.raw`
\begin{table}[h]
  \begin{flushright}
    {\small\ttfamily
      \begin{tabular}{${isSeries ? 'r|lrr' : 'lrr'}}
        ${coordsString}
      \end{tabular}
    }
  \end{flushright}
\end{table}
  `;

  let info = infos[0];
  let document = String.raw`
\documentclass[14pt, a4paper]{extarticle}

\usepackage{amsmath,amssymb,amsthm,minibox,graphicx,xcolor,tikz}

\definecolor{hkustblue}{HTML}{153870}

\setlength\parindent{0pt}

\newcounter{magicrownumbers}
\newcommand\rownumber{\stepcounter{magicrownumbers}\Roman{magicrownumbers}}

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
  \vspace{-12.5em}\hspace{-3.5em}
  \scalebox{0.105}{\logo}
\end{minipage}\hfill
\begin{minipage}{0.93\textwidth}
  \vspace{-12.5em}
  \vspace{1.2em}
  \scalebox{1.35}{\uppercase{\textbf{\textsf{Algebra and Geometry Seminar}}}}

  \textsf{The Hong Kong University of Science and Technology}

  \textsf{Department of Mathematics}
\end{minipage}

\vspace{1.5em}

\textbf{\textsf{${info.title}}}

\vspace{0.2em}

\textit{by }\textsf{${info.speaker}}

\textit{from }\textsf{${info.speaker_affiliation}}
\vspace{1em}

{
\setlength\parskip{3.5pt}
{${info.abstract}}
\setlength\parskip{0pt}
}

\vspace{1.5em}
${coordsTable}

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

async function doIt() {
  let info = await getInfo();
  let document = makeDocument(info);
  let url = await compile(document);
  insertPdfLink(url);
}

(function () {
  'use strict';

  // getPdfLink().then(link => insertPdfLink(link));

  doIt();
})();