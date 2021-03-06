import * as Bluebird from 'bluebird';
import { useEffect, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { ApplicationState } from 'src/store';
import { requestAccount } from 'src/store/account/account.requests';
import { requestAccountSettings } from 'src/store/accountSettings/accountSettings.requests';
import { getAllBuckets } from 'src/store/bucket/bucket.requests';
import { getEvents } from 'src/store/events/event.request';
import { getAllFirewalls } from 'src/store/firewalls/firewalls.requests';
import { requestImages } from 'src/store/image/image.requests';
import { requestKubernetesClusters } from 'src/store/kubernetes/kubernetes.requests';
import { requestLinodes } from 'src/store/linodes/linode.requests';
import { requestTypes } from 'src/store/linodeType/linodeType.requests';
import { getAllLongviewClients } from 'src/store/longview/longview.requests';
import { requestManagedIssues } from 'src/store/managed/issues.requests';
import { requestManagedServices } from 'src/store/managed/managed.requests';
import { getAllNodeBalancers } from 'src/store/nodeBalancer/nodeBalancer.requests';
import { requestNotifications } from 'src/store/notification/notification.requests';
import { requestProfile } from 'src/store/profile/profile.requests';
import { requestRegions } from 'src/store/regions/regions.actions';
import { getAllVolumes } from 'src/store/volume/volume.requests';

interface UseReduxPreload {
  _loading: boolean;
}

export type ReduxEntity =
  | 'linodes'
  | 'volumes'
  | 'account'
  | 'accountSettings'
  | 'images'
  | 'kubernetes'
  | 'managed'
  | 'managedIssues'
  | 'nodeBalancers'
  | 'notifications'
  | 'profile'
  | 'regions'
  | 'types'
  | 'buckets'
  | 'events'
  | 'longview'
  | 'firewalls';

type RequestMap = Record<ReduxEntity, any>;
const requestMap: RequestMap = {
  linodes: requestLinodes,
  volumes: getAllVolumes,
  account: requestAccount,
  accountSettings: requestAccountSettings,
  nodeBalancers: getAllNodeBalancers,
  images: requestImages,
  events: getEvents,
  buckets: getAllBuckets,
  profile: requestProfile,
  regions: requestRegions,
  types: requestTypes,
  notifications: requestNotifications,
  managed: requestManagedServices,
  managedIssues: requestManagedIssues,
  kubernetes: requestKubernetesClusters,
  longview: getAllLongviewClients,
  firewalls: getAllFirewalls
};

export const useReduxLoad = <T>(
  deps: ReduxEntity[] = [],
  refreshInterval: number = 60000
): UseReduxPreload => {
  const [_loading, setLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const state = useStore<ApplicationState>().getState();

  useEffect(() => {
    let i = 0;
    let needsToLoad = false;
    const requests = [];
    for (i; i < deps.length; i++) {
      const currentResource = state.__resources[deps[i]] || state[deps[i]];
      if (currentResource) {
        if (currentResource.lastUpdated === 0 && !currentResource.loading) {
          needsToLoad = true;
          requests.push(requestMap[deps[i]]);
        } else if (Date.now() - currentResource.lastUpdated > refreshInterval) {
          requests.push(requestMap[deps[i]]);
        }
      }
    }

    if (requests.length === 0) {
      return;
    }

    if (needsToLoad) {
      setLoading(true);
    }

    Bluebird.map(requests, thisRequest => {
      return dispatch(thisRequest());
    })
      .then(_ => setLoading(false))
      .catch(_ => setLoading(false));
  }, []);

  return { _loading };
};

export default useReduxLoad;
