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

/**
 * Begint te luisteren naar veranderingen in de internetverbinding.
 * Stuurt `AppEvent.NETWORK_ONLINE` of `AppEvent.NETWORK_OFFLINE` wanneer de verbinding wijzigt.
 * Kan meerdere keren aangeroepen worden zonder problemen.
 */
export async function initNetworkStatusDetection(): Promise<void> {
  if (inited) {
    return;
  }

  inited = true;

  const status = await Network.getStatus();
  reportStatus(status);
}

/** Geeft `true` terug als er momenteel een internetverbinding is. */
export function isOnline(): boolean {
  return currentStatus.connected;
}
