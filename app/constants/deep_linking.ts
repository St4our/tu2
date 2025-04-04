// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const DeepLinkType = {
    Channel: 'channel',
    DirectMessage: 'dm',
    GroupMessage: 'gm',
    Invalid: 'invalid',
    Permalink: 'permalink',
    Redirect: '_redirect',
    Server: 'server',
} as const;

export default DeepLinkType;
