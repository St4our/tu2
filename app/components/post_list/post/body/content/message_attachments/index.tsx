// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleSheet, View} from 'react-native';

import MessageAttachment from './message_attachment';

type Props = {
    attachments: MessageAttachment[];
    channelId: string;
    layoutWidth?: number;
    location: string;
    metadata?: PostMetadata | undefined | null;
    postId: string;
    theme: Theme;
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        flexDirection: 'column',
    },
});

const MessageAttachments = ({attachments, channelId, layoutWidth, location, metadata, postId, theme}: Props) => {
    const content: React.ReactNode[] = [];

    attachments.forEach((attachment, i) => {
        content.push(
            <MessageAttachment
                attachment={attachment}
                channelId={channelId}
                key={'att_' + i.toString()}
                layoutWidth={layoutWidth}
                location={location}
                metadata={metadata}
                postId={postId}
                theme={theme}
            />,
        );
    });

    return (
        <View style={styles.content}>
            {content}
        </View>
    );
};

export default MessageAttachments;
