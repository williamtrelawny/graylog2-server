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
import { useCallback, useContext, useMemo, useState } from 'react';
import { Form, Formik } from 'formik';
import styled, { css } from 'styled-components';
import moment from 'moment';

import { Button, Col, Row, Popover } from 'components/bootstrap';
import { Icon, IfPermitted, KeyCapture, ModalSubmit } from 'components/common';
import type {
  AbsoluteTimeRange,
  KeywordTimeRange,
  NoTimeRangeOverride,
  TimeRange,
  RelativeTimeRange,
} from 'views/logic/queries/Query';
import type { SearchBarFormValues } from 'views/Constants';
import { isTypeKeyword, isTimeRange, isTypeRelative } from 'views/typeGuards/timeRange';
import { normalizeIfAllMessagesRange } from 'views/logic/queries/NormalizeTimeRange';
import validateTimeRange from 'views/components/TimeRangeValidation';
import type { DateTimeFormats, DateTime } from 'util/DateTime';
import { toDateObject } from 'util/DateTime';
import useUserDateTime from 'hooks/useUserDateTime';
import useSendTelemetry from 'logic/telemetry/useSendTelemetry';
import TimeRangeInputSettingsContext from 'views/components/contexts/TimeRangeInputSettingsContext';
import TimeRangeAddToQuickListButton
  from 'views/components/searchbar/time-range-filter/time-range-picker/TimeRangeAddToQuickListButton';

import type { RelativeTimeRangeClassified } from './types';
import migrateTimeRangeToNewType from './migrateTimeRangeToNewType';
import {
  classifyRelativeTimeRange,
  normalizeIfClassifiedRelativeTimeRange,
  RELATIVE_CLASSIFIED_ALL_TIME_RANGE,
} from './RelativeTimeRangeClassifiedHelper';
import TimeRangeTabs, { timeRangePickerTabs } from './TimeRangePickerTabs';

export type TimeRangePickerFormValues = {
  nextTimeRange: RelativeTimeRangeClassified | AbsoluteTimeRange | KeywordTimeRange | NoTimeRangeOverride,
};

export type SupportedTimeRangeType = keyof typeof timeRangePickerTabs;

export const allTimeRangeTypes = Object.keys(timeRangePickerTabs) as Array<SupportedTimeRangeType>;

const createDefaultRanges = (formatTime: (time: DateTime, format: DateTimeFormats) => string) => ({
  absolute: {
    type: 'absolute',
    from: formatTime(toDateObject(new Date()).subtract(300, 'seconds'), 'complete'),
    to: formatTime(toDateObject(new Date()), 'complete'),
  },
  relative: {
    type: 'relative',
    from: {
      value: 5,
      unit: 'minutes',
      isAllTime: false,
    },
    to: RELATIVE_CLASSIFIED_ALL_TIME_RANGE,
  },
  keyword: {
    type: 'keyword',
    keyword: 'Last five minutes',
  },
  disabled: undefined,
});

const StyledPopover = styled(Popover)(({ theme }) => css`
  min-width: 750px;
  background-color: ${theme.colors.variant.lightest.default};

  .popover-title {
    border: none;
  }
`);

const Timezone = styled.p(({ theme }) => css`
  font-size: ${theme.fonts.size.small};
  padding-left: 3px;
  margin: 0;
  min-height: 34px;
  display: flex;
  align-items: center;
`);

const PopoverTitle = styled.span`
  display: flex;
  justify-content: space-between;
  align-items: center;

  > span {
    font-weight: 600;
  }
`;

const LimitLabel = styled.span(({ theme }) => css`
  > svg {
    margin-right: 3px;
    color: ${theme.colors.variant.dark.warning};
  }

  > span {
    font-size: ${theme.fonts.size.small};
    color: ${theme.colors.variant.darkest.warning};
  }
`);

const dateTimeValidate = (nextTimeRange, limitDuration, formatTime: (dateTime: DateTime, format: string) => string) => {
  const timeRange = normalizeIfClassifiedRelativeTimeRange(nextTimeRange);
  const timeRangeErrors = validateTimeRange(timeRange, limitDuration, formatTime);

  return Object.keys(timeRangeErrors).length !== 0
    ? { nextTimeRange: timeRangeErrors }
    : {};
};

const onInitializingNextTimeRange = (currentTimeRange: SearchBarFormValues['timerange'] | NoTimeRangeOverride) => {
  if (isTypeRelative(currentTimeRange)) {
    return classifyRelativeTimeRange(currentTimeRange);
  }

  return currentTimeRange;
};

type Props = {
  currentTimeRange: SearchBarFormValues['timerange'] | NoTimeRangeOverride,
  limitDuration: number,
  noOverride?: boolean,
  position: 'bottom' | 'right',
  setCurrentTimeRange: (nextTimeRange: SearchBarFormValues['timerange'] | NoTimeRangeOverride) => void,
  toggleDropdownShow: () => void,
  validTypes?: Array<SupportedTimeRangeType>,
};

const TimeRangePicker = ({
  noOverride,
  toggleDropdownShow,
  currentTimeRange,
  setCurrentTimeRange,
  validTypes = allTimeRangeTypes,
  position,
  limitDuration: configLimitDuration,
}: Props) => {
  const { ignoreLimitDurationInTimeRangeDropdown } = useContext(TimeRangeInputSettingsContext);
  const limitDuration = useMemo(() => (ignoreLimitDurationInTimeRangeDropdown ? 0 : configLimitDuration), [configLimitDuration, ignoreLimitDurationInTimeRangeDropdown]);
  const { formatTime, userTimezone } = useUserDateTime();
  const [validatingKeyword, setValidatingKeyword] = useState(false);
  const sendTelemetry = useSendTelemetry();
  const positionIsBottom = position === 'bottom';
  const defaultRanges = useMemo(() => createDefaultRanges(formatTime), [formatTime]);
  const { showAddToQuickListButton } = useContext(TimeRangeInputSettingsContext);

  const handleNoOverride = useCallback(() => {
    setCurrentTimeRange({});
    toggleDropdownShow();
  }, [setCurrentTimeRange, toggleDropdownShow]);

  const handleCancel = useCallback(() => {
    toggleDropdownShow();

    sendTelemetry('click', {
      app_pathname: 'search',
      app_section: 'search-bar',
      app_action_value: 'search-time-range-cancel-button',
    });
  }, [sendTelemetry, toggleDropdownShow]);

  const normalizeIfKeywordTimerange = (timeRange: TimeRange | NoTimeRangeOverride) => {
    if (isTypeKeyword(timeRange)) {
      return {
        type: timeRange.type,
        timezone: timeRange.timezone,
        keyword: timeRange.keyword,
      };
    }

    return timeRange;
  };

  const handleSubmit = useCallback(({ nextTimeRange }: {
    nextTimeRange: TimeRangePickerFormValues['nextTimeRange']
  }) => {
    const normalizedTimeRange = normalizeIfKeywordTimerange(
      normalizeIfAllMessagesRange(
        normalizeIfClassifiedRelativeTimeRange(nextTimeRange),
      ),
    );

    setCurrentTimeRange(normalizedTimeRange);

    toggleDropdownShow();

    sendTelemetry('click', {
      app_pathname: 'search',
      app_section: 'search-bar',
      app_action_value: 'search-time-range-confirm-button',
    });
  }, [sendTelemetry, setCurrentTimeRange, toggleDropdownShow]);

  const title = (
    <PopoverTitle>
      <span>Search Time Range</span>
      {limitDuration > 0 && (
        <LimitLabel>
          <Icon name="exclamation-triangle" />
          <span>Admin has limited searching to {moment.duration(-limitDuration, 'seconds').humanize(true)}</span>
        </LimitLabel>
      )}
    </PopoverTitle>
  );

  const _validateTimeRange = useCallback(({ nextTimeRange }) => dateTimeValidate(nextTimeRange, limitDuration, formatTime), [formatTime, limitDuration]);
  const initialTimeRange = useMemo(() => ({ nextTimeRange: onInitializingNextTimeRange(currentTimeRange) }), [currentTimeRange]);

  return (
    <StyledPopover id="timerange-type"
                   data-testid="timerange-type"
                   placement={position}
                   positionTop={positionIsBottom ? 36 : -10}
                   positionLeft={positionIsBottom ? -15 : 45}
                   arrowOffsetTop={positionIsBottom ? undefined : 25}
                   arrowOffsetLeft={positionIsBottom ? 34 : -11}
                   title={title}>
      <Formik<TimeRangePickerFormValues> initialValues={initialTimeRange}
                                         validate={_validateTimeRange}
                                         onSubmit={handleSubmit}
                                         validateOnMount>
        {(({ values: { nextTimeRange }, isValid, setFieldValue, submitForm }) => {
          const handleActiveTab = (nextTab: AbsoluteTimeRange['type'] | RelativeTimeRange['type'] | KeywordTimeRange['type']) => {
            if ('type' in nextTimeRange) {
              setFieldValue('nextTimeRange', migrateTimeRangeToNewType(nextTimeRange as TimeRange, nextTab, formatTime));
            } else {
              setFieldValue('nextTimeRange', defaultRanges[nextTab]);
            }
          };

          return (
            <KeyCapture shortcuts={{ enter: submitForm, esc: handleCancel }}>
              <Form>
                <Row>
                  <Col md={12}>
                    {showAddToQuickListButton && isTimeRange(nextTimeRange) && (
                      <IfPermitted permissions="clusterconfigentry:edit">
                        <TimeRangeAddToQuickListButton />
                      </IfPermitted>
                    )}
                    <TimeRangeTabs currentTimeRange={currentTimeRange}
                                   handleActiveTab={handleActiveTab}
                                   limitDuration={limitDuration}
                                   validTypes={validTypes}
                                   setValidatingKeyword={setValidatingKeyword} />
                  </Col>
                </Row>

                <Row className="row-sm">
                  <Col md={6}>
                    <Timezone>All timezones using: <b>{userTimezone}</b></Timezone>
                  </Col>
                  <Col md={6}>
                    <ModalSubmit leftCol={noOverride && <Button bsStyle="link" onClick={handleNoOverride}>No Override</Button>}
                                 onCancel={handleCancel}
                                 disabledSubmit={!isValid || validatingKeyword}
                                 submitButtonText="Update time range" />
                  </Col>
                </Row>
              </Form>
            </KeyCapture>
          );
        })}
      </Formik>
    </StyledPopover>
  );
};

TimeRangePicker.defaultProps = {
  noOverride: false,
  validTypes: allTimeRangeTypes,
};

export default TimeRangePicker;
