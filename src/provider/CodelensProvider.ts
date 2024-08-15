import * as vscode from "vscode";

/**
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;
  regex: RegExp;
  promRegex: RegExp;

  constructor(ctx: vscode.ExtensionContext) {
    // regex to find strings encapsulated in quotes
    this.regex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
    this.promRegex = /prom.+new/gi;
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });

    vscode.window.onDidChangeTextEditorSelection((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }
  /**
   *
   *
   * @param {vscode.TextDocument} document
   * @param {vscode.CancellationToken} token
   * @return {(vscode.CodeLens[] | Thenable<vscode.CodeLens[]>)}
   * @memberof CodelensProvider
   */
  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return [];
    }

    // get selected text
    const selection = editor.selection;
    const line = document.lineAt(selection.start.line);
    let text = document.getText(selection);
    let isPromMetric = false;
    // if text is empty, get the text from the current line using the regex
    if (!text) {
      const matches = line.text.match(this.regex);
      // find largest match
      if (matches) {
        text = matches.reduce((a, b) => (a.length > b.length ? a : b));
        text = text.substring(1, text.length - 1);
      }
      isPromMetric = line.text.match(this.promRegex) ? true : false;
    }

    // if `isPromMetric` we need to iterate the current and following lines until we find the name of the metric
    if (isPromMetric) {
      let i = selection.start.line;
      let metricName = "";
      while (i < selection.start.line + 5) {
        const line = document.lineAt(i);
        const matches = line.text.match(this.regex);
        if (matches) {
          metricName = matches.reduce((a, b) => (a.length > b.length ? a : b));
          metricName = metricName.substring(1, metricName.length - 1);
          if (!metricName.includes(" ")) {
            break;
          }
        }
        i++;
      }
      if (metricName) {
        text = metricName;
      }
    }

    if (!text) {
      return [];
    }
    // provide codelense for this line
    const indexOf = line.text.indexOf(text);
    if (indexOf === -1 && !isPromMetric) {
      return [];
    }
    const position = new vscode.Position(line.lineNumber, isPromMetric ? 0 : indexOf);
    let range = document.getWordRangeAtPosition(position);
    if (!range) {
        range = new vscode.Range(position, position);
    }
    if (range) {
      const codeLenses = [];
      if (!isPromMetric) {
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: `🪵 Logs for this line`,
            tooltip: `Click to view logs for '${text}'`,
            command: "code2logs.lineFilterAction",
            arguments: [text],
          })
        );
      }
      if (isPromMetric) {
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: `📊 Show metric rate`,
            command: "code2logs.prometheusBreakoutAction",
            arguments: [text],
          })
        );
      }
      if (!text.includes(" ") && !isPromMetric) {
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: `📊 Break out into metrics`,
            command: "code2logs.metricBreakoutAction",
            arguments: [text],
          })
        );
      }
      return codeLenses;
    }

    return [];
  }
}
