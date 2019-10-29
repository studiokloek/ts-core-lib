import { NetworkStatus, Plugins } from '@capacitor/core';
import { PubSub } from '@studiokloek/kloek-ts-core/events';
import { AppEvent } from '@studiokloek/kloek-ts-core/eventtypes';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';

const Logger = getLogger('core > network');
const { Network } = Plugins;

Network.addListener('networkStatusChange', reportStatus);

let currentStatus: NetworkStatus;

function reportStatus(status: NetworkStatus): void {
  if (!status) {
    return;
  }

  // uberhaupt change?
  if (currentStatus && currentStatus.connected === status.connected) {
    return;
  }

  currentStatus = status;

  if (status.connected) {
    PubSub.publish(AppEvent.NETWORK_ONLINE);
  } else {
    PubSub.publish(AppEvent.NETWORK_OFFLINE);
  }

  Logger.info(`Status changed to '${status.connected ? 'connected' : 'disconnected'}'`);
}

let inited = false;

export async function initNetworkStatusDetection(): Promise<void> {
  if (inited) {
    return;
  }

  inited = true;

  if (currentStatus) {
    return;
  }

  let status = await Network.getStatus();
  reportStatus(status);
}

export async function isOnline(): Promise<boolean> {
  await initNetworkStatusDetection();
  return currentStatus.connected;
}
