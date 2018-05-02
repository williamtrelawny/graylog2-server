import React from 'react';
import PropTypes from 'prop-types';

import { Button } from 'react-bootstrap';
import TimeHistogramPivot from './pivottypes/TimeHistogramPivot';
import NoConfigurationPivot from './pivottypes/NoConfigurationPivot';

const _configurationComponentByType = (type, value, onChange) => {
  switch (type) {
    case 'date': return <TimeHistogramPivot onChange={onChange} value={value} />;
    default: return <NoConfigurationPivot />;
  }
};

export default class PivotConfiguration extends React.Component {
  static propTypes = {
    type: PropTypes.string.isRequired,
    config: PropTypes.shape({
      type: PropTypes.string.isRequired,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      config: props.config,
    };
  }

  _onSubmit = () => this.props.onClose(this.state);
  _onChange = config => this.setState({ config });

  render() {
    const { type } = this.props;
    const { config } = this.state;
    const typeSpecificConfiguration = _configurationComponentByType(type, config, this._onChange);
    return (
      <span>
        {typeSpecificConfiguration}
        <div className="pull-right" style={{ marginBottom: '10px' }}>
          <Button bsStyle="success" onClick={this._onSubmit}>Done</Button>
        </div>
      </span>
    );
  }
};
