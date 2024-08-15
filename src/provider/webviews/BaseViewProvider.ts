import * as vscode from "vscode";
import { getNonce, replaceWebviewHtmlTokens } from "../utils";

const UTF8_TEXT_DECODER = new TextDecoder("utf8");

export class BaseViewProvider implements vscode.WebviewViewProvider {
  static viewType = "code2logs.view";
  protected view?: vscode.WebviewView;
  protected disposables: vscode.Disposable[] = [];

  constructor(protected readonly extensionContext: vscode.ExtensionContext) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;
    this.view.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    this.view.webview.html = await this.getHtmlForWebview(webviewView.webview);
    this.view.onDidDispose(() => {
      for (const disposable of this.disposables) {
        disposable.dispose();
      }
    });

    this.disposables.push(
      this.view.webview.onDidReceiveMessage(
        this.handleReceivePostMessage.bind(this)
      )
    );
  }

  private handleReceivePostMessage(message: any) {
    if (message.type === "openLink") {
      vscode.env.openExternal(vscode.Uri.parse(message.link));
    }
  }

  public postMessage(type: string, data?: any) {
    if (this.view) {
      this.view.webview.postMessage({
        type,
        data,
      });
    }
  }
  
  private getRootUri() {
    return this.extensionContext.extensionUri;
  }

  private getDistUri() {
    return vscode.Uri.joinPath(this.getRootUri(), "web/dist/");
  }

  private getWebviewsUri() {
    return vscode.Uri.joinPath(this.getDistUri(), "");
  }

  private getAssetUri(asset: string) {
    return this.view?.webview.asWebviewUri(vscode.Uri.joinPath(this.getDistUri(), asset));
  }

  private getViewIndexUri() {
    return vscode.Uri.joinPath(this.getWebviewsUri(), `index.html`);
  }

  private async getHtmlForWebview(webview: vscode.Webview) {
    const path = this.getViewIndexUri();
    const bytes = await vscode.workspace.fs.readFile(path);
    return replaceWebviewHtmlTokens(UTF8_TEXT_DECODER.decode(bytes), {
      cspSource: webview.cspSource,
      cspNonce: getNonce(),
      cssUri: this.getAssetUri("index.css")?.toString() ?? '',
      rootUri: this.getRootUri().toString(),
      jsUri: this.getAssetUri("index.js")?.toString() ?? '',
    }, this.getAssetUri.bind(this));
  }
}
