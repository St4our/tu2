// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {BOTTOM_TAB_ICON_SIZE} from '@constants/view';
import {changeOpacity} from '@utils/theme';

type Props = {
    isFocused: boolean;
    theme: Theme;
}

const Search = ({isFocused, theme}: Props) => {
    return (
        <View>
            <CompassIcon
                size={BOTTOM_TAB_ICON_SIZE}
                name='magnify'
                color={isFocused ? theme.buttonBg : changeOpacity(theme.centerChannelColor, 0.48)}
            />
        </View>
    );
};

export default Search;
