// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';

import UserAvatar from './user_avatar';

import type UserModel from '@typings/database/models/servers/user';

const enhanced = withObservables(['user'], ({user}: {user: UserModel}) => {
    return {
        user: user.observe(),
    };
});

export default withDatabase(enhanced(UserAvatar));
