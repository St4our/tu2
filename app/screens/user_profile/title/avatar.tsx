

import {Image} from 'expo-image';
import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated from 'react-native-reanimated';

import ProfilePicture from '@components/profile_picture';

import type UserModel from '@typings/database/models/servers/user';

const AnimatedImage = Animated.createAnimatedComponent(Image);

type Props = {
    enablePostIconOverride: boolean;
    forwardRef?: React.RefObject<any>;
    imageSize?: number;
    user: UserModel;
    userIconOverride?: string;
}

const DEFAULT_IMAGE_SIZE = 96;

const getStyles = (size?: number) => {
    return StyleSheet.create({
        avatar: {
            borderRadius: 48,
            height: size || DEFAULT_IMAGE_SIZE,
            width: size || DEFAULT_IMAGE_SIZE,
        },
    });
};

const UserProfileAvatar = ({enablePostIconOverride, forwardRef, imageSize, user, userIconOverride}: Props) => {
    const styles = useMemo(() => getStyles(imageSize), [imageSize]);

    if (enablePostIconOverride && userIconOverride) {
        return (
            <View style={styles.avatar}>
                <AnimatedImage
                    ref={forwardRef}
                    style={styles.avatar}
                    source={{uri: userIconOverride}}
                />
            </View>
        );
    }

    return (
        <ProfilePicture
            author={user}
            forwardRef={forwardRef}
            showStatus={true}
            size={imageSize || DEFAULT_IMAGE_SIZE}
            statusSize={24}
            testID={`user_profile_avatar.${user.id}.profile_picture`}
        />
    );
};

export default UserProfileAvatar;
