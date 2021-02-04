import { Notification } from '@linode/api-v4/lib/account';
import { path } from 'ramda';
import * as React from 'react';
import { dcDisplayNames } from 'src/constants';
import { reportException } from 'src/exceptionReporting';
import useNotifications from 'src/hooks/useNotifications';
import { NotificationItem } from '../NotificationSection';
import RenderNotification from './RenderNotification';

export const useFormattedNotifications = () => {
  const { combinedNotifications } = useNotifications();

  return combinedNotifications.map((notification, idx) =>
    formatNotificationForDisplay(interceptNotification(notification), idx)
  );
};

const interceptNotification = (notification: Notification): Notification => {
  /** this is an outage to one of the datacenters */
  if (
    notification.type === 'outage' &&
    notification.entity &&
    notification.entity.type === 'region'
  ) {
    const convertedRegion = dcDisplayNames[notification.entity.id];

    if (!convertedRegion) {
      reportException(
        'Could not find the DC name for the outage notification',
        {
          rawRegion: notification.entity.id,
          convertedRegion
        }
      );
    }

    /** replace "this facility" with the name of the datacenter */
    return {
      ...notification,
      label: notification.label
        .toLowerCase()
        .replace('this facility', convertedRegion || 'one of our facilities'),
      message: notification.message
        .toLowerCase()
        .replace('this facility', convertedRegion || 'one of our facilities')
    };
  }

  /** there is maintenance on this Linode */
  if (
    notification.type === 'maintenance' &&
    notification.entity &&
    notification.entity.type === 'linode'
  ) {
    /** replace "this Linode" with the name of the Linode */
    const linodeAttachedToNotification = path(['label'], notification.entity);
    return {
      ...notification,
      label: `Maintenance Scheduled`,
      severity: 'major',
      message: `${
        linodeAttachedToNotification
          ? `Linode ${linodeAttachedToNotification}`
          : `This Linode`
      }
            has scheduled maintenance`
    };
  }

  return notification;
};

const formatNotificationForDisplay = (
  notification: Notification,
  idx: number
): NotificationItem => ({
  id: `notification-${idx}`,
  body: <RenderNotification notification={notification} />,
  countInTotal: true
});

export default useFormattedNotifications;
