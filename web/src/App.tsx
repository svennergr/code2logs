import { css } from "@emotion/css";

// @ts-ignore
const vscode = acquireVsCodeApi();
function App() {
  const styles = getStyles();

  window.addEventListener("message", (event) => {
    console.log("Event", event);
    // forward to iframe
    const iframe = document.querySelector("iframe");
    if (iframe) {
      iframe.contentWindow?.postMessage(event.data, "*");
    }

    // forward to parent
    vscode?.postMessage(event.data, "*");
  });
  return (
    <iframe
      title="iframe"
      security="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
      src="http://localhost:3000/a/grafana-vscodescenes-app/home"
      className={styles.iframe}
    ></iframe>
  );
}

function getStyles() {
  return {
    iframe: css({
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: "100%",
      height: "100%",
      border: "none",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      zIndex: 999999,
    })
  }
}
export default App;
