// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {isYoutubeLink} from '@utils/url';

import EmbeddedBindings from './embedded_bindings';
import ImagePreview from './image_preview';
import MessageAttachments from './message_attachments';
import Opengraph from './opengraph';
import YouTube from './youtube';

import type PostModel from '@typings/database/models/servers/post';

type ContentProps = {
    isReplyPost: boolean;
    layoutWidth?: number;
    location: string;
    post: PostModel;
    theme: Theme;
}

const contentType: Record<string, string> = {
    app_bindings: 'app_bindings',
    image: 'image',
    message_attachment: 'message_attachment',
    opengraph: 'opengraph',
    youtube: 'youtube',
};

const Content = ({isReplyPost, layoutWidth, location, post, theme}: ContentProps) => {
    let type: string | undefined = post.metadata?.embeds?.[0].type;
    if (!type && post.props?.app_bindings?.length) {
        type = contentType.app_bindings;
    }

    if (!type) {
        return null;
    }

    switch (contentType[type]) {
        case contentType.image:
            return (
                <ImagePreview
                    isReplyPost={isReplyPost}
                    layoutWidth={layoutWidth}
                    location={location}
                    metadata={post.metadata}
                    postId={post.id}
                    theme={theme}
                />
            );
        case contentType.opengraph:
            if (isYoutubeLink(post.metadata!.embeds![0].url)) {
                return (
                    <YouTube
                        isReplyPost={isReplyPost}
                        layoutWidth={layoutWidth}
                        metadata={post.metadata}
                    />
                );
            }

            return (
                <Opengraph
                    isReplyPost={isReplyPost}
                    layoutWidth={layoutWidth}
                    location={location}
                    metadata={post.metadata}
                    postId={post.id}
                    removeLinkPreview={post.props?.remove_link_preview === 'true'}
                    theme={theme}
                />
            );
        case contentType.message_attachment:
            if (post.props.attachments?.length) {
                return (
                    <MessageAttachments
                        attachments={post.props.attachments}
                        channelId={post.channelId}
                        layoutWidth={layoutWidth}
                        location={location}
                        metadata={post.metadata}
                        postId={post.id}
                        theme={theme}
                    />
                );
            }
            break;
        case contentType.app_bindings:
            if (post.props.app_bindings?.length) {
                return (
                    <EmbeddedBindings
                        location={location}
                        post={post}
                        theme={theme}
                    />
                );
            }
            break;
    }

    return null;
};

export default Content;
