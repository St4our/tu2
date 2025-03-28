// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';
import {type StyleProp, Text, type TextStyle} from 'react-native';

import {joinChannel, switchToChannelById} from '@actions/remote/channel';
import {useServerUrl} from '@context/server';
import {t} from '@i18n';
import {alertErrorWithFallback} from '@utils/draft';
import {preventDoubleTap} from '@utils/tap';

import type ChannelModel from '@typings/database/models/servers/channel';
import type TeamModel from '@typings/database/models/servers/team';

export type ChannelMentions = Record<string, {id?: string; display_name: string; name?: string; team_name: string}>;

type ChannelMentionProps = {
    channelMentions?: ChannelMentions;
    channelName: string;
    channels: ChannelModel[];
    currentTeamId: string;
    linkStyle: StyleProp<TextStyle>;
    team: TeamModel;
    textStyle: StyleProp<TextStyle>;
}

function getChannelFromChannelName(name: string, channels: ChannelModel[], channelMentions: ChannelMentions = {}, teamName: string) {
    const channelsByName = channelMentions;
    let channelName = name;

    channels.forEach((c) => {
        channelsByName[c.name] = {
            id: c.id,
            display_name: c.displayName,
            name: c.name,
            team_name: teamName,
        };
    });

    while (channelName.length > 0) {
        if (channelsByName[channelName]) {
            return channelsByName[channelName];
        }

        // Repeatedly trim off trailing punctuation in case this is at the end of a sentence
        if ((/[_-]$/).test(channelName)) {
            channelName = channelName.substring(0, channelName.length - 1);
        } else {
            break;
        }
    }

    return null;
}

const ChannelMention = ({
    channelMentions, channelName, channels, currentTeamId,
    linkStyle, team, textStyle,
}: ChannelMentionProps) => {
    const intl = useIntl();
    const serverUrl = useServerUrl();
    const channel = getChannelFromChannelName(channelName, channels, channelMentions, team.name);

    const handlePress = preventDoubleTap(async () => {
        let c = channel;

        if (!c?.id && c?.display_name) {
            const result = await joinChannel(serverUrl, currentTeamId, undefined, channelName);
            if (result.error || !result.channel) {
                const joinFailedMessage = {
                    id: t('mobile.join_channel.error'),
                    defaultMessage: "We couldn't join the channel {displayName}.",
                };
                alertErrorWithFallback(intl, result.error || {}, joinFailedMessage, {displayName: c.display_name});
            } else if (result.channel) {
                c = {
                    ...c,
                    id: result.channel.id,
                    name: result.channel.name,
                };
            }
        }

        if (c?.id) {
            switchToChannelById(serverUrl, c.id);
        }
    });

    if (!channel) {
        return <Text style={textStyle}>{`~${channelName}`}</Text>;
    }

    let suffix;
    if (channel.name) {
        suffix = channelName.substring(channel.name.length);
    }

    return (
        <Text style={textStyle}>
            <Text
                onPress={handlePress}
                style={linkStyle}
            >
                {`~${channel.display_name}`}
            </Text>
            {suffix}
        </Text>
    );
};

export default ChannelMention;
