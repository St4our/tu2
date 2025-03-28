// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useState} from 'react';
import {useIntl} from 'react-intl';

import {retryInitialTeamAndChannel} from '@actions/remote/retry';
import LoadingError from '@components/loading_error';
import {useServerDisplayName, useServerUrl} from '@context/server';
import {setTeamLoading} from '@store/team_load_store';

const LoadTeamsError = () => {
    const {formatMessage} = useIntl();
    const serverUrl = useServerUrl();
    const serverName = useServerDisplayName();
    const [loading, setLoading] = useState(false);

    const onRetryTeams = useCallback(async () => {
        setLoading(true);

        setTeamLoading(serverUrl, true);
        const {error} = await retryInitialTeamAndChannel(serverUrl);
        setTeamLoading(serverUrl, false);

        if (error) {
            setLoading(false);
        }
    }, []);

    return (
        <LoadingError
            loading={loading}
            message={formatMessage({id: 'load_teams_error.message', defaultMessage: 'There was a problem loading content for this server.'})}
            onRetry={onRetryTeams}
            title={formatMessage({id: 'load_teams_error.title', defaultMessage: "Couldn't load {serverName}"}, {serverName})}
        />
    );
};

export default LoadTeamsError;
