// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';

import Markdown from '@components/markdown';
import {useTheme} from '@context/theme';
import {getMarkdownTextStyles, getMarkdownBlockStyles} from '@utils/markdown';
import {makeStyleSheetFromTheme} from '@utils/theme';

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        introductionTextView: {
            marginHorizontal: 15,
        },
        introductionText: {
            color: theme.centerChannelColor,
        },
    };
});

type Props = {
    value: string;
}

function DialogIntroductionText({value}: Props) {
    const theme = useTheme();
    const style = getStyleFromTheme(theme);
    const blockStyles = getMarkdownBlockStyles(theme);
    const textStyles = getMarkdownTextStyles(theme);

    return (
        <View style={style.introductionTextView}>
            <Markdown
                baseTextStyle={style.introductionText}
                disableGallery={true}
                textStyles={textStyles}
                blockStyles={blockStyles}
                value={value}
                disableHashtags={true}
                disableAtMentions={true}
                disableChannelLink={true}
                location=''
                theme={theme}
            />
        </View>
    );
}

export default DialogIntroductionText;
