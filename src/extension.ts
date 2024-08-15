import * as vscode from "vscode";
import { window } from "vscode";
import { BaseViewProvider } from "./provider/webviews/BaseViewProvider";
import path from "path";
import fs from "fs/promises";
import { LabelConfig, LabelConfigType } from "./class/LabelConfig";
import { CodelensProvider } from "./provider/CodelensProvider";

const LABELS_CONFIG_FILE = ".labels.json";
const outputChannel = vscode.window.createOutputChannel("Label Reader");

export function activate(context: vscode.ExtensionContext) {
  const webViewProvider = new BaseViewProvider(context);
  const codelensProvider = new CodelensProvider(context);

  vscode.languages.registerCodeLensProvider("*", codelensProvider);

  vscode.commands.registerCommand(
    "code2logs.lineFilterAction",
    (text: string) => {
      webViewProvider.postMessage("setLineFilter", {
        text,
      });
    }
  );

  vscode.commands.registerCommand(
    "code2logs.metricBreakoutAction",
    (text: string) => {
      webViewProvider.postMessage("setMetricBreakout", {
        text,
        type: "metrics"
      });
    }
  );

  vscode.commands.registerCommand(
    "code2logs.prometheusBreakoutAction",
    (text: string) => {
      webViewProvider.postMessage("setMetricBreakout", {
        text,
        type: "prometheus"
      });
    }
  );

  vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (editor && editor.document && editor.document.uri.scheme === "file") {
      const labelConfigs = await readLabelsConfigFiles(
        editor.document.uri.fsPath
      );
      if (!labelConfigs) {
        return;
      }
      // sort by priority
      const sortedConfigs = labelConfigs.sort(
        (a, b) => a.priority - b.priority
      );
      const labelsToApply: LabelConfig[] = [];
      for (let config of sortedConfigs) {
        if (labelsToApply.some((label) => label.label === config.label)) {
          continue;
        }
        labelsToApply.push(config);
      }

      webViewProvider.postMessage("setLabels", {
        labels: labelsToApply,
        meta: {
          filename: path.basename(editor.document.uri.fsPath),
          filepath: editor.document.uri.fsPath,
          workspaceName: vscode.workspace.name,
        },
      });
    }
  });

  context.subscriptions.push(
    window.registerWebviewViewProvider(
      BaseViewProvider.viewType,
      webViewProvider
    )
  );
}

async function readLabelsConfigFiles(filePath: string): Promise<LabelConfig[]> {
  let currentDir = path.dirname(filePath);
  let workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!workspacePath) {
    return [];
  }

  const labelConfigs: LabelConfig[] = [];
  let prio = 0;

  while (currentDir.startsWith(workspacePath)) {
    let configPath = path.join(currentDir, LABELS_CONFIG_FILE);

    try {
      let configContent = await fs.readFile(configPath, "utf8");
      outputChannel.appendLine(`Config at ${configPath}: ${configContent}`);
      let parsedConfig = parseLabelsConfig(configContent, prio++);
      if (parsedConfig) {
        labelConfigs.push(...parsedConfig);
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        outputChannel.appendLine(
          `Error reading config at ${configPath}: ${error.message}`
        );
      }
    }

    if (currentDir === workspacePath) {
      break;
    }
    currentDir = path.dirname(currentDir);
  }
  return labelConfigs;
}

function parseLabelsConfig(
  configContent: string,
  priority: number
): LabelConfig[] | null {
  try {
    const labels = JSON.parse(configContent);
    if (!Array.isArray(labels)) {
      throw new Error("Invalid labels config");
    }
    return labels.map((label: any) => {
      if (label.type === LabelConfigType.OneOf) {
        return new LabelConfig({
          type: LabelConfigType.OneOf,
          label: label.label,
          operator: label.operator,
          values: label.values,
          priority,
          isStatic: label.isStatic,
        });
      }

      return new LabelConfig({
        type: label.type ?? LabelConfigType.Static,
        label: label.label,
        operator: label.operator,
        value: label.value,
        priority,
        isStatic: label.isStatic,
      });
    });
  } catch (e: any) {
    outputChannel.appendLine(`Error parsing labels config: ${e.message}`);
    return null;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
