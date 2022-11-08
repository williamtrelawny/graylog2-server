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
import { useState, useCallback, useRef } from 'react';

import { ShareButton, OverlayElement, IfPermitted } from 'components/common';
import { Tooltip, ButtonToolbar, DropdownButton, MenuItem } from 'components/bootstrap';
import type { Stream, StreamRule } from 'stores/streams/StreamsStore';
import StreamsStore from 'stores/streams/StreamsStore';
import { LinkContainer } from 'components/common/router';
import Routes from 'routing/Routes';
import HideOnCloud from 'util/conditional/HideOnCloud';
import { StartpageStore } from 'stores/users/StartpageStore';
import UserNotification from 'util/UserNotification';
import StreamRuleForm from 'components/streamrules/StreamRuleForm';
import EntityShareModal from 'components/permissions/EntityShareModal';
import { StreamRulesStore } from 'stores/streams/StreamRulesStore';
import useCurrentUser from 'hooks/useCurrentUser';

import StreamForm from './StreamForm';

const StreamActions = ({ stream, indexSets, streamRuleTypes }: { stream: Stream, indexSets: any, streamRuleTypes: any}) => {
  const currentUser = useCurrentUser();
  const [showEntityShareModal, setShowEntityShareModal] = useState(false);
  const [showStreamRuleForm, setShowStreamRuleForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const setStartpage = useCallback(() => StartpageStore.set(currentUser.id, 'stream', stream.id), [stream.id, currentUser.id]);

  const isDefaultStream = stream.is_default;
  const isNotEditable = !stream.is_editable;
  const defaultStreamTooltip = isDefaultStream
    ? <Tooltip id="default-stream-tooltip">Action not available for the default stream</Tooltip> : null;

  const onToggleStreamStatus = () => {
    if (stream.disabled) {
      return StreamsStore.resume(stream.id, (response) => response);
    }

    if (window.confirm(`Do you really want to pause stream '${stream.title}'?`)) {
      return StreamsStore.pause(stream.id, (response) => response);
    }

    return Promise.resolve();
  };

  const toggleEntityShareModal = useCallback(() => {
    setShowEntityShareModal((cur) => !cur);
  }, []);

  const toggleUpdateModal = useCallback(() => {
    setShowUpdateModal((cur) => !cur);
  }, []);

  const toggleCloneModal = useCallback(() => {
    setShowCloneModal((cur) => !cur);
  }, []);

  const toggleStreamRuleForm = useCallback(() => {
    setShowStreamRuleForm((cur) => !cur);
  }, []);

  const onDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Do you really want to remove this stream?')) {
      StreamsStore.remove(stream.id, (response) => {
        UserNotification.success(`Stream '${stream.title}' was deleted successfully.`, 'Success');

        return response;
      });
    }
  };

  const onSaveStreamRule = (_streamRuleId: string, streamRule: StreamRule) => {
    StreamRulesStore.create(stream.id, streamRule, () => UserNotification.success('Stream rule was created successfully.', 'Success'));
  };

  const onUpdate = (streamId: string, newStream: Stream) => {
    StreamsStore.update(streamId, newStream, (response) => {
      UserNotification.success(`Stream '${newStream.title}' was updated successfully.`, 'Success');

      return response;
    });
  };

  const onCloneSubmit = (streamId: string, newStream: Stream) => {
    StreamsStore.cloneStream(streamId, newStream, (response) => {
      UserNotification.success(`Stream was successfully cloned as '${newStream.title}'.`, 'Success');

      return response;
    });
  };

  return (
    <ButtonToolbar className="pull-right">
      <ShareButton entityId={stream.id} entityType="stream" onClick={toggleEntityShareModal} bsSize="xsmall" />
      <DropdownButton title="More Actions"
                      pullRight
                      id={`more-actions-dropdown-${stream.id}`}
                      bsSize="xsmall"
                      disabled={isNotEditable}>
        <IfPermitted permissions={[`streams:changestate:${stream.id}`, `streams:edit:${stream.id}`]} anyPermissions>
          <OverlayElement overlay={defaultStreamTooltip} placement="top" useOverlay={isDefaultStream} className="overlay-trigger">
            <MenuItem bsStyle="success"
                      onSelect={onToggleStreamStatus}
                      disabled={isDefaultStream || isNotEditable}>
              {stream.disabled ? 'Start Stream' : 'Stop Stream'}
            </MenuItem>
          </OverlayElement>
          <MenuItem divider />
        </IfPermitted>
        <IfPermitted permissions={[`streams:edit:${stream.id}`]}>
          <OverlayElement overlay={defaultStreamTooltip} placement="top" useOverlay={isDefaultStream} className="overlay-trigger">
            <LinkContainer disabled={isDefaultStream || isNotEditable} to={Routes.stream_edit(stream.id)}>
              <MenuItem>
                Manage Rules
              </MenuItem>
            </LinkContainer>
          </OverlayElement>
        </IfPermitted>
        <IfPermitted permissions={`streams:edit:${stream.id}`}>
          <MenuItem onSelect={toggleUpdateModal} disabled={isDefaultStream}>
            Edit stream
          </MenuItem>
        </IfPermitted>
        <IfPermitted permissions={`streams:edit:${stream.id}`}>
          <MenuItem onSelect={toggleStreamRuleForm} disabled={isDefaultStream}>
            Quick add rule
          </MenuItem>
        </IfPermitted>
        <IfPermitted permissions={['streams:create', `streams:read:${stream.id}`]}>
          <MenuItem onSelect={toggleCloneModal} disabled={isDefaultStream}>
            Clone this stream
          </MenuItem>
        </IfPermitted>
        <IfPermitted permissions={`streams:edit:${stream.id}`}>
          <LinkContainer to={Routes.stream_alerts(stream.id)}>
            <MenuItem>
              Manage Alerts
            </MenuItem>
          </LinkContainer>
        </IfPermitted>
        <HideOnCloud>
          <IfPermitted permissions="stream_outputs:read">
            <LinkContainer to={Routes.stream_outputs(stream.id)}>
              <MenuItem>
                Manage Outputs
              </MenuItem>
            </LinkContainer>
          </IfPermitted>
        </HideOnCloud>
        <MenuItem onSelect={setStartpage} disabled={currentUser.readOnly}>
          Set as startpage
        </MenuItem>

        <IfPermitted permissions={`streams:edit:${stream.id}`}>
          <MenuItem divider />
        </IfPermitted>
        <IfPermitted permissions={`streams:edit:${stream.id}`}>
          <MenuItem onSelect={onDelete} disabled={isDefaultStream}>
            Delete this stream
          </MenuItem>
        </IfPermitted>
      </DropdownButton>
      {showUpdateModal && (
        <StreamForm title="Editing Stream"
                    show
                    onSubmit={onUpdate}
                    submitButtonText="Update stream"
                    stream={stream}
                    indexSets={indexSets} />
      )}
      {showCloneModal && (
        <StreamForm title="Cloning Stream"
                    show
                    onSubmit={onCloneSubmit}
                    submitButtonText="Clone stream"
                    indexSets={indexSets} />
      )}
      {showStreamRuleForm && (
        <StreamRuleForm onClose={toggleStreamRuleForm}
                        title="New Stream Rule"
                        submitButtonText="Create Rule"
                        submitLoadingText="Creating Rule..."
                        onSubmit={onSaveStreamRule}
                        streamRuleTypes={streamRuleTypes} />
      )}
      {showEntityShareModal && (
        <EntityShareModal entityId={stream.id}
                          entityType="stream"
                          entityTitle={stream.title}
                          description="Search for a User or Team to add as collaborator on this stream."
                          onClose={toggleEntityShareModal} />
      )}
    </ButtonToolbar>
  );
};

export default StreamActions;
