import { ConnectionStatus, Network } from '@capacitor/network';
import { PubSub, AppEvent } from '../events';
import { getLogger } from '../logger';

const Logger = getLogger('device > network');

Network.addListener('networkStatusChange', reportStatus);

let currentStatus: ConnectionStatus = {
  connected: false,
  connectionType: 'unknown',
};

function reportStatus(status: ConnectionStatus): void {
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

  Logger.debug(`Status changed to '${status.connected ? 'connected' : 'disconnected'}'`);
}

let inited = false;

export async function initNetworkStatusDetection(): Promise<void> {
  if (inited) {
    return;
  }

  inited = true;

  const status = await Network.getStatus();
  reportStatus(status);
}

export function isOnline(): boolean {
  return currentStatus.connected;
}
