// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

type SsoOption = {
    enabled: boolean;
    text?: string;
};

type SsoWithOptions = Record<string, SsoOption>;
