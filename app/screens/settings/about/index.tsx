

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';

import {observeConfig, observeLicense} from '@queries/servers/system';

import About from './about';

import type {WithDatabaseArgs} from '@typings/database/database';

const enhanced = withObservables([], ({database}: WithDatabaseArgs) => ({
    config: observeConfig(database),
    license: observeLicense(database),
}));

export default withDatabase(enhanced(About));
