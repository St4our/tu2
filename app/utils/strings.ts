// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export function nonBreakingString(s: string) {
    return s.replace(/ /g, '\xa0');
}
