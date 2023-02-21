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
import { useCallback } from 'react';

import SelectedFieldsList from 'views/components/widgets/SelectedFieldsList';
import FieldSelect from 'views/components/aggregationwizard/FieldSelect';
import type { FieldTypeCategory } from 'views/logic/aggregationbuilder/Pivot';

type Props = {
  createSelectPlaceholder?: string
  onChange: (newFields: Array<string>) => void,
  qualifiedTypeCategory?: FieldTypeCategory
  selectedFields: Array<string>
  testPrefix?: string
}

const FieldsConfiguration = ({
  createSelectPlaceholder,
  onChange,
  qualifiedTypeCategory,
  selectedFields,
  testPrefix,
}: Props) => {
  const onAddField = useCallback((newField: string) => (
    onChange([...selectedFields, newField])
  ), [onChange, selectedFields]);

  return (
    <>
      <SelectedFieldsList testPrefix={testPrefix}
                          selectedFields={selectedFields}
                          onChange={onChange} />
      <FieldSelect id="field-create-select"
                   onChange={onAddField}
                   clearable={false}
                   qualifiedTypeCategory={qualifiedTypeCategory}
                   persistSelection={false}
                   name="field-create-select"
                   value={undefined}
                   excludedFields={selectedFields ?? []}
                   placeholder={createSelectPlaceholder}
                   ariaLabel={createSelectPlaceholder} />
    </>
  );
};

FieldsConfiguration.defaultProps = {
  testPrefix: '',
  createSelectPlaceholder: 'Add a field',
  qualifiedTypeCategory: undefined,
};

export default FieldsConfiguration;
