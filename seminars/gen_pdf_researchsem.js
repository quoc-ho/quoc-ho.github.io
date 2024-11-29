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

  let info = infos[0];
  let document = String.raw`
\documentclass[14pt, a4paper]{extarticle}

\usepackage{sansmathfonts}
%\usepackage[T1]{fontenc}
\renewcommand*\familydefault{\sfdefault}

\usepackage{amsmath,amssymb,amsthm,minibox,graphicx,tikz,qrcode}
\usetikzlibrary{fit,shadings,calc}
\usepackage[table,dvipsnames]{xcolor}
\usepackage[protrusion=true]{microtype}

\definecolor{hkustblue}{HTML}{153870}
\definecolor{hkustyellow}{HTML}{916821}

\setlength\parindent{0pt}

\newcounter{magicrownumbers}
\newcommand\rownumber{\stepcounter{magicrownumbers}\Roman{magicrownumbers}}

\newcommand{\logo}{
  \includegraphics{HKUST_logo.pdf}
}

\usepackage[
  a4paper,
  textheight=23.7cm,
  textwidth=14.3cm,
	bottom=1.5cm
]{geometry}


\frenchspacing
\begin{document}
\pagenumbering{gobble}
% Banner background
\begin{tikzpicture}[remember picture, overlay]
  % \fill[hkustblue!25] (current page.north west) rectangle (current page.south east);
  \node[inner sep=0,fit=(current page)] (cp){};
  \shade[
    upper left=hkustblue!40,
    lower left=hkustblue!85!hkustyellow!25,
    upper right=hkustblue!93!hkustyellow!23,
    lower right=hkustblue!27
  ](cp.north west) rectangle +(4.01cm,-5cm);

  \shade[
    upper left=hkustblue!93!hkustyellow!23,
    lower left=hkustblue!27,
    upper right=hkustblue!99!hkustyellow!26,
    lower right=hkustblue!27
  ]([xshift=4cm]cp.north west) rectangle +(4.01cm,-5cm);

  \shade[
    upper left=hkustblue!99!hkustyellow!26,
    lower left=hkustblue!27,
    upper right=hkustblue!87!hkustyellow!24,
    lower right=hkustblue!30
  ]([xshift=2*4cm]cp.north west) rectangle +(4.01cm,-5cm);

  \shade[
    upper left=hkustblue!87!hkustyellow!24,
    lower left=hkustblue!30,
    upper right=hkustblue!21,
    lower right=hkustblue!32
  ]([xshift=3*4cm]cp.north west) rectangle +(4.01cm,-5cm);

  \shade[
    upper left=hkustblue!21,
    lower left=hkustblue!32,
    upper right=hkustblue!84!Maroon!22,
    lower right=hkustblue!31
  ]([xshift=4*4cm]cp.north west) rectangle ([yshift=-5cm]cp.north east);
\end{tikzpicture}%
% Spiral pattern on banner
\begin{tikzpicture}[remember picture, overlay, scale=0.45]
  \newcounter{direction}

  % Initial starting point, direction, and length
  \coordinate (start) at ([xshift=4cm,yshift=-0.5cm]current page.north east);
  \def\initLength{5.}
  \def\increaseAngle{92.}
  \def\increaseLength{0.1}

  % Initialize the direction counter to zero
  \setcounter{direction}{0}

  % Loop through and draw lines with varying angles and lengths
  \foreach \i in {1,2,...,450} {
    % Calculate current direction
    \pgfmathtruncatemacro{\tempDirection}{mod(\thedirection+\increaseAngle,360)}
    \setcounter{direction}{\tempDirection}

    % Calculate the current length for the line segment
    \pgfmathsetmacro{\currentLength}{\initLength + \increaseLength*\i}

    % Compute color variation based on loop iteration
    \pgfmathsetmacro{\colorFactor}{mod(\i,451)/450}
    \pgfmathsetmacro{\colorFactorA}{1-\colorFactor/2}
    \pgfmathsetmacro{\colorFactorB}{\colorFactor/2}
    \pgfmathsetmacro{\colorFactorC}{\colorFactor*1.2}
    \definecolor{currentColor}{rgb}{\colorFactorA, \colorFactorB, \colorFactorC}

    % Draw a line
    \draw[color=currentColor, line cap=round, line width=0.5mm, draw opacity=(1-\colorFactor)/9.5] (start) -- ++(\thedirection:\currentLength) coordinate (start);
  }
\end{tikzpicture}%
% White rectangle to cover the rest of page
\begin{tikzpicture}[remember picture, overlay]
  \fill[white] ([yshift=-\paperheight/6.1]current page.north west) rectangle (current page.south east);
\end{tikzpicture}%
% Sunflower pattern
\begin{tikzpicture}[remember picture, overlay, scale=0.32]
  \node[inner sep=0,fit=(current page)] (cp){};
  \def\nbrcircles {377}
  \def\outerradius {30mm}
  \def\deviation {.9}
  \def\fudge {.62}

  \newcounter{cumulArea}
  \setcounter{cumulArea}{0}
  \pgfmathsetmacro {\goldenRatio} {(1+sqrt(5))}
  \pgfmathsetmacro {\meanArea} {pow(\outerradius * 10 / \nbrcircles, 2) * pi}
  \pgfmathsetmacro {\minArea} {\meanArea * (1 - \deviation)}
  \pgfmathsetmacro {\midArea} {\meanArea * (1 + \deviation) - \minArea}

  \foreach \b in {0,...,\nbrcircles}{
    % mod() must be used in order to calculate the right angle.
    % otherwise, when \b is greater than 28 the angle is greater
    % than 16384 and an error is raised ('Dimension too large').
    % -- thx Tonio for this one.
    \pgfmathsetmacro{\angle}{mod(\goldenRatio * \b, 2) * 180}

    \pgfmathsetmacro{\sratio}{\b / \nbrcircles}
    \pgfmathsetmacro{\smArea}{\minArea + \sratio * \midArea}
    \pgfmathsetmacro{\smRadius}{sqrt(\smArea / pi) / 2 * \fudge}
    \addtocounter{cumulArea}{\smArea};

    \pgfmathparse{sqrt(\value{cumulArea} / pi) / 2}
    \fill[color=hkustblue!78, fill opacity=(1-\sratio)/20] ([xshift=-5cm,yshift=-73cm] \angle:\pgfmathresult) circle [radius=\smRadius];
  }
\end{tikzpicture}%
\begin{minipage}{0.07\textwidth}
  \vspace{-10.2em}\hspace{-3.8em}
  \scalebox{0.11}{\logo}
\end{minipage}\hfill
\begin{minipage}{0.93\textwidth}
  \vspace{-10.2em}
  \vspace{1.2em}
  \scalebox{1.3}{\uppercase{\textbf{\textsf{Algebra and Geometry Seminar}}}}

  \scalebox{1.02}{\textsf{The Hong Kong University of Science and Technology}}

  \scalebox{1.02}{\textsf{Department of Mathematics}}
\end{minipage}

\vspace{1em}
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