/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/PageViewData.ts" />
/// <reference path="./Common/DataSanitizer.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    /**
    * Class encapsulates sending page views and page view performance telemetry.
    */
    export class PageViewResourceTimingManager {
        private pageViewPerformanceSent: boolean = false;

        private overridePageViewDuration: boolean = false;

        private appInsights: IAppInsightsInternal;

        constructor(
            appInsights: IAppInsightsInternal) {
            this.appInsights = appInsights;
        }

        /**
            This class will help give a full waterfall view of pages. We will exploit the dependency graph to do this.
            We can be a bit more conservative and set a minimumd duration so we can call out the longer resources
        */
        public trackPageViewWaterfall(minDuration?: number, properties?: Object, measurements?: Object) {
            // ensure we have valid values for the required fields
            if (typeof minDuration !== "number") {
                minDuration = 0;
            }

            var pageViewWaterfallSent = false;
            var customDuration = undefined;
            var waterfallArray = Telemetry.PageViewResourcePerformance.getResoucePerformanceObjects();

            if (Telemetry.PageViewPerformance.isPerformanceTimingSupported()) {

                if (!waterfallArray || !Util.isArray(waterfallArray)) {
                    // no navigation timing (IE 8, iOS Safari 8.4, Opera Mini 8 - see http://caniuse.com/#feat=nav-timing)
                    _InternalLogging.throwInternal(
                        LoggingSeverity.WARNING,
                        _InternalMessageId.NavigationTimingNotSupported,
                        "trackPageViewWaterfall: navigation timing API did not return any resource performance items.");
                    return;
                }
            }

            if (!Telemetry.PageViewPerformance.isPerformanceTimingSupported()) {
                // no navigation timing (IE 8, iOS Safari 8.4, Opera Mini 8 - see http://caniuse.com/#feat=nav-timing)
                _InternalLogging.throwInternal(
                    LoggingSeverity.WARNING,
                    _InternalMessageId.NavigationTimingNotSupported,
                    "trackPageViewWaterfall: navigation timing API used for calculation of page duration is not supported in this browser. This page view will be collected without duration and timing info.");
                return;
            }

            var handle = setInterval(() => {
                try {
                    if (Telemetry.PageViewPerformance.isPerformanceTimingDataReady()) {
                        clearInterval(handle);
                        if (!this.pageViewPerformanceSent) {
                            // Skip the first element as it's always the pageview navigation
                            for (var i = 1; i < waterfallArray.length; i++) {
                                var pageViewResorucePerformanceTiming = waterfallArray[i];
                                if (pageViewResorucePerformanceTiming instanceof PerformanceResourceTiming) {
                                    if (pageViewResorucePerformanceTiming.duration >= minDuration) {
                                        var pageViewPerformance = new Telemetry.PageViewResourcePerformance(pageViewResorucePerformanceTiming);
                                        this.appInsights.sendPageViewResourcePerformanceInternal(pageViewPerformance, pageViewResorucePerformanceTiming.startTime);
                                    }
                                }
                            }
                            this.pageViewPerformanceSent = true;
                            this.appInsights.flush();
                        }
                    }
                } catch (e) {
                    _InternalLogging.throwInternal(
                        LoggingSeverity.CRITICAL,
                        _InternalMessageId.TrackPVFailedCalc,
                        "trackPageView failed on page load calculation: " + Util.getExceptionName(e),
                        { exception: Util.dump(e) });
                }
            }, 100);
        }
    }
}
