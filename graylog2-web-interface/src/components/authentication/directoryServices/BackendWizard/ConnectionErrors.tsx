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
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Alert } from 'components/bootstrap';

export const NotificationContainer = styled(Alert)`
  margin-top: 10px;
  word-break: break-word;
`;

export const Title = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
`;

const ErrorsList = styled.ul(({ theme }) => `
  font-family: ${theme.fonts.family.monospace};
  list-style: initial;
  padding-left: 20px;
`);

type Props = {
  errors: Array<string>,
  message: string,
};

const ConnectionErrors = ({ errors, message }: Props) => (
  <NotificationContainer bsStyle="danger">
    <Title>{message}</Title>
    <ErrorsList>
      {errors.map((error) => <li key={String(error)}>{String(error)}</li>)}
    </ErrorsList>
  </NotificationContainer>
);

ConnectionErrors.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.string).isRequired,
  message: PropTypes.string,
};

ConnectionErrors.defaultProps = {
  message: 'There was an error',
};

export default ConnectionErrors;
