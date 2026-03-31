/**
 * Detects if click was made with Ctrl/Cmd pressed
 * @param {React.MouseEvent} event - The mouse event
 * @returns {boolean} true if it was Ctrl/Cmd+Click
 */
export const isCtrlOrCmdClick = (event) => {
  return event.ctrlKey || event.metaKey;
};

/**
 * Gets the full URL of the site
 * @returns {string} The base URL of the site
 */
const getBaseUrl = () => {
  return window.location.origin;
};

/**
 * Handles navigation with Ctrl+Click support
 * Opens in a new tab if Ctrl/Cmd+Click, otherwise performs normal navigation
 * @param {React.MouseEvent} event - The mouse event
 * @param {string} path - The route to navigate to (e.g.: '/inventory/items/123')
 * @param {Function} navigate - React Router navigate function
 */
export const handleNavigationClick = (event, path, navigate) => {
  if (isCtrlOrCmdClick(event)) {
    event.preventDefault();
    const fullUrl = `${getBaseUrl()}${path}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  } else {
    navigate(path);
  }
};

/**
 * Handles navigation with Ctrl+Click support, including state
 * Opens in a new tab if Ctrl/Cmd+Click, otherwise performs normal navigation with state
 * @param {React.MouseEvent} event - The mouse event
 * @param {string} path - The route to navigate to (e.g.: '/inventory/items/123')
 * @param {Object} state - The state to pass to navigation
 * @param {Function} navigate - React Router navigate function
 */
export const handleNavigationClickWithState = (event, path, state, navigate) => {
  if (isCtrlOrCmdClick(event)) {
    event.preventDefault();
    const fullUrl = `${getBaseUrl()}${path}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  } else {
    navigate(path, { state });
  }
};

/**
 * Opens a file in a new tab
 * Clicks on image/document previews always open in a new tab
 * @param {React.MouseEvent} event - The mouse event
 * @param {string} fileUrl - The URL of the file to open
 * @param {Object} options - Additional options
 * @param {string} options.fileName - Preferred file name for tab title and downloads
 * @param {string} options.contentType - MIME type used to improve preview rendering
 */
export const handleFileOpenClick = (event, fileUrl, options = {}) => {
  event.preventDefault();

  if (!fileUrl) return;

  const fileName = options.fileName || 'archivo';
  const contentType = (options.contentType || '').toLowerCase();
  const isImage = contentType.startsWith('image/');

  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const safeTitle = escapeHtml(fileName);
  const safeFileUrl = encodeURI(fileUrl);

  const viewerMarkup = isImage
    ? `<img src="${safeFileUrl}" alt="${safeTitle}" style="max-width:100%; max-height:100vh; object-fit:contain; display:block; margin:auto;" />`
    : `<iframe src="${safeFileUrl}" title="${safeTitle}" style="width:100%; height:100%; border:0;"></iframe>`;

  const viewerHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #f5f7fa; }
    .viewer { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="viewer">${viewerMarkup}</div>
  <script>
    (function () {
      var fileUrl = ${JSON.stringify(fileUrl)};
      var fileName = ${JSON.stringify(fileName)};

      function downloadFile() {
        var link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      document.addEventListener('keydown', function (event) {
        var key = (event.key || '').toLowerCase();
        if ((event.ctrlKey || event.metaKey) && key === 's') {
          event.preventDefault();
          downloadFile();
        }
      });
    }());
  </script>
</body>
</html>`;

  const viewerBlob = new Blob([viewerHtml], { type: 'text/html' });
  const viewerUrl = URL.createObjectURL(viewerBlob);

  const opened = window.open(viewerUrl, '_blank', 'noopener,noreferrer');

  // Fallback if the browser blocks popup opening.
  if (!opened) {
    URL.revokeObjectURL(viewerUrl);
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // Give the new tab time to load the blob URL before cleanup.
  setTimeout(() => {
    URL.revokeObjectURL(viewerUrl);
  }, 60000);
};
