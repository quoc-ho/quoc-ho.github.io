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
\renewcommand*\familydefault{\sfdefault}

\usepackage{amsmath,amssymb,amsthm,minibox,graphicx,tikz,qrcode}
\usepackage[table]{xcolor}
\usepackage[protrusion=true]{microtype}

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
% Banner background
\tikz[remember picture,overlay] \node[inner sep=0pt] at (current page.center){\includegraphics[width=\paperwidth,height=\paperheight]{new_page_background.png}};%
% White rectangle to cover the rest of page
\begin{tikzpicture}[remember picture, overlay]
  \fill[white, fill opacity=0.45] ([yshift=-4.89cm]current page.north west) rectangle (current page.south east);
\end{tikzpicture}%
\pagenumbering{gobble}
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