import * as vscode from "vscode";

export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

interface ReplaceWebviewHtmlTokensOptions {
  cspSource: string;
  cspNonce: string;
  cssUri: string;
  rootUri: string;
  jsUri: string;
}

export function replaceWebviewHtmlTokens(
  html: string,
  options: ReplaceWebviewHtmlTokensOptions,
  replacer: (asset: string) => vscode.Uri | undefined
) {
  const { cspNonce, cspSource, cssUri, rootUri, jsUri } = options;

  let retHtml = html;
  const jsRx = new RegExp('src="(/index.+.js)"', "g");
  // replace all script tags with the correct asset
  for (const match of retHtml.matchAll(jsRx)) {
    const jsPath = match[1];
    retHtml = retHtml.replace(jsPath, replacer(jsPath)?.toString() ?? "");
  }

  const cssRx = new RegExp('href="(/index.+.css)"', "g");
  // replace all script tags with the correct asset
  for (const match of retHtml.matchAll(cssRx)) {
    const jsPath = match[1];
    retHtml = retHtml.replace(jsPath, replacer(jsPath)?.toString() ?? "");
  }


  return retHtml.replace(
    /#{(jsUri|cssUri|cspSource|cspNonce|codiconsUri|pdiconsUri|rootUri)}/g,
    (_substring: string, token: string) => {
      switch (token) {
        case "cspSource":
          return cspSource;
        case "cspNonce":
          return cspNonce;
        case "cssUri":
          return cssUri;
        case "rootUri":
          return rootUri;
        default:
          return "";
      }
    }
  );
}
