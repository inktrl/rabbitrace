import * as vscode from "vscode";
import { Axios } from "axios";
import { QUEUE } from "../constants";
import type Queue from "./queue";

export default class QueuesProvider
  implements vscode.TreeDataProvider<Queue>, vscode.Disposable
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    Queue | undefined | null | void
  > = new vscode.EventEmitter<Queue | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Queue | undefined | null | void> =
    this._onDidChangeTreeData.event;

  refreshInterval: NodeJS.Timeout;
  managementAPI: Axios;

  constructor(managementAPI: Axios) {
    this.refreshInterval = setInterval(() => this.refresh(), 5000);
    this.managementAPI = managementAPI;
  }

  async getChildren(): Promise<Queue[]> {
    if (this.managementAPI.defaults.baseURL) {
      return (await this.managementAPI.get("/queues?page=1&page_size=50")).data
        .items;
    }
    return [];
  }

  getTreeItem(queue: Queue): vscode.TreeItem {
    const item = new vscode.TreeItem(queue.name);

    item.iconPath = QUEUE;

    item.command = {
      arguments: [
        vscode.Uri.from({
          scheme: "rabbitmq-queue",
          path: queue.name,
        }),
        "rabbitmq.queue",
        vscode.ViewColumn.Active,
      ],
      command: "vscode.openWith",
      title: "Queue Details",
    };

    return item;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  dispose() {
    clearInterval(this.refreshInterval);
  }
}
