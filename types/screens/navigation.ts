// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Screens} from '@constants';
import type {OptionsTopBarButton} from 'react-native-navigation/lib/src/interfaces/Options';

export type NavButtons = {
    leftButtons?: OptionsTopBarButton[];
    rightButtons?: OptionsTopBarButton[];
}

type ScreenKeys = keyof typeof Screens;
export type AvailableScreens = typeof Screens[ScreenKeys];
