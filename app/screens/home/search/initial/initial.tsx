// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {type Dispatch, type RefObject, type SetStateAction} from 'react';

import Modifiers from './modifiers';
import RecentSearches from './recent_searches';

import type {SearchRef} from '@components/search';
import type TeamModel from '@typings/database/models/servers/team';
import type TeamSearchHistoryModel from '@typings/database/models/servers/team_search_history';
import type Animated from 'react-native-reanimated';

type Props = {
    recentSearches: TeamSearchHistoryModel[];
    scrollEnabled: Animated.SharedValue<boolean>;
    searchValue?: string;
    setRecentValue: Dispatch<SetStateAction<string>>;
    searchRef: RefObject<SearchRef>;
    setSearchValue: Dispatch<SetStateAction<string>>;
    setTeamId: (value: string) => void;
    teamId: string;
    teamName: string;
    teams: TeamModel[];
}

const Initial = ({recentSearches, scrollEnabled, searchValue, setRecentValue, searchRef, teamId, teamName, teams, setTeamId, setSearchValue}: Props) => {
    return (
        <>
            <Modifiers
                searchValue={searchValue}
                searchRef={searchRef}
                setSearchValue={setSearchValue}
                setTeamId={setTeamId}
                teamId={teamId}
                teams={teams}
                scrollEnabled={scrollEnabled}
            />
            {Boolean(recentSearches.length) &&
                <RecentSearches
                    recentSearches={recentSearches}
                    setRecentValue={setRecentValue}
                    teamName={teamName}
                />
            }
        </>
    );
};

export default Initial;
