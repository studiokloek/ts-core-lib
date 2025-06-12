import { filter, find, pull } from 'lodash';
import { SoundAsset } from '../../loaders';
import { SoundLibraryItem } from './library-item';
// import { getLogger } from '../../logger';

// const Logger = getLogger('core > sounds > library');

class ConcreteSoundsLibrary {
  private items: SoundLibraryItem[] = [];

  async load(asset: SoundAsset, zone = 'generic', buffer = false): Promise<SoundLibraryItem> {
    // bestaat deze al?
    let item = this.getItemByAsset(asset);

    if (!item) {
      // nog niet, aanmaken
      item = new SoundLibraryItem(asset, { buffer });
      this.items.push(item);
    }

    item.addToZone(zone);

    await item.load();

    // Logger.debug('Loaded', `${zone}/${asset.name}`);

    return item;
  }

  unload(asset: SoundAsset, zone = 'generic'): boolean {
    const item = this.getItemByAsset(asset);

    if (!item) {
      return false;
    }

    item.removeFromZone(zone);

    if (!item.hasZone()) {
      item.unload();
      pull(this.items, item);
      // Logger.debug('Un-loaded', `${zone}/${asset.name}`);
    }

    return true;
  }

  getItemByAsset(_asset: SoundAsset): SoundLibraryItem {
    return find(this.items, { id: _asset.id }) as SoundLibraryItem;
  }

  getZoneSounds(_zone: string): SoundLibraryItem[] {
    return filter(this.items, (item) => item.isInZone(_zone));
  }
}

export const SoundLibrary = new ConcreteSoundsLibrary();
