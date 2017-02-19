import React from 'react';
import {connect} from 'react-redux';
import {Button, Icon, Panel} from '../common';
import {resetSettings, deleteNVRAMs} from '../../actions';
import {ActionState} from '../../enums';

class ResetPanel extends React.Component {

  static id = 'reset';

  static propTypes = {
    resetSettingsState: React.PropTypes.oneOf(ActionState.values).isRequired,
    nvramsDeletionState: React.PropTypes.oneOf(ActionState.values).isRequired,
    collapsed: React.PropTypes.bool,
    onHeaderClick: React.PropTypes.func,
    dispatch: React.PropTypes.func.isRequired,
  };

  static defaultProps = {
    collapsed: false,
    onHeaderClick: false,
  }

  handleResetSettings = () => {
    this.props.dispatch(resetSettings());
  }

  handleDeleteNVRAMs = () => {
    if (confirm('Delete stored data of all games?')) {
      this.props.dispatch(deleteNVRAMs());
    }
  }

  renderResetSettingsButton() {
    const {resetSettingsState} = this.props;
    if (resetSettingsState === ActionState.STARTED) {
      const icon = <Icon name="circle-o-notch" spin/>;
      return <Button icon={icon} caption="Resetting settings..." disabled/>;
    }
    if (resetSettingsState === ActionState.SUCCESS) {
      return <Button icon="check" caption="Done" disabled/>;
    }
    if (resetSettingsState === ActionState.FAILURE) {
      return <Button icon="exclamation-triangle" caption="Reset failed" disabled/>;
    }
    return <Button caption="Reset settings" onClick={this.handleResetSettings}/>;
  }

  renderDeleteNVRAMsButton() {
    const {nvramsDeletionState} = this.props;
    if (nvramsDeletionState === ActionState.STARTED) {
      const icon = <Icon name="circle-o-notch" spin/>;
      return <Button icon={icon} caption="Deleting data..." disabled/>;
    }
    if (nvramsDeletionState === ActionState.SUCCESS) {
      return <Button icon="check" caption="Done" disabled/>;
    }
    if (nvramsDeletionState === ActionState.FAILURE) {
      return <Button icon="exclamation-triangle" caption="Deletion failed" disabled/>;
    }
    return <Button caption="Delete game data" onClick={this.handleDeleteNVRAMs}/>;
  }

  render() {
    const {collapsed, onHeaderClick} = this.props;
    return (
      <Panel type={ResetPanel.id} icon="trash-o" caption="Reset" collapsed={collapsed} onHeaderClick={onHeaderClick}>
        <div className="reset-row">
          <div className="reset-button">
            {this.renderResetSettingsButton()}
          </div>
          <div className="reset-description">
            Reset cfxnes settings to defaults.
          </div>
        </div>
        <div className="reset-row">
          <div className="reset-button">
            {this.renderDeleteNVRAMsButton()}
          </div>
          <div className="reset-description">
            Delete data of games that support saving (for example The Legend of Zelda or Final Fantasy).
          </div>
        </div>
      </Panel>
    );
  }

}

const mapStateToProps = state => {
  const resetSettingsState = state.settings.resetState;
  const {nvramsDeletionState} = state.database;
  return {resetSettingsState, nvramsDeletionState};
};

export default connect(mapStateToProps)(ResetPanel);
