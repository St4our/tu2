import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { TouchableOpacity, Modal, TouchableWithoutFeedback, Platform, Text, View, Image } from 'react-native';
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
import urlParse from 'url-parse';

import { sendEphemeralPost } from '@actions/local/post'
import {getCurrentUserId} from '@queries/servers/system';
import { createPost } from '@actions/remote/post'
import {PostPriorityType} from '@constants/post';
import {updateDraftPriority} from '@actions/local/draft';
import { NONE } from '@app/constants/notification_level';


import {JitsiMeeting} from '@jitsi/react-native-sdk';

import {getActiveServerUrl} from '@init/credentials';
import {getCSRFFromCookie} from '@utils/security';


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
    postPriority: PostPriority
    files: FileInfo[];
    channelId: string;
    currentUserId: string;
    rootId: string;
    canShowPostPriority?: boolean;
}



export const INITIAL_PRIORITY = {
    priority: PostPriorityType.STANDARD,
    requested_ack: false,
    persistent_notifications: false,
};

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
    // modalContainer: {
    //     flex: 1,
    //     backgroundColor: 'rgba(0,0,0,0.7)',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },
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
    buttonText: {
        color: 'white',
        fontSize: 16,
      },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalView: {
        backgroundColor: 'black',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      modalText: {
        fontSize: 18,
        marginBottom: 15,
        textAlign: 'center',
      },
      closeButton: {
        backgroundColor: 'rgb(63, 67, 80)',
        padding: 10,
        borderRadius: 5,
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
    postPriority,
    files,
    channelId,
    currentUserId,
    rootId,
    canShowPostPriority,
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
        console.log('-------------------------') 
        // setIsVisible(true);
        const currentServerUrl = await getActiveServerUrl();
        console.log(currentServerUrl)
        const csrfToken = await getCSRFFromCookie(serverUrl);
        console.log(csrfToken)

        const client = NetworkManager.getClient(serverUrl);
        // console.log(client)
        const { database } = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const channelId = await getCurrentChannelId(database);
        console.log(channelId)

        try {
            const response = await fetch('https://demo.team-up.tech/plugins/jitsi/api/v1/meetings', {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'text/plain;charset=UTF-8',
                    'Cookie': '', // Replace with actual cookies
                    'Origin': 'https://demo.team-up.tech',
                    'Priority': 'u=1, i',
                    'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    'Sec-CH-UA-Mobile': '?0',
                    'Sec-CH-UA-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': '',
                    'X-CSRF-Token': {csrfToken}, // Ensure this is the correct CSRF token
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    channel_id: channelId, // Ensure the correct channel ID is used
                    personal: false,
                    topic: '',
                    meeting_id: '',
                }),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('Meeting created successfully:', data);
    
        } catch (error) {
            console.error('Error creating meeting:', error);
        }
    
        setIsVisible(true);
        console.log('----------END------------');
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
            
            {!isLargeTitle && Boolean(subtitle || subtitleCompanion) &&
            <TouchableOpacity onPress={handlePress} hitSlop={{ 
                top: 40, 
                bottom: 40, 
                left: 40, 
                right: 40 
              }}>
                
                <Image
                    style={styles.callLogo}
                    source={require('./call.png')}
                    
                />
            </TouchableOpacity>
            }

            <Modal
                animationType="slide"
                visible={isVisible}
                transparent={true}
                onRequestClose={handleClose}
                // onRequestClose={() => { console.log('Modal has been closed'); }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Конференция создана!</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.buttonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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