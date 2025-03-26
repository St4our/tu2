
import React from 'react';
import {View} from 'react-native';

import Markdown from '@components/markdown';
import {useTheme} from '@context/theme';
import {getMarkdownBlockStyles, getMarkdownTextStyles} from '@utils/markdown';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => {
    return {
        helpTextContainer: {
            marginHorizontal: 15,
            marginTop: 10,
        },
        helpText: {
            fontSize: 12,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
        errorTextContainer: {
            marginHorizontal: 15,
            marginVertical: 10,
        },
        errorText: {
            fontSize: 12,
            color: theme.errorTextColor,
        },
    };
});

type Props = {
    disabled: boolean;
    disabledText?: string;
    helpText?: string;
    errorText?: string;
}
function Footer({
    disabled,
    disabledText,
    helpText,
    errorText,
}: Props) {
    const theme = useTheme();
    const style = getStyleSheet(theme);
    const textStyles = getMarkdownTextStyles(theme);
    const blockStyles = getMarkdownBlockStyles(theme);

    return (
        <>
            {disabled && Boolean(disabledText) && (
                <View style={style.helpTextContainer} >
                    <Markdown
                        baseTextStyle={style.helpText}
                        textStyles={textStyles}
                        disableAtMentions={true}
                        location=''
                        blockStyles={blockStyles}
                        value={disabledText}
                        theme={theme}
                    />
                </View>
            )}
            {Boolean(helpText) && (
                <View style={style.helpTextContainer} >
                    <Markdown
                        baseTextStyle={style.helpText}
                        textStyles={textStyles}
                        blockStyles={blockStyles}
                        disableAtMentions={true}
                        location=''
                        value={helpText}
                        theme={theme}
                    />
                </View>
            )}
            {Boolean(errorText) && (
                <View style={style.errorTextContainer} >
                    <Markdown
                        baseTextStyle={style.errorText}
                        textStyles={textStyles}
                        blockStyles={blockStyles}
                        disableAtMentions={true}
                        location=''
                        value={errorText}
                        theme={theme}
                    />
                </View>
            )}
        </>
    );
}

export default Footer;
