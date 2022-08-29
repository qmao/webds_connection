import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';

import { WidgetTracker } from '@jupyterlab/apputils';

import { ILauncher } from '@jupyterlab/launcher';

import { ShellWidget } from './widget'

import { extensionConnectionIcon } from './icons';

import { WebDSService, WebDSWidget } from '@webds/service';

namespace Attributes {
  export const command = "webds_connection:open";
  export const id = "webds_connection_widget";
  export const label = "Connection";
  export const caption = "Connection";
  export const category = "DSDK - Applications";
  export const rank = 30;
  export const icon = extensionConnectionIcon;
}

/**
 * Initialization data for the reprogram extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "@webds/connection:plugin",
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, WebDSService],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    service: WebDSService ) => {
    console.log('JupyterLab extension ${Attributes.label} is activated!');

    let widget: WebDSWidget;
    const { commands, shell } = app;
    const command = Attributes.command;

    commands.addCommand(command, {
      label: Attributes.label,
      caption: Attributes.caption,
	  icon: Attributes.icon,
      execute: () => {
        if (!widget || widget.isDisposed) {
          let content = new ShellWidget(Attributes.id, service);

          widget = new WebDSWidget<ShellWidget>({ content });
          widget.id = Attributes.id;
          widget.title.label = Attributes.label;
          widget.title.closable = true;
          widget.title.icon = Attributes.icon;
        }

        if (!tracker.has(widget))
          tracker.add(widget);

        if (!widget.isAttached)
          shell.add(widget, 'main');

        shell.activateById(widget.id);

        widget.setShadows();
      }
    });

    // Add launcher
    launcher.add({
      command: command,
      category: Attributes.category,
      rank: Attributes.rank
    });

    let tracker = new WidgetTracker<WebDSWidget>({ namespace: Attributes.id });
    restorer.restore(tracker, { command, name: () => Attributes.id });
  }
};

export default plugin;
