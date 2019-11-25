import { createMiniPage, PageOptions, PageInstance, attachLogic } from '@goldfishjs/reactive-connect';
import AppStore from '../store/AppStore';
import PageStore from '../store/PageStore';

/**
 * Connect PageStore with Page.
 *
 * @param storeClass
 * @param pageOptions
 * @param options
 */
export default function createPage<AS extends AppStore, PS extends PageStore<AS>, D = any>(
  storeClass: new () => PS,
  pageOptions: PageOptions<D, PS> = {},
  options?: {
    beforeCreateStore?: (view: PageInstance<D, PS>) => void;
    afterCreateStore?: (view: PageInstance<D, PS>, store: PS) => void;
  },
) {
  attachLogic<'onLoad', Required<PageOptions<D, PS>>['onLoad']>(
    pageOptions,
    'onLoad',
    'after',
    async function (this: PageInstance<D, PS>, query) {
      const store = this.store!;
      store.globalStore && store.globalStore.updatePages({
        query,
      });
      store.isInitLoading = true;
      store.globalStore && (await store.globalStore.waitForReady());
      try {
        await store.fetchInitData();
      } catch (e) {
        throw e;
      } finally {
        store.isInitLoading = false;
      }
    },
  );
  return createMiniPage<AS, PS, D>(
    storeClass,
    pageOptions,
    {
      ...options,
      afterCreateStore: (view, store) => {
        options && options.afterCreateStore && options.afterCreateStore(view, store);
        store.globalStore = (getApp() as any).store;
      },
    },
  );
}