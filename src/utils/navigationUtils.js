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
 */
export const handleFileOpenClick = (event, fileUrl) => {
  event.preventDefault();
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
};
