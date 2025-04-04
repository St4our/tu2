// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import TurboLogger from '@mattermost/react-native-turbo-log';
import {nativeApplicationVersion, nativeBuildVersion} from 'expo-application';
import {deviceName} from 'expo-device';
import React from 'react';
import {Alert, Platform} from 'react-native';
import Share from 'react-native-share';

import SettingItem from '@components/settings/item';
import {useTheme} from '@context/theme';
import {pathWithPrefix} from '@utils/files';
import {preventDoubleTap} from '@utils/tap';

type ReportProblemProps = {
    buildNumber: string;
    currentTeamId: string;
    currentUserId: string;
    supportEmail: string;
    version: string;
    siteName: string;
};

const ReportProblem = ({buildNumber, currentTeamId, currentUserId, siteName, supportEmail, version}: ReportProblemProps) => {
    const theme = useTheme();

    const openEmailClient = preventDoubleTap(async () => {
        try {
            const logPaths = await TurboLogger.getLogPaths();
            const attachments = logPaths.map((path) => pathWithPrefix('file://', path));
            await Share.open({
                subject: `Problem with ${siteName} React Native app`,
                email: supportEmail,
                failOnCancel: false,
                urls: attachments,
                message: [
                    'Please share a description of the problem:\n\n',
                    `Current User Id: ${currentUserId}`,
                    `Current Team Id: ${currentTeamId}`,
                    `Server Version: ${version} (Build ${buildNumber})`,
                    `App Version: ${nativeApplicationVersion} (Build ${nativeBuildVersion})`,
                    `App Platform: ${Platform.OS}`,
                    `Device Model: ${deviceName}`,
                ].join('\n'),
            });
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    });

    return (
        <SettingItem
            optionLabelTextStyle={{color: theme.linkColor}}
            onPress={openEmailClient}
            optionName='report_problem'
            separator={false}
            testID='settings.report_problem.option'
            type='default'
        />
    );
};

export default ReportProblem;
