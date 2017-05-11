/// <reference path="../../JavaScriptSDK.Interfaces/Contracts/Generated/PageViewPerfData.ts"/>
/// <reference path="./Common/DataSanitizer.ts"/>
/// <reference path="../Util.ts"/>

module Microsoft.ApplicationInsights.Telemetry {
    "use strict";

    export class PageViewResourcePerformance extends AI.RemoteDependencyData implements ISerializable {

        // We are exploiting the dependency data graph so we will send this telemetry as that
        public static envelopeType = "Microsoft.ApplicationInsights.{0}.RemoteDependency";
        public static dataType = "RemoteDependencyData";

        private static MAX_DURATION_ALLOWED = 3600000; // 1h

        public aiDataContract = {
            id: FieldType.Required,
            ver: FieldType.Required,
            name: FieldType.Default,
            resultCode: FieldType.Default,
            duration: FieldType.Default,
            success: FieldType.Default,
            data: FieldType.Default,
            target: FieldType.Default,
            type: FieldType.Default,
            properties: FieldType.Default,
            measurements: FieldType.Default,

            kind: FieldType.Default,
            value: FieldType.Default,
            count: FieldType.Default,
            min: FieldType.Default,
            max: FieldType.Default,
            stdDev: FieldType.Default,
            dependencyKind: FieldType.Default,
            async: FieldType.Default,
            dependencySource: FieldType.Default,
            commandName: FieldType.Default,
            dependencyTypeName: FieldType.Default,
        }

        /**
         * Field indicating whether this instance of PageViewPerformance is valid and should be sent
         */
        private isValid: boolean;

        /**
         * Indicates whether this instance of PageViewPerformance is valid and should be sent
         */
        public getIsValid() {
            return this.isValid;
        }

        private durationMs: number;

        /**
        * Gets the total duration (PLT) in milliseconds. Check getIsValid() before using this method.
        */
        public getDurationMs() {
            return this.durationMs;
        }

        /**
         * Constructs a new instance of the PageEventTelemetry object
         */
        constructor(perfResouce: PerformanceResourceTiming) {
            super();

            this.isValid = false;

            /*
             * http://www.w3.org/TR/navigation-timing/#processing-model
             *  |-navigationStart
             *  |             |-connectEnd
             *  |             ||-requestStart
             *  |             ||             |-responseStart
             *  |             ||             |              |-responseEnd
             *  |             ||             |              |
             *  |             ||             |              |         |-loadEventEnd
             *  |---network---||---request---|---response---|---dom---|
             *  |--------------------------total----------------------|
             */
            if (perfResouce) {

                this.id = Util.newId();

                this.duration = Util.msToTimeSpan(perfResouce.duration);
                this.success = true;
                this.resultCode = "200" + "";
                this.dependencyKind = AI.DependencyKind.Http;

                this.type = "Ajax";
                this.data = Common.DataSanitizer.sanitizeUrl(perfResouce.name);

                var absoluteUrl = this.data;
                var method = "GET";

                if (absoluteUrl && absoluteUrl.length > 0) {
                    var parsedUrl: HTMLAnchorElement = UrlHelper.parseUrl(absoluteUrl)
                    this.target = parsedUrl.host;
                    if (parsedUrl.pathname != null) {
                        var pathName: string = (parsedUrl.pathname.length === 0) ? "/" : parsedUrl.pathname;
                        if (pathName.charAt(0) !== '/') {
                            pathName = "/" + pathName;
                        }

                        this.name = Common.DataSanitizer.sanitizeString(method ? method + " " + pathName : pathName);
                    } else {
                        this.name = Common.DataSanitizer.sanitizeString(absoluteUrl);
                    }
                }

            }
        }

        public static getResoucePerformanceObjects(): any {
            if (PageViewPerformance.isPerformanceTimingSupported()) {
                return window.performance.getEntries();
            }
            return null;
        }

        public static hasElementPerformance(): boolean {
            var performanceEntries = window.performance.getEntries();
            if (performanceEntries && Util.isArray(performanceEntries)) {
                for (let entry of performanceEntries) {
                    if (entry instanceof PerformanceResourceTiming) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
}