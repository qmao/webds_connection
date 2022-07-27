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


/**
 * The command IDs used by the server extension plugin.
 */
namespace CommandIDs {
  export const connection = 'webds:connection';
}

/**
 * Initialization data for the reprogram extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'connection:plugin',
  autoStart: true,
  requires: [ILauncher, ILayoutRestorer, WebDSService],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    restorer: ILayoutRestorer,
    service: WebDSService ) => {
    console.log('JupyterLab extension connection is activated!');

    let widget: WebDSWidget;
    const { commands, shell } = app;
    const command = CommandIDs.connection;
    const category = 'Touch - Bootstrapping';
    const extension_string = 'Connection';


    commands.addCommand(command, {
      label: extension_string,
      caption: extension_string,
	  icon: extensionConnectionIcon,
      execute: () => {
        if (!widget || widget.isDisposed) {
          let content = new ShellWidget(service);

          widget = new WebDSWidget<ShellWidget>({ content });
          widget.id = 'connection';
          widget.title.label = extension_string;
          widget.title.closable = true;
          widget.title.icon = extensionConnectionIcon;
        }

        if (!tracker.has(widget))
          tracker.add(widget);

        if (!widget.isAttached)
          shell.add(widget, 'main');

        shell.activateById(widget.id);
      }
    });

    // Add launcher
    launcher.add({
      command: command,
      category: category,
      rank: 30
    });

    let tracker = new WidgetTracker<WebDSWidget>({ namespace: 'webds_connection' });
    restorer.restore(tracker, { command, name: () => 'webds_connection' });
  }
};

export default plugin;
