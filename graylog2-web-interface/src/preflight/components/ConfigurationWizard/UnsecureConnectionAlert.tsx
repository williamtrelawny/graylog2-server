/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */

import * as React from 'react';

import { Alert } from 'preflight/components/common';
import isSecureConnection from 'preflight/util/IsSecureConnection';

type Props = {
  renderIfSecure?: React.ReactElement
}

const UnsecureConnectionAlert = ({ renderIfSecure }: Props) => {
  const connectionIsSecure = isSecureConnection();

  if (connectionIsSecure === 'YES') {
    return renderIfSecure ?? null;
  }

  return (
    <Alert type="warning">
      {connectionIsSecure === 'NO' && (
        <>
          Your connection is not secure. Please be aware the information will be send to the server unencrypted.
        </>
      )}
      {connectionIsSecure === 'MAYBE' && (
        <>
          Your connection may not be secure. Please be aware the information may be send to the server unencrypted.
        </>
      )}
    </Alert>
  );
};

UnsecureConnectionAlert.defaultProps = {
  renderIfSecure: undefined,
};

export default UnsecureConnectionAlert;
