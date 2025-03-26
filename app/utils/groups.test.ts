// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {generateGroupAssociationId} from './groups';

describe('groups utility', () => {
    test('generateGroupAssociationId', () => {
        expect(generateGroupAssociationId('groupId', 'otherId')).toEqual('groupId-otherId');
    });
});
