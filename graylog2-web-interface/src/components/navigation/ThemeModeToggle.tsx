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
import { useEffect, useState } from 'react';
import type { DefaultTheme } from 'styled-components';
import styled, { css, withTheme } from 'styled-components';
import defer from 'lodash/defer';

import { Icon } from 'components/common';
import { themePropTypes } from 'theme';
import {
  THEME_MODE_LIGHT,
  THEME_MODE_DARK,
} from 'theme/constants';

type Props = {
  theme: DefaultTheme,
};

const ThemeModeToggleWrap = styled.div`
  display: flex;
  align-items: center;
`;

const ModeIcon = styled(Icon)<{ $currentMode: boolean }>(({ theme, $currentMode }) => css`
  opacity: ${$currentMode ? '1' : '0.5'};
  color: ${$currentMode ? theme.colors.brand.primary : theme.colors.variant.darkest.default};
`);

const Toggle = styled.label(({ theme }) => css`
  display: flex;
  align-items: center;
  margin: 0;

  input {
    border: 0;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
    white-space: nowrap;

    &:checked + .slider {
      background-color: ${theme.colors.variant.dark.default};

      &::before {
        transform: translate(16px, -50%);
      }
    }

    &:disabled + .slider {
      opacity: 0.5;
      cursor: not-allowed;

      &::before {
        background-color: ${theme.colors.variant.light.default};
      }
    }
  }

  .slider {
    box-sizing: border-box;
    margin: 0 9px;
    width: 36px;
    height: 22px;
    border-radius: 30px;
    background-color: ${theme.colors.gray[80]};
    box-shadow: inset 0 1px 3px 0 rgb(0 0 0 / 20%);
    display: inline-block;
    position: relative;
    cursor: pointer;

    &::before {
      transition: transform 75ms ease-in-out;
      content: '';
      display: block;
      width: 18px;
      height: 18px;
      background-color: ${theme.colors.brand.secondary};
      box-shadow: 0 2px 3px 0 rgb(0 0 0 / 25%), 0 2px 8px 0 rgb(32 37 50 / 16%);
      position: absolute;
      border-radius: 100%;
      top: 11px;
      transform: translate(2px, -50%);
    }
  }
`);

const ThemeModeToggle = ({ theme }: Props) => {
  const currentMode = theme.mode;
  const [loadingTheme, setLoadingTheme] = useState(false);

  useEffect(() => {
    if (loadingTheme) {
      setLoadingTheme(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const toggleThemeMode = (event) => {
    const { checked } = event.target;
    event.persist();
    setLoadingTheme(true);
    const newMode = checked ? THEME_MODE_DARK : THEME_MODE_LIGHT;
    defer(() => theme.changeMode(newMode));
  };

  const loadingLightMode = currentMode === THEME_MODE_DARK && loadingTheme;
  const loadingDarkMode = currentMode === THEME_MODE_LIGHT && loadingTheme;

  return (
    <ThemeModeToggleWrap>
      <ModeIcon name={loadingLightMode ? 'spinner' : 'sun'}
                spin={loadingLightMode}
                $currentMode={currentMode === THEME_MODE_LIGHT} />
      <Toggle>
        <input value={THEME_MODE_DARK}
               type="checkbox"
               onChange={toggleThemeMode}
               checked={currentMode === THEME_MODE_DARK}
               disabled={loadingLightMode || loadingDarkMode} />
        <span className="slider" />
      </Toggle>
      <ModeIcon name={loadingDarkMode ? 'spinner' : 'moon'}
                spin={loadingDarkMode}
                $currentMode={currentMode === THEME_MODE_DARK} />
    </ThemeModeToggleWrap>
  );
};

ThemeModeToggle.propTypes = {
  theme: themePropTypes.isRequired,
};

export default withTheme(ThemeModeToggle);
