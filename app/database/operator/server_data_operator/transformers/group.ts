// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// See LICENSE.txt for license information.

import {MM_TABLES, OperationType} from '@constants/database';
import {prepareBaseRecord} from '@database/operator/server_data_operator/transformers/index';
import {generateGroupAssociationId} from '@utils/groups';

import type {TransformerArgs} from '@typings/database/database';
import type GroupModel from '@typings/database/models/servers/group';
import type GroupChannelModel from '@typings/database/models/servers/group_channel';
import type GroupMembershipModel from '@typings/database/models/servers/group_membership';
import type GroupTeamModel from '@typings/database/models/servers/group_team';

const {
    GROUP,
    GROUP_CHANNEL,
    GROUP_MEMBERSHIP,
    GROUP_TEAM,
} = MM_TABLES.SERVER;

/**
  * transformGroupRecord: Prepares a record of the SERVER database 'Group' table for update or create actions.
  * @param {TransformerArgs} operator
  * @param {Database} operator.database
  * @param {RecordPair} operator.value
  * @returns {Promise<GroupModel>}
  */
export const transformGroupRecord = ({action, database, value}: TransformerArgs): Promise<GroupModel> => {
    const raw = value.raw as Group;
    const record = value.record as GroupModel;
    const isCreateAction = action === OperationType.CREATE;

    // id of group comes from server response
    const fieldsMapper = (group: GroupModel) => {
        group._raw.id = isCreateAction ? (raw?.id ?? group.id) : record.id;
        group.name = raw.name;
        group.displayName = raw.display_name;
        group.source = raw.source;
        group.remoteId = raw.remote_id;
        group.memberCount = raw.member_count || 0;
    };

    return prepareBaseRecord({
        action,
        database,
        tableName: GROUP,
        value,
        fieldsMapper,
    }) as Promise<GroupModel>;
};

/**
   * transformGroupChannelRecord: Prepares a record of the SERVER database 'GroupChannel' table for update or create actions.
   * @param {TransformerArgs} operator
   * @param {Database} operator.database
   * @param {RecordPair} operator.value
   * @returns {Promise<GroupChannelModel>}
   */
export const transformGroupChannelRecord = ({action, database, value}: TransformerArgs): Promise<GroupChannelModel> => {
    const raw = value.raw as GroupChannel;

    // id of group comes from server response
    const fieldsMapper = (model: GroupChannelModel) => {
        model._raw.id = raw.id || generateGroupAssociationId(raw.group_id, raw.channel_id);
        model.groupId = raw.group_id;
        model.channelId = raw.channel_id;
    };

    return prepareBaseRecord({
        action,
        database,
        tableName: GROUP_CHANNEL,
        value,
        fieldsMapper,
    }) as Promise<GroupChannelModel>;
};

/**
   * transformGroupMembershipRecord: Prepares a record of the SERVER database 'GroupMembership' table for update or create actions.
   * @param {TransformerArgs} operator
   * @param {Database} operator.database
   * @param {RecordPair} operator.value
   * @returns {Promise<GroupMembershipModel>}
   */
export const transformGroupMembershipRecord = ({action, database, value}: TransformerArgs): Promise<GroupMembershipModel> => {
    const raw = value.raw as GroupMembership;

    // id of group comes from server response
    const fieldsMapper = (model: GroupMembershipModel) => {
        model._raw.id = raw.id || generateGroupAssociationId(raw.group_id, raw.user_id);
        model.groupId = raw.group_id;
        model.userId = raw.user_id;
    };

    return prepareBaseRecord({
        action,
        database,
        tableName: GROUP_MEMBERSHIP,
        value,
        fieldsMapper,
    }) as Promise<GroupMembershipModel>;
};

/**
   * transformGroupTeamRecord: Prepares a record of the SERVER database 'GroupTeam' table for update or create actions.
   * @param {TransformerArgs} operator
   * @param {Database} operator.database
   * @param {RecordPair} operator.value
   * @returns {Promise<GroupTeamModel>}
   */
export const transformGroupTeamRecord = ({action, database, value}: TransformerArgs): Promise<GroupTeamModel> => {
    const raw = value.raw as GroupTeam;

    // id of group comes from server response
    const fieldsMapper = (model: GroupTeamModel) => {
        model._raw.id = raw.id || generateGroupAssociationId(raw.group_id, raw.team_id);
        model.groupId = raw.group_id;
        model.teamId = raw.team_id;
    };

    return prepareBaseRecord({
        action,
        database,
        tableName: GROUP_TEAM,
        value,
        fieldsMapper,
    }) as Promise<GroupTeamModel>;
};
