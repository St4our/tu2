// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import RNUtils from '@mattermost/rnutils';
import performance from 'react-native-performance';

import {mockApiClient} from '@test/mock_api_client';
import TestHelper from '@test/test_helper';
import {logWarning} from '@utils/log';

import NetworkManager from '../network_manager';

import {testExports as batcherTestExports} from './performance_metrics_batcher';
import {getBaseReportRequest} from './test_utils';

import {testExports} from '.';

const PerformanceMetricsManagerClass = testExports.PerformanceMetricsManager;
const {
    RETRY_TIME,
    MAX_RETRIES,
} = testExports;

const {
    INTERVAL_TIME,
} = batcherTestExports;

const TEST_EPOCH = 1577836800000;
jest.mock('@utils/log', () => ({
    logDebug: jest.fn(),
    logWarning: jest.fn(),
}));

performance.timeOrigin = TEST_EPOCH;

describe('load metrics', () => {
    const serverUrl = 'http://www.someserverurl.com/';
    const expectedUrl = `${serverUrl}/api/v4/client_perf`;
    let PerformanceMetricsManager = new PerformanceMetricsManagerClass();

    const getMeasure = (timestamp: number, value: number): PerformanceReportMeasure => {
        return {
            metric: 'mobile_load',
            timestamp,
            value,
        };
    };

    beforeEach(async () => {
        NetworkManager.createClient(serverUrl);
        const {operator} = await TestHelper.setupServerDatabase(serverUrl);
        await operator.handleConfigs({configs: [{id: 'EnableClientMetrics', value: 'true'}], configsToDelete: [], prepareRecordsOnly: false});
        jest.useFakeTimers({doNotFake: [
            'cancelAnimationFrame',
            'cancelIdleCallback',
            'clearImmediate',
            'clearInterval',
            'clearTimeout',
            'hrtime',
            'nextTick',
            'queueMicrotask',
            'requestAnimationFrame',
            'requestIdleCallback',
            'setImmediate',
            'setInterval',
        ]}).setSystemTime(new Date(TEST_EPOCH));
        PerformanceMetricsManager = new PerformanceMetricsManagerClass();

        const mockHasRegisteredLoad = {hasRegisteredLoad: false};
        jest.mocked(RNUtils.setHasRegisteredLoad).mockImplementation(() => {
            mockHasRegisteredLoad.hasRegisteredLoad = true;
        });
        jest.mocked(RNUtils.getHasRegisteredLoad).mockImplementation(() => mockHasRegisteredLoad);
    });
    afterEach(async () => {
        jest.useRealTimers();
        NetworkManager.invalidateClient(serverUrl);
        await TestHelper.tearDown();
        performance.clearMarks();
    });

    it('only load on target', async () => {
        performance.mark('nativeLaunchStart');
        const measure = getMeasure(TEST_EPOCH + INTERVAL_TIME, INTERVAL_TIME);
        const expectedRequest = getBaseReportRequest(measure.timestamp, measure.timestamp + 1);
        expectedRequest.body.histograms = [measure];

        PerformanceMetricsManager.setLoadTarget('CHANNEL');
        PerformanceMetricsManager.finishLoad('HOME', serverUrl);
        await TestHelper.tick();
        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).not.toHaveBeenCalled();
        PerformanceMetricsManager.finishLoad('CHANNEL', serverUrl);
        await TestHelper.tick();
        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).toHaveBeenCalledWith(expectedUrl, expectedRequest);
    });

    it('only register load once', async () => {
        performance.mark('nativeLaunchStart');
        const measure = getMeasure(TEST_EPOCH, 0);
        const expectedRequest = getBaseReportRequest(measure.timestamp, measure.timestamp + 1);
        expectedRequest.body.histograms = [measure];

        PerformanceMetricsManager.setLoadTarget('HOME');
        PerformanceMetricsManager.finishLoad('HOME', serverUrl);
        await TestHelper.tick();
        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).toHaveBeenCalledWith(expectedUrl, expectedRequest);
        mockApiClient.post.mockClear();
        PerformanceMetricsManager.finishLoad('HOME', serverUrl);
        await TestHelper.tick();
        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('retry if the mark is not yet present', async () => {
        const measure = getMeasure(TEST_EPOCH + (RETRY_TIME * 2), RETRY_TIME);
        const expectedRequest = getBaseReportRequest(measure.timestamp, measure.timestamp + 1);
        expectedRequest.body.histograms = [measure];

        PerformanceMetricsManager.setLoadTarget('CHANNEL');
        PerformanceMetricsManager.finishLoad('CHANNEL', serverUrl);
        await TestHelper.tick();
        jest.advanceTimersByTime(RETRY_TIME);
        await TestHelper.tick();
        performance.mark('nativeLaunchStart');
        await TestHelper.tick();
        jest.advanceTimersByTime(RETRY_TIME);
        await TestHelper.tick();
        await TestHelper.tick();
        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).toHaveBeenCalledWith(expectedUrl, expectedRequest);
    });

    it('fail graciously if no measure is set', async () => {
        PerformanceMetricsManager.setLoadTarget('CHANNEL');
        PerformanceMetricsManager.finishLoad('CHANNEL', serverUrl);
        for (let i = 0; i < MAX_RETRIES; i++) {
            // eslint-disable-next-line no-await-in-loop
            await TestHelper.tick();
            jest.advanceTimersByTime(MAX_RETRIES);
            // eslint-disable-next-line no-await-in-loop
            await TestHelper.tick();
        }
        await TestHelper.tick();
        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).not.toHaveBeenCalled();
        expect(logWarning).toHaveBeenCalled();
    });
});

describe('other metrics', () => {
    const serverUrl1 = 'http://www.someserverurl.com/';
    const expectedUrl1 = `${serverUrl1}/api/v4/client_perf`;

    const serverUrl2 = 'http://www.otherserverurl.com/';
    const expectedUrl2 = `${serverUrl2}/api/v4/client_perf`;

    const measure1: PerformanceReportMeasure = {
        metric: 'mobile_channel_switch',
        timestamp: TEST_EPOCH + 100,
        value: 100,
    };

    const measure2: PerformanceReportMeasure = {
        metric: 'mobile_team_switch',
        timestamp: TEST_EPOCH + 150 + 50,
        value: 150,
    };

    const PerformanceMetricsManager = new PerformanceMetricsManagerClass();

    beforeEach(async () => {
        NetworkManager.createClient(serverUrl1);
        NetworkManager.createClient(serverUrl2);
        const {operator: operator1} = await TestHelper.setupServerDatabase(serverUrl1);
        const {operator: operator2} = await TestHelper.setupServerDatabase(serverUrl2);
        await operator1.handleConfigs({configs: [{id: 'EnableClientMetrics', value: 'true'}], configsToDelete: [], prepareRecordsOnly: false});
        await operator2.handleConfigs({configs: [{id: 'EnableClientMetrics', value: 'true'}], configsToDelete: [], prepareRecordsOnly: false});
        jest.useFakeTimers({doNotFake: [
            'cancelAnimationFrame',
            'cancelIdleCallback',
            'clearImmediate',
            'clearInterval',
            'clearTimeout',
            'hrtime',
            'nextTick',
            'queueMicrotask',
            'requestAnimationFrame',
            'requestIdleCallback',
            'setImmediate',
            'setInterval',
        ]}).setSystemTime(new Date(TEST_EPOCH));
    });
    afterEach(async () => {
        jest.useRealTimers();
        NetworkManager.invalidateClient(serverUrl1);
        NetworkManager.invalidateClient(serverUrl2);
        await TestHelper.tearDown();
        performance.clearMarks();
    });

    it('do not send metrics when we do not start them', async () => {
        PerformanceMetricsManager.endMetric('mobile_channel_switch', serverUrl1);

        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('send metric after it has been started', async () => {
        const expectedRequest = getBaseReportRequest(measure1.timestamp, measure1.timestamp + 1);
        expectedRequest.body.histograms = [measure1];

        PerformanceMetricsManager.startMetric('mobile_channel_switch');
        jest.advanceTimersByTime(100);

        PerformanceMetricsManager.endMetric('mobile_channel_switch', serverUrl1);
        await TestHelper.tick();

        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).toHaveBeenCalledWith(expectedUrl1, expectedRequest);
    });

    it('a second end metric does not generate a second measure', async () => {
        const expectedRequest = getBaseReportRequest(measure1.timestamp, measure1.timestamp + 1);
        expectedRequest.body.histograms = [measure1];

        PerformanceMetricsManager.startMetric('mobile_channel_switch');
        jest.advanceTimersByTime(100);

        PerformanceMetricsManager.endMetric('mobile_channel_switch', serverUrl1);
        await TestHelper.tick();
        jest.advanceTimersByTime(100);

        PerformanceMetricsManager.endMetric('mobile_channel_switch', serverUrl1);
        await TestHelper.tick();

        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).toHaveBeenCalledWith(expectedUrl1, expectedRequest);
    });

    it('different metrics do not interfere', async () => {
        const expectedRequest = getBaseReportRequest(measure1.timestamp, measure2.timestamp);
        expectedRequest.body.histograms = [measure1, measure2];

        PerformanceMetricsManager.startMetric('mobile_channel_switch');
        jest.advanceTimersByTime(50);
        PerformanceMetricsManager.startMetric('mobile_team_switch');
        jest.advanceTimersByTime(50);

        PerformanceMetricsManager.endMetric('mobile_channel_switch', serverUrl1);
        await TestHelper.tick();
        jest.advanceTimersByTime(100);
        PerformanceMetricsManager.endMetric('mobile_team_switch', serverUrl1);
        await TestHelper.tick();

        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).toHaveBeenCalledWith(expectedUrl1, expectedRequest);
    });

    it('metrics to different servers do not interfere', async () => {
        const expectedRequest1 = getBaseReportRequest(measure1.timestamp, measure1.timestamp + 1);
        expectedRequest1.body.histograms = [measure1];

        const expectedRequest2 = getBaseReportRequest(measure2.timestamp, measure2.timestamp + 1);
        expectedRequest2.body.histograms = [measure2];

        PerformanceMetricsManager.startMetric('mobile_channel_switch');
        jest.advanceTimersByTime(50);
        PerformanceMetricsManager.startMetric('mobile_team_switch');
        jest.advanceTimersByTime(50);

        PerformanceMetricsManager.endMetric('mobile_channel_switch', serverUrl1);
        await TestHelper.tick();
        jest.advanceTimersByTime(100);
        PerformanceMetricsManager.endMetric('mobile_team_switch', serverUrl2);
        await TestHelper.tick();

        jest.advanceTimersByTime(INTERVAL_TIME);
        await TestHelper.tick();
        expect(mockApiClient.post).toHaveBeenCalledWith(expectedUrl1, expectedRequest1);
        expect(mockApiClient.post).toHaveBeenCalledWith(expectedUrl2, expectedRequest2);
    });
});
