// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withObservables} from '@nozbe/watermelondb/react';

import {observeCanUploadFiles, observeConfigIntValue, observeMaxFileCount} from '@queries/servers/system';

import Attachments from './attachments';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhanced = withObservables(['database'], ({database}: WithDatabaseArgs) => ({
    canUploadFiles: observeCanUploadFiles(database),
    maxFileCount: observeMaxFileCount(database),
    maxFileSize: observeConfigIntValue(database, 'MaxFileSize'),
}));

export default enhanced(Attachments);
