import React, { useMemo, useState, useEffect } from 'react';
import { Modal, TouchableWithoutFeedback, Platform, Text, View, Image } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import ViewConstants from '@constants/view';
import { changeOpacity, makeStyleSheetFromTheme } from '@utils/theme';
import { typography } from '@utils/typography';
import { WebView } from 'react-native-webview';
import { executeCommand } from '@actions/remote/command';
import { getCurrentTeamId } from '@queries/servers/system';
import { useServerUrl } from '@context/server';
import { useIntl } from 'react-intl';
import DatabaseManager from '@database/manager';
import { getCurrentChannelId } from '@queries/servers/system';

import NetworkManager from '@managers/network_manager';

export type HeaderRightButton = {
    borderless?: boolean;
    buttonType?: 'native' | 'opacity' | 'highlight';
    color?: string;
    iconName: string;
    onPress: () => void;
    rippleRadius?: number;
    testID?: string;
}

type Props = {
    defaultHeight: number;
    hasSearch: boolean;
    isLargeTitle: boolean;
    heightOffset: number;
    leftComponent?: React.ReactElement;
    onBackPress?: () => void;
    onTitlePress?: () => void;
    rightButtons?: HeaderRightButton[];
    scrollValue?: Animated.SharedValue<number>;
    showBackButton?: boolean;
    subtitle?: string;
    subtitleCompanion?: React.ReactElement;
    theme: Theme;
    title?: string;
}

const hitSlop = { top: 20, bottom: 20, left: 20, right: 20 };
const rightButtonHitSlop = { top: 20, bottom: 5, left: 5, right: 5 };

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    centered: {
        alignItems: Platform.select({ android: 'flex-start', ios: 'center' }),
    },
    container: {
        alignItems: 'center',
        backgroundColor: theme.sidebarBg,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    subtitleContainer: {
        flexDirection: 'row',
        justifyContent: Platform.select({ android: 'flex-start', ios: 'center' }),
        left: Platform.select({ ios: undefined, default: 3 }),
    },
    subtitle: {
        color: changeOpacity(theme.sidebarHeaderTextColor, 0.72),
        ...typography('Body', 75),
        lineHeight: 12,
        marginBottom: 8,
        marginTop: 2,
        height: 13,
    },
    titleContainer: {
        alignItems: Platform.select({ android: 'flex-start', ios: 'center' }),
        justifyContent: 'center',
        flex: 3,
        height: '100%',
        paddingHorizontal: 8,
        ...Platform.select({
            ios: {
                paddingHorizontal: 60,
                flex: undefined,
                width: '100%',
                position: 'absolute',
                left: 16,
                bottom: 0,
                zIndex: 1,
            },
        }),
    },
    callLogo: {
        width: 25,
        height: 25,
        marginLeft: -45,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webView: {
        height: '80%',
    },
    leftAction: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    leftContainer: {
        height: '100%',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                paddingLeft: 16,
                zIndex: 5,
                position: 'absolute',
                bottom: 0,
            },
        }),
    },
    rightContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        height: '100%',
        justifyContent: 'flex-end',
        ...Platform.select({
            ios: {
                right: 16,
                bottom: 0,
                position: 'absolute',
                zIndex: 2,
            },
        }),
    },
    rightIcon: {
        marginLeft: 10,
        bottom: 10,
    },
    title: {
        color: theme.sidebarHeaderTextColor,
        ...typography('Heading', 300),
    },
}));

const Header = ({
    defaultHeight,
    hasSearch,
    isLargeTitle,
    heightOffset,
    leftComponent,
    onBackPress,
    onTitlePress,
    rightButtons,
    scrollValue,
    showBackButton = true,
    subtitle,
    subtitleCompanion,
    theme,
    title,
}: Props) => {
    const serverUrl = useServerUrl();
    const intl = useIntl();
    const [isVisible, setIsVisible] = useState(false);
    const [randomNumber, setRandomNumber] = useState(null);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const handleClose = () => {
        setIsVisible(false);
    };

    const styles = getStyleSheet(theme);
    const insets = useSafeAreaInsets();

    const opacity = useAnimatedStyle(() => {
        if (!isLargeTitle) {
            return { opacity: 1 };
        }

        if (hasSearch) {
            return { opacity: 0 };
        }

        const barHeight = heightOffset - ViewConstants.LARGE_HEADER_TITLE_HEIGHT;
        const val = (scrollValue?.value || 0);
        const showDuration = 200;
        const hideDuration = 50;
        const duration = val >= barHeight ? showDuration : hideDuration;
        const opacityValue = val >= barHeight ? 1 : 0;
        return {
            opacity: withTiming(opacityValue, { duration }),
        };
    }, [heightOffset, isLargeTitle, hasSearch]);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        height: defaultHeight,
        paddingTop: insets.top,
    }), [defaultHeight]);

    const containerStyle = useMemo(() => (
        [styles.container, containerAnimatedStyle]), [styles, containerAnimatedStyle]);

    const additionalTitleStyle = useMemo(() => ({
        marginLeft: Platform.select({ android: showBackButton && !leftComponent ? 20 : 0 }),
    }), [leftComponent, showBackButton, theme]);

    useEffect(() => {
        const generateRandomNumber = () => {
            const min = 1001;
            const max = 9099;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        const randomNum = generateRandomNumber();
        setRandomNumber(randomNum);
    }, []);

    const urlCall = `https://alpha.jitsi.net/${title}${randomNumber}${title}#config.disableDeepLinking=true`;

    const handlePress = async () => {
        if (isSendingMessage) return;
        setIsSendingMessage(true);

        try {
            const message = urlCall;
            const { database } = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
            const channelId = await getCurrentChannelId(database);
            const team_id = await getCurrentTeamId(database);
            const rootId = ""

            const args: CommandArgs = {
                channel_id: channelId,
                team_id: team_id,
                root_id: rootId,
                parent_id: rootId,

                // channel_id: channelId,
                // team_id: team_id,
                // root_id: '',
            };
            console.log("---------------------START-----------------------------")
            console.log("Check:", serverUrl)
            console.log("--------------------------------------------------------")
            // console.log("Ckeck2:", intl )
            // console.log("--------------------------------------------------------")
            console.log("Ckeck3:", message)
            console.log("--------------------------------------------------------")
            console.log("Ckeck4:", channelId )
            console.log("--------------------------------------------------------")
            console.log("Ckeck5:", team_id )
            console.log("----------------------END--------------------------11")
            
            // const client = NetworkManager.getClient(serverUrl);
            // client.executeCommand(message, args).then(data => {
            //     // Обработка ответа от сервера
            //   }).catch(error => {
            //     console.error('Error sending message:', error);
            //   });

            const result = await executeCommand(serverUrl, intl, message, channelId, rootId);

            if (result.error) {
            console.error('Error sending messageaaa:', result.error);
            console.error('Error more:', result);
            return;
            }
            
            if (result.data) {
            console.log('Message sent successfully');
            // const result = await executeCommand(serverUrl, intl, message, channelId, args.root_id);
            
            // if (result.error) {
            //     console.error('Ошибка при отправке сообщения:', result.error);
            // } else {
            //     console.log('Сообщение успешно отправлено');
            // }
        } 
    }
        catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
        } 
        finally {
            setIsSendingMessage(false);
        }
    };

    return (
        <Animated.View style={containerStyle}>
            {showBackButton &&
                <Animated.View style={styles.leftContainer}>
                    <TouchableWithFeedback
                        borderlessRipple={true}
                        onPress={onBackPress}
                        rippleRadius={20}
                        type={Platform.select({ android: 'native', default: 'opacity' })}
                        testID='navigation.header.back'
                        hitSlop={hitSlop}
                    >
                        <Animated.View style={styles.leftAction}>
                            <CompassIcon
                                size={24}
                                name={Platform.select({ android: 'arrow-left', ios: 'arrow-back-ios' })!}
                                color={theme.sidebarHeaderTextColor}
                            />
                            {leftComponent}
                        </Animated.View>
                    </TouchableWithFeedback>
                </Animated.View>
            }
            <Animated.View style={[styles.titleContainer, additionalTitleStyle]}>
                <TouchableWithFeedback
                    disabled={!onTitlePress}
                    onPress={onTitlePress}
                    type='opacity'
                >
                    <View style={styles.centered}>
                        {!hasSearch &&
                            <Animated.Text
                                ellipsizeMode='tail'
                                numberOfLines={1}
                                style={[styles.title, opacity]}
                                testID='navigation.header.title'
                            >
                                {title}
                            </Animated.Text>
                        }
                        {!isLargeTitle && Boolean(subtitle || subtitleCompanion) &&
                            <View style={styles.subtitleContainer}>
                                <Text
                                    ellipsizeMode='tail'
                                    numberOfLines={1}
                                    style={styles.subtitle}
                                    testID='navigation.header.subtitle'
                                >
                                    {subtitle}
                                </Text>
                                {subtitleCompanion}
                            </View>
                        }
                    </View>
                </TouchableWithFeedback>
            </Animated.View>

            <TouchableWithFeedback onPress={handlePress}>
                <Image
                    style={styles.callLogo}
                    source={require('./call.png')}
                />
            </TouchableWithFeedback>

            <Modal
                visible={isVisible}
                transparent={true}
                onRequestClose={handleClose}
            >
                <WebView
                    source={{ uri: `${urlCall}` }}
                    webviewDebuggingEnabled={true}
                />
            </Modal>

            <Animated.View style={styles.rightContainer}>
                {Boolean(rightButtons?.length) &&
                    rightButtons?.map((r, i) => (
                        <TouchableWithFeedback
                            key={r.iconName}
                            borderlessRipple={r.borderless === undefined ? true : r.borderless}
                            hitSlop={rightButtonHitSlop}
                            onPress={r.onPress}
                            rippleRadius={r.rippleRadius || 10}
                            type={r.buttonType || Platform.select({ android: 'native', default: 'opacity' })}
                            style={i > 0 && styles.rightIcon}
                            testID={r.testID}
                        >
                            <CompassIcon
                                size={24}
                                name={r.iconName}
                                color={r.color || theme.sidebarHeaderTextColor}
                            />
                        </TouchableWithFeedback>
                    ))
                }
            </Animated.View>
        </Animated.View>
    );
};

export default React.memo(Header);