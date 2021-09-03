import { ReactiveVar } from 'meteor/reactive-var';
import { Annotations, Preferences, Assignments, Data } from '/collections';
import swal from 'sweetalert2';

var Highcharts = require('highcharts/highstock');
require('highcharts-annotations')(Highcharts);
require('highcharts-boost')(Highcharts);

$.widget('crowdeeg.TimeSeriesAnnotator', {

    options: {
        optionsURLParameter: 'annotatorOptions',
        projectUUID: undefined,
        requireConsent: false,
        trainingVideo: {
            forcePlay: false,
            blockInteraction: true,
            vimeoId: '169158678',
        },
        payment: 0.00,
        showConfirmationCode: false,
        confirmationCode: undefined,
        recordingName: undefined,
        defaultMontage: undefined,
        channelsDisplayed: [0, 1, 2, 3, 4, 6, 7],
        channelGains: undefined,
        targetSamplingRate: undefined,
        useHighPrecisionSampling: false,
        channelGainAdjustmentEnabled: false,
        showChannelGainAdjustmentButtons: false,
        showInputPanelContainer: true,
        setVisibilityStatusForInfoPanel: undefined,
        toggleInfoPanel: undefined,
        staticFrequencyFiltersByChannelType: {},
        staticFrequencyFiltersByDataModality: {},
        preClassification: {
            show: false,
            title: 'Pre-Classification',
            source: {},
            uncertaintyInformation: {
                quantitative: {
                    show: true,
                },
                argumentative: {
                    show: false,
                    noiseProbability: 0.0,
                },
            },
        },
        frequencyFilters: [{
            title: 'Lowpass',
            type: 'lowpass',
            options: [
                {
                    name: '70 Hz',
                    value: 70,
                    default: true,
                },
                {
                    name: '30 Hz',
                    value: 30,
                },
                {
                    name: '15 Hz',
                    value: 15,
                },
                {
                    name: 'off',
                    value: undefined,
                },
            ],
        }, {
            title: 'Highpass',
            type: 'highpass',
            options: [
                {
                    name: '10 Hz',
                    value: 10,
                },
                {
                    name: '3 Hz',
                    value: 3,
                },
                {
                    name: '1 Hz',
                    value: 1,
                },
                {
                    name: '0.5 Hz',
                    value: 0.5,
                    default: true,
                },
                {
                    name: 'off',
                    value: undefined,
                },
            ],
        }, {
            title: 'Notch',
            type: 'notch',
            options: [
                {
                    name: '60 Hz',
                    value: 60,
                },
                {
                    name: '50 Hz',
                    value: 50,
                },
                {
                    name: 'off',
                    value: undefined,
                    default: true,
                },
            ],
        }],
        boxAnnotationUserSelection: [{
            title: 'Box Annotations',
            options: []
        }],
        annotationType: [{
            title: 'Annotation Type',
            options: []
        }],
        keyboardInputEnabled: true,
        isReadOnly: false,
        startTime: 0,
        visibleRegion: {
            start: undefined,
            end: undefined,
            showProgress: true,
            hitModeEnabled: true,
            training: {
                enabled: true,
                isTrainingOnly: false,
                numberOfInitialWindowsUsedForTraining: 0,
                windows: [],
            }
        },
        graph: {
            channelSpacing: 400,
            width: undefined,
            height: 600,
            marginTop: 10,
            marginBottom: 30,
            marginLeft: 90,
            marginRight: 30,
            backgroundColor: '#ffffff',
            lineWidth: 1.0,
            enableMouseTracking: false,
        },
        marginTop: null,
        marginBottom: null,
        windowSizeInSeconds: 30,
        windowJumpSizeFastForwardBackward: 10,
        preloadEntireRecording: false,
        numberOfForwardWindowsToPrefetch: 3,
        numberOfFastForwardWindowsToPrefetch: 3,
        numberOfBackwardWindowsToPrefetch: 3,
        numberOfFastBackwardWindowsToPrefetch: 3,
        relativeGainChangePerStep: 0.25,
        idleTimeThresholdSeconds: 300,
        experiment: {},
        showArtifactButtons: false,
        showSleepStageButtons: true,
        showNavigationButtons: true,
        showBackToLastActiveWindowButton: true,
        showBookmarkCurrentPageButton: true,
        showFastBackwardButton: true,
        showBackwardButton: true,
        showForwardButton: true,
        showFastForwardButton: true,
        showShortcuts: false,
        showLogoutButton: false,
        showAnnotationTime: false,
        showReferenceLines: true,
        showTimeLabels: true,
        showChannelNames: true,
        features: {
            examplesModeEnabled: false,
            examples: [],
            cheatSheetsEnabled: false,
            openCheatSheetOnPageLoad: true,
            scrollThroughExamplesAutomatically: true,
            scrollThroughExamplesSpeedInSeconds: 5,
            showUserAnnotations: true,
            showAllBoxAnnotations: "",
            order: ['H1', 'H2', 'OA', 'CA', 'MA', 'ARO', 'desat', 'Arrhythmia', 'Obs', 'Cen', 'Mix', 'Wake Period', 'Sleep Period', 'Empty'],
            options: {
                'H1': {
                    name: 'H1',
                    class: 'blue lighten-2',
                    annotation: {
                        red: 86,
                        green: 186,
                        blue: 219,
                        alpha: {
                            min: 0.22,
                            max: 0.45
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": [9, 10, 11, 12, 13], "ANNE Annotation": ["", "", ""]}
                },
                'H2': {
                    name: 'H2',
                    class: 'purple lighten-4',
                    annotation: {
                        red: 195,
                        green: 123,
                        blue: 225,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": [9, 10, 11, 12, 13], "ANNE Annotation": []}
                },
                'OA': {
                    name: 'OA',
                    class: 'red lighten-4',
                    annotation: {
                        red: 238,
                        green: 75,
                        blue: 38,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": [9, 10, 11, 12, 13], "ANNE Annotation": []}
                },
                'CA': {
                    name: 'CA',
                    class: 'grey',
                    annotation: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": [9, 10, 11, 12, 13], "ANNE Annotation": []}
                },
                'MA': {
                    name: 'MA',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": [9, 10, 11, 12, 13], "ANNE Annotation": []}
                },
                'Aro': {
                    name: 'Aro',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    //PSG files channels: F4-A1  C4-A1  O2-A1   ANNE file channels: Pleth PAT_trend HR(bpm)
                    validChannels: {"PSG Annotation": [0, 1, 2], "ANNE Annotation": []}
                },
                'LM': {
                    name: 'LM',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": [7,  8], "ANNE Annotation": []}
                },
                'desat': {
                    name: 'desat',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": [14], "ANNE Annotation": []}
                },
                'Arrhythmia': {
                    name: 'Arrhythmia',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": ["",  "",  ""], "ANNE Annotation": []}
                },
                'Arrhythmia': {
                    name: 'Arrhythmia',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": ["",  "",  ""], "ANNE Annotation": []}
                },
                'Cen': {
                    name: 'Obs',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": ["",  "",  ""], "ANNE Annotation": []}
                },
                'Cen': {
                    name: 'Cen',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": ["",  "",  ""], "ANNE Annotation": []}
                },
                'Mix': {
                    name: 'Mix',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": ["",  "",  ""], "ANNE Annotation": []}
                },
                'Hyp': {
                    name: 'Hyp',
                    class: 'shades',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": ["",  "",  ""], "ANNE Annotation": []}
                },
                'Sleep Period': {
                    name: 'Sleep Period',
                    class: 'blue-grey lighten-1',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": ["",  "",  ""], "ANNE Annotation": []}
                },
                'Wake Period': {
                    name: 'Wake Period',
                    class: 'amber lighten-4',
                    annotation: {
                        red: 20,
                        green: 230,
                        blue: 30,
                        alpha: {
                            min: 0.18,
                            max: 0.35
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": ["",  "",  ""], "ANNE Annotation": []}
                },
                'Empty': {
                    name: 'Empty',
                    class: 'grey lighten-2',
                    annotation: {
                        red: 86,
                        green: 186,
                        blue: 219,
                        alpha: {
                            min: 0.22,
                            max: 0.45
                        }
                    },
                    answer: {
                        red: 0,
                        green: 0,
                        blue: 0,
                        alpha: {
                            min: 0.1,
                            max: 0.25
                        }
                    },
                    training: {
                        windows: [],
                    },
                    validChannels: {"PSG Annotation": [], "ANNE Annotation": []}
                },
            },
        },
    },

    _create: function() {
        var that = this;
        that._initializeVariables();
        that._keyDownCallback = that._keyDownCallback.bind(that);
        that._reinitChart = that._reinitChart.bind(that);
        
        $(that.element).addClass(that.vars.uniqueClass);
        that._fetchOptionsFromURLParameter();
        that._createHTMLContent();
        if (that.options.requireConsent) {
            that._showConsentForm();
        }
        if (that.options.trainingVideo.forcePlay) {
            that._forcePlayTrainingVideo();
        }
        that._setupHITMode();
        if (that.options.features.examplesModeEnabled) {
            that._setupExamplesMode();
            return;
        }
        if (that.options.experiment.running) {
            that._setupExperiment();
            that._setup();
        }
        else {
            var recordingNameFromGetParameter = that._getUrlParameter('recording_name');
            if (recordingNameFromGetParameter) {
                that.options.recordingName = recordingNameFromGetParameter;
            }
            that._setup();
        }
    },

    _destroy: function() {
        var that = this;

        $(document).off('keydown', that._keyDownCallback);
        $(window).off('resize', that._reinitChart);
    },

    _initializeVariables: function() {
        var that = this;
        that.vars = {
            uniqueClass: that._getUUID(),
            activeFeatureType: 0,
            chart: null,
            activeAnnotations: [],
            annotationsLoaded: true,
            selectedChannelIndex: undefined,
            currentWindowData: null,
            currentWindowStart: 0,
            currentWindowStartReactive: new ReactiveVar(null),
            lastActiveWindowStart: null,
            forwardEnabled: undefined,
            fastForwardEnabled: undefined,
            backwardEnabled: undefined,
            fastBackwardEnabled: undefined,
            currentAnnotationTime: null,
            popUpActive: 0,
            setupOn: false,
            printedBox: false,
            delayExists: true,
            timeChange: false,
            channelsDealyedNames: [],
            delayAmount: [],
            numberOfAnnotationsInCurrentWindow: 0,
            specifiedTrainingWindows: undefined,
            requiredName:"",
            valueOptions: 0,
            allChannels: undefined,
            currType: "",
            increaseOnce: 0,
            oldIndex: -1,
            currentTrainingWindowIndex: 0,
            cheatSheetOpenedBefore: false,
            scrollThroughExamplesIntervalId: undefined,
            frequencyFilters: JSON.parse(JSON.stringify(that.options.frequencyFilters)),
            audioContextSampleRate: 32768,
            fullWindowLabels: {
                'artifacts_none': 'ARTIFACT',
                'artifacts_light': 'ARTIFACT',
                'artifacts_medium': 'ARTIFACT',
                'artifacts_strong': 'ARTIFACT',
                'sleep_stage_wake': 'SLEEP_STAGE',
                'sleep_stage_n1': 'SLEEP_STAGE',
                'sleep_stage_n2': 'SLEEP_STAGE',
                'sleep_stage_n3': 'SLEEP_STAGE',
                'sleep_stage_rem': 'SLEEP_STAGE',
                'sleep_stage_unknown': 'SLEEP_STAGE',
            },
            fullWindowLabelsToHumanReadable: {
                'artifacts_none': 'No artifacts',
                'artifacts_light': 'Light artifacts',
                'artifacts_medium': 'Medium artifacts',
                'artifacts_strong': 'Strong artifacts',
                'sleep_stage_wake': 'Wake',
                'sleep_stage_n1': 'N1 Sleep',
                'sleep_stage_n2': 'N2 Sleep',
                'sleep_stage_n3': 'N3 Sleep',
                'sleep_stage_rem': 'REM Sleep',
                'sleep_stage_unknown': 'Unknown',
            },
            windowsCache: {},
            // windowCache is an object, keeping track of data that is loaded in the background:
            //
            // {
            //     'window_identifier_key_1': undefined,   // <-- data for this window is not available, but can be requested
            //     'window_identifier_key_2': false,       // <-- this window does not contain valid data
            //     'window_identifier_key_3': {            // <-- data for this window has been requested, but not been returned so far
            //         request: jqXHRObject,
            //         data: undefined
            //     },
            //     'window_identifier_key_4': {            // <-- data for this window is available
            //         request: jqXHRObject,
            //         data: dataObject
            //     },
            // }
            annotationsCache: {},
            // annotationsCache is an object, keeping track of annotations loaded from the server:
            //
            // {
            //     'start_end_answer': undefined,          // <-- data for this window is not available, but can be requested
            //     'start_end_answer': {},                 // <-- data for this window has been requested already
            // }
        }
        if (that._getMontages()) {
            that.vars.currentMontage = that.options.defaultMontage || that._getMontages()[0];
        }
        if (that.options.channelGains) {
            that.vars.channelGains = that.options.channelGains;
        }
        else {
            var montages = that._getMontages();
            if (montages) {
                that.vars.channelGains = {};
                montages.forEach(function(montage) {
                    that.vars.channelGains[montage] = that._getChannelsDisplayed(montage).map(function() {
                        return 1.0;
                    });
                });
            }
            else {
                that.vars.channelGains = that._Displayed().map(function() {
                    return 1.0;
                });
            }
        }
    },

    _shouldBeMergedDeeply: function(objectA) {
        if (!objectA) return false;
        if (typeof objectA == 'number') return false;
        if (typeof objectA == 'string') return false;
        if (typeof objectA == 'boolean') return false;
        if (objectA instanceof Array) return false;
        return true;
    },

    _mergeObjectsDeeply: function(target) {
        var that = this;
        var sources = [].slice.call(arguments, 1);
        sources.forEach(function (source) {
            for (var prop in source) {
                if (that._shouldBeMergedDeeply(target[prop]) && that._shouldBeMergedDeeply(source[prop])) {
                    target[prop] = that._mergeObjectsDeeply(target[prop], source[prop]);
                }
                else {
                    target[prop] = source[prop];
                }
            }
        });
        return target;
    },

    _fetchOptionsFromURLParameter: function() {
        var that = this;
        if (!that.options.optionsURLParameter) return;
        var optionsStringFromURL = that._getUrlParameter(that.options.optionsURLParameter);
        if (!optionsStringFromURL) return;
        try {
            var optionsFromURL = JSON.parse(optionsStringFromURL);
            that._mergeObjectsDeeply(that.options, optionsFromURL);
        }
        catch (e) {
            console.log('The following options string does not have valid JSON syntax:', optionsStringFromURL);
        }
    },

    _createHTMLContent: function() {
        var that = this;
        var content = ' \
            <div class="graph_container"> \
                <div class="graph"></div> \
                <div class="graph_control"> \
                    <div class="experiment_container container-fluid"> \
                        <div class="col-xs-12 col-sm-4"></div> \
                        <div class="hints_container col-xs-12 col-sm-4"></div> \
                        <div class="buttons_container col-xs-12 col-sm-4"></div> \
                    </div> \
                    <div class="button_container container-fluid"> \
                        <div class="feature_panel btn-group" role="group"> \
                        </div> \
                        <div class="artifact_panel epoch-classification-panel btn-group notransition" role="group"> \
                            <button type="button" class="btn btn-default no-transition artifact" data-annotation-type="artifacts_none">No Artifacts<div class="votes-info"></div></button> \
                            <button type="button" class="btn btn-default no-transition artifact" data-annotation-type="artifacts_light">Light Artifacts<div class="votes-info"></div></button> \
                            <button type="button" class="btn btn-default no-transition artifact" data-annotation-type="artifacts_medium">Medium Artifacts<div class="votes-info"></div></button> \
                            <button type="button" class="btn btn-default no-transition artifact" data-annotation-type="artifacts_strong">Strong Artifacts<div class="votes-info"></div></button> \
                        </div> \
                        <div class="sleep_stage_panel epoch-classification-panel btn-group" role="group"> \
                            <button type="button" class="btn btn-default no-transition grey lighten-1 sleep_stage" data-annotation-type="sleep_stage_wake"><span class="shortcut-key">W</span>AKE<span class="shortcut-key hidden">0</span><div class="votes-info"></div></button> \
                            <button type="button" class="btn btn-default no-transition grey lighten-1 sleep_stage" data-annotation-type="sleep_stage_n1">N<span class="shortcut-key">1</span><div class="votes-info"></div></button> \
                            <button type="button" class="btn btn-default no-transition grey lighten-1 sleep_stage" data-annotation-type="sleep_stage_n2">N<span class="shortcut-key">2</span><div class="votes-info"></div></button> \
                            <button type="button" class="btn btn-default no-transition grey lighten-1 sleep_stage" data-annotation-type="sleep_stage_n3">N<span class="shortcut-key">3</span><div class="votes-info"></div></button> \
                            <button type="button" class="btn btn-default no-transition grey lighten-1 sleep_stage" data-annotation-type="sleep_stage_rem"><span class="shortcut-key">R</span>EM<span class="shortcut-key hidden">5</span><div class="votes-info"></div></button> \
                        </div> \
                        <div class="adjustment_buttons btn-group" role="group""> \
                            <button type="button" class="btn btn-default gain-button gainUp" aria-label="Left Align"> \
                            <span class="fa fa-plus" aria-hidden="true"></span> \
                            </button> \
                            <button type="button" class="btn btn-default gain-button gainDown" aria-label="Left Align"> \
                            <span class="fa fa-minus" aria-hidden="true"></span> \
                            </button> \
                            <button type="button" class="btn btn-default gain-button gainReset" aria-label="Left Align"> \
                            <span aria-hidden="true">Reset</span> \
                            </button> \
                        </div> \
                        <div style="margin-bottom: 20px" class="montage_panel select_panel"></div> \
                        <div style="margin-bottom: 20px" class="annotation_type_select_panel"></div> \
                        <div style="margin-bottom: 20px" class="frequency_filter_panel"></div> \
                        <div style="margin-bottom: 20px" class="navigation_panel"> \
                                <button type="button" class="btn btn-default bookmarkCurrentPage" disabled aria-label="Bookmark Current Page"> \
                                    <span class="fa fa-bookmark" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn btn-default backToLastActiveWindow" aria-label="Back to Last Active Window"> \
                                    <span class="fa fa-repeat" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn btn-default fastBackward" aria-label="Fast Backward"> \
                                    <span class="fa fa-fast-backward" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn red lighten-1 narrow-horizontal-padding jumpToLastDisagreementWindow" aria-label="Jump to Last Disagreement Window"> \
                                    <span class="fa fa-chevron-left" aria-hidden="true"></span> \
                                    <span class="fa fa-exclamation-circle" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn btn-default backward" aria-label="Backward"> \
                                    <span class="fa fa-step-backward" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn btn-default forward" aria-label="Forward"> \
                                    <span class="fa fa-step-forward" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn btn-default fastForward" aria-label="Fast Forward"> \
                                    <span class="fa fa-fast-forward" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn red lighten-1 narrow-horizontal-padding jumpToNextDisagreementWindow" aria-label="Jump to Next Disagreement Window"> \
                                    <span class="fa fa-exclamation-circle" aria-hidden="true"></span> \
                                    <span class="fa fa-chevron-right" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn btn-default keyboardShortcuts" data-html="true" data-container=".' + that.vars.uniqueClass + '" data-toggle="popover" data-placement="bottom" data-content="<p>Forward: Right Arrow, Page up, D</p> \
                                                                    <p>Backward: Left Arrow, Page Down, A</p> \
                                                                    <p>Skip 5 Min: Up/Down Arrows</p> \
                                                                    <p>Back to Last Annotation: R</p> \
                                                                    <p>Feature Classifications: Number Keys</p>"> \
                                    <span class="fa fa-th" aria-hidden="true"></span> \
                                </button> \
                                <button type="button" class="btn btn-default annotationTime" aria-label="Total Annotation Time"> \
                                    <span class="fa fa-clock-o" aria-hidden="true"></span> \
                                    <div class="annotation-time-container"></div> \
                                </button> \
                                <button class="mark-assignment-as-completed btn btn-default" data-bound-action="COMPLETE_ASSIGNMENT" style="display: none;"> \
                                    <span class="fa fa-check" aria-hidden="true"></span> \
                                </button> \
                        </div> \
                        <div class="progress pull-right"> \
                            <div class="determinate progress-bar progress-bar-success progress-bar-striped" role="progressbar" style="width: 0%"> \
                            </div> \
                        </div> \
                    </div> \
                </div> \
                <div class="graph_footer"> \
                    <div class="container-fluid"> \
                        <div class="adjustment_buttons col-xs-4 middle"> \
                        </div> \
                        <div class="adjustment_buttons col-xs-4 right"> \
                        </div> \
                    </div> \
                </div> \
            </div> \
        ';
        $(that.element).html(content);
    },

    _adaptContent: function() {
        var that = this;
        if (!that.options.showChannelGainAdjustmentButtons) {
            $(that.element).find('.adjustment_buttons').hide();
        }
        if (!that.options.showArtifactButtons) {
            $(that.element).find('.artifact_panel').hide();
        }
        if (!that.options.showSleepStageButtons) {
            $(that.element).find('.sleep_stage_panel').hide();
        }
        if (!that.options.showNavigationButtons) {
            $(that.element).find('.navigation_panel').hide();
        }
        if (!that.options.showBackToLastActiveWindowButton) {
            $(that.element).find('.backToLastActiveWindow').hide();
        }
        if (!that.options.showBookmarkCurrentPageButton) {
            $(that.element).find('.bookmarkCurrentPage').hide();
        }
        if (!that._isArbitrating()) {
            $(that.element).find('.jumpToLastDisagreementWindow').hide();
            $(that.element).find('.jumpToNextDisagreementWindow').hide();
        }
        if (!that.options.showFastBackwardButton) {
            $(that.element).find('.fastBackward').hide();
        }
        if (!that.options.showBackwardButton) {
            $(that.element).find('.backward').hide();
        }
        if (!that.options.showForwardButton) {
            $(that.element).find('.forward').hide();
        }
        if (!that.options.showFastForwardButton) {
            $(that.element).find('.fastForward').hide();
        }
        if (!that.options.showShortcuts) {
            $(that.element).find('.keyboardShortcuts').hide();
        }
        if (!that.options.showAnnotationTime) {
            $(that.element).find('.annotationTime').hide();
        }
        if (!that.options.showLogoutButton) {
            $(that.element).find('.logout').hide();
        }
        if (!that.options.showInputPanelContainer) {
            $(that.element).parents('.annotator-edf').find('.input-panel-container').hide();
            $(that.element).find('.mark-assignment-as-completed').show();
            that._updateMarkAssignmentAsCompletedButtonState();
        }
        if (!that._isHITModeEnabled()) {
            $(that.element).find('.progress').hide();
        }
        $(that.element).css({
            marginTop: that.options.marginTop,
            marginBottom: that.options.marginBottom,
        })
    },

    _updateMarkAssignmentAsCompletedButtonState: function() {
        var that = this;
        $(that.element).find('.mark-assignment-as-completed').prop('disabled', !that.options.context.assignment.canBeMarkedAsCompleted({ reactive: false }));
    },

    _forcePlayTrainingVideo: function() {
        var that = this;
        var videoBox = bootbox.dialog({
            title: '<b>Training Video (PLEASE TURN UP YOUR SOUND VOLUME)</b>',
            onEscape: false,
            backdrop: false,
            closeButton: false,
            animate: true,
            message: '<div class="training-video"></div><div class="interaction-blocker"></div>',
            size: 'large',
        });
        videoBox.appendTo(that.element);
        videoBox.css({
            backgroundColor: 'rgba(0, 0, 0, 1)',
            zIndex: 999999,
        });
        if (that.options.trainingVideo.blockInteraction) {
            videoBox.find('.interaction-blocker').css({
                position: 'fixed',
                width: '100%',
                height: '100%',
                left: 0,
                top: 0,
            });
        }
        var videoContainer = videoBox.find('.training-video');
        var videoId = that.options.trainingVideo.vimeoId;
        var aspectRatio = 513 / 287
        var width = Math.round(videoContainer.width());
        var height = Math.round(width / aspectRatio);
        var playerId = that._getUUID();
        $.getJSON('http://www.vimeo.com/api/oembed.json?url=' + encodeURIComponent('http://vimeo.com/' + videoId) + '&title=0&byline=0&portrait=0&badge=0&loop=0&autoplay=1&width=' + width + '&height=' + height + '&api=1&player_id=' + playerId + '&callback=?', function(data) {
            var playerIFrame = $(data.html).attr('id', playerId).appendTo(videoContainer);
            var player = $f(playerIFrame[0]);
            player.addEvent('ready', function() {
                player.addEvent('finish',function() {
                    videoBox.remove();
                });
            });
        });
    },

    _showConsentForm: function() {
        var that = this;
        var confirmationCodeInfo = '';
        if (that.options.showConfirmationCode && that.options.confirmationCode) {
            confirmationCodeInfo = '. For the payment to be processed correctly you need to enter the confirmation code presented to you at the end of the task into the corresponding input field in the instructions panel on Mechanical Turk';
        }
        bootbox.dialog({
            onEscape: false,
            backdrop: false,
            closeButton: false,
            animate: true,
            title: 'Information Consent',
            message: ' \
                <div class="text-left"> \
                You are invited to participate in a research study conducted by Mike Schaekermann under the supervision of Professor Edith Law of the University of Waterloo, Canada. The objectives of the research study are to develop a low cost crowdsourcing system for EEG analysis for use in the third world.<br><br> \
                If you decide to participate, you will be asked to complete a 20-30 minute online EEG analysis task, as described on the task listing. Participation in this study is voluntary. You may decline to answer any questions that you do not wish to answer and you can withdraw your participation at any time by closing this browser tab or window. You will be paid $' + that.options.payment.toFixed(2) + ' upon completion of the task' + confirmationCodeInfo + '. Unfortunately we are unable to pay participants who do not complete the task. There are no known or anticipated risks from participating in this study.<br><br> \
                It is important for you to know that any information that you provide will be confidential. All of the data will be summarized and no individual could be identified from these summarized results. Furthermore, the web site is programmed to collect responses alone and will not collect any information that could potentially identify you (such as machine identifiers). The data collected from this study will be maintained on a password-protected computer database in a restricted access area of the university. As well, the data will be electronically archived after completion of the study and maintained for eight years and then erased.<br><br> \
                This survey uses Mechanical Turk which is a United States of America company. Consequently, USA authorities under provisions of the Patriot Act may access this survey data. If you prefer not to submit your data through Mechanical Turk, please do not participate.<br><br> \
                Note that the remuneration you receive may be taxable income. You are responsible for reporting this income for tax purposes. Should you have any questions about the study, please contact either Mike Schaekermann (mschaeke@uwaterloo.ca) or Edith Law (edith.law@uwaterloo.ca). Further, if you would like to receive a copy of the results of this study, please contact either investigator.<br><br> \
                I would like to assure you that this study has been reviewed and received ethics clearance through a University of Waterloo Research Ethics Committee. However, the final decision about participation is yours. Should you have any comments or concerns resulting about your participation in this study, please contact Dr. Maureen Nummelin in the Office of Research Ethics at 1-519-888-4567, Ext. 36005 or maureen.nummelin@uwaterloo.ca.<br><br> \
                </div> \
                ',
            buttons: {
                consent: {
                    label: 'I understand and accept the participant consent agreement',
                    className: 'btn-success',
                }
            }
        }).css({
            zIndex: 99999,
        }).appendTo(that.element);
    },

    _setVisibilityStatusForInfoPanel: function(isVisible) {
        var that = this;
        const setVisibilityStatus = that.options.setVisibilityStatusForInfoPanel;
        if (!setVisibilityStatus) return;
        setVisibilityStatus(isVisible);
    },

    _showInfoPanel: function() {
        var that = this;
        that._setVisibilityStatusForInfoPanel(true);
    },

    _hideInfoPanel: function() {
        var that = this;
        that._setVisibilityStatusForInfoPanel(false);
    },

    _toggleInfoPanel: function() {
        var that = this;
        const toggle = that.options.toggleInfoPanel;
        if (!toggle) return;
        toggle();
    },

    _isHITModeEnabled: function() {
        var that = this;
        return (
            that._isVisibleRegionDefined()
            && that.options.visibleRegion.hitModeEnabled
        );
    },

    _isVisibleRegionDefined: function() {
        var that = this;
        return (
            that.options.visibleRegion.start !== undefined
            && that.options.visibleRegion.end !== undefined
        );
    },

    _setupHITMode: function() {
        var that = this;
        if (!that._isHITModeEnabled()) return;

        that.options.showBackToLastActiveWindowButton = false;
        that.options.showBookmarkCurrentPageButton = false;
        that.options.showFastBackwardButton = false;
        that.options.showBackwardButton = false;
        that.options.showForwardButton = false;
        that.options.showFastForwardButton = false;
        that.options.showShortcuts = false;
        that.options.showAnnotationTime = false;

        $(that.element).find('.graph_footer .middle').append(' \
            <button type="button" class="btn btn-default no-features submit-annotations" aria-label="No features">I do not see any features</button> \
            <button type="button" class="btn btn-default submit-features submit-annotations" aria-label="Submit features" disabled>Submit features</button> \
            <button type="button" class="btn btn-default next-window" aria-label="Next window" disabled><i class="fa fa-step-forward"></i></button> \
        ');

        $(that.element).find('.submit-annotations').click(function () {
            that._blockGraphInteraction();
            if (that._isCurrentWindowTrainingWindow()) {
                that._revealCorrectAnnotations();
            }
            // log this window as complete and
            // set bookmark to next window so that
            // on page load, the user cannot change
            // any annotations made before submitting
            that._saveUserEventWindowComplete();
            that._savePreferences({ startTime: that.vars.currentWindowStart + that.options.windowSizeInSeconds })
            $(that.element).find('.submit-annotations').prop('disabled', true);
            $(that.element).find('.next-window').prop('disabled', false);
        });

        $(that.element).find('.next-window').click(function () {
            $(that.element).find('.no-features').prop('disabled', false);
            $(that.element).find('.submit-features').prop('disabled', true);
            $(that.element).find('.next-window').prop('disabled', true);
            if (that._isCurrentWindowLastTrainingWindow() && !that._isTrainingOnly()) {
                bootbox.alert({
                    closeButton: false,
                    title: 'End of the Training Phase',
                    message: 'You just completed the last window of the training phase. That means that, from now on, you will not be able to see the correct answer after submitting yours any longer. The examples panel below, however, will stay visible throughout the entire task. Hopefully, the training phase helped you learn more about the signal pattern we are looking for!',
                    callback: function() {
                        that._shiftChart(1);
                        that._unblockGraphInteraction();
                    }
                }).appendTo(that.element);
            }
            else {
                that._shiftChart(1);
                that._unblockGraphInteraction();
            }
        });

        that._fetchOptionsFromURLParameter();
    },

    _getCurrentWindowIndexInVisibleRegion: function() {
        var that = this;
        if (!that._isHITModeEnabled()) return;
        var windowIndex = Math.floor((that.vars.currentWindowStart - that.options.visibleRegion.start) / that.options.windowSizeInSeconds);
        return windowIndex;
    },

    _getNumberOfTrainingWindows: function() {
        var that = this;
        var training = that.options.visibleRegion.training;
        if (!that._isTrainingEnabled()) {
            return 0;
        }
        if (training.numberOfInitialWindowsUsedForTraining > 0) {
            return training.numberOfInitialWindowsUsedForTraining;
        }
        return that._getSpecifiedTrainingWindows().length;
    },

    _areTrainingWindowsSpecified: function() {
        var that = this;
        that._getSpecifiedTrainingWindows();
        return (
            that.vars.specifiedTrainingWindows !== undefined
            && that.vars.specifiedTrainingWindows.length > 0
        );
    },

    _getCurrentTrainingWindow: function() {
        var that = this;
        if (!that._areTrainingWindowsSpecified()) {
            return;
        }
        var trainingWindows = that._getSpecifiedTrainingWindows();
        var currentIndex = that.vars.currentTrainingWindowIndex;
        if (currentIndex > trainingWindows.length - 1) {
            return;
        }
        var trainingWindow = trainingWindows[currentIndex];
        return trainingWindow;
    },

    _isCurrentWindowSpecifiedTrainingWindow: function() {
        var that = this;
        if (!that._areTrainingWindowsSpecified()) return false;
        return that.vars.currentTrainingWindowIndex < that._getNumberOfTrainingWindows();
    },

    _getSpecifiedTrainingWindows: function() {
        var that = this;
        if (that.vars.specifiedTrainingWindows) {
            return that.vars.specifiedTrainingWindows;
        }
        var training = that.options.visibleRegion.training;
        if (!that._isTrainingEnabled() || training.numberOfInitialWindowsUsedForTraining > 0) {
            return [];
        }
        if (training.windows && training.windows.length > 0) {
            that.vars.specifiedTrainingWindows = training.windows;
            return that.vars.specifiedTrainingWindows;
        }
        var windows = [];
        var featureOrder = that.options.features.order;
        var featureOptions = that.options.features.options;
        for (f = 0; f < featureOrder.length; ++f) {
            var feature = featureOrder[f];
            var featureTrainingWindows = featureOptions[feature].training.windows;
            if (featureTrainingWindows && featureTrainingWindows.length > 0) {
                windows.push.apply(windows, featureTrainingWindows);
            }
        }
        that.vars.specifiedTrainingWindows = windows;
        return that.vars.specifiedTrainingWindows;
    },

    _isTrainingEnabled: function() {
        var that = this;
        return (that._isHITModeEnabled() && that.options.visibleRegion.training.enabled);
    },

    _isTrainingOnly: function() {
        var that = this;
        return that.options.visibleRegion.training.isTrainingOnly;
    },

    _isCurrentWindowTrainingWindow: function() {
        var that = this;
        if (!that._isHITModeEnabled()) return false;
        return that._getWindowIndexForTraining() <= that._getNumberOfTrainingWindows() - 1;
    },

    _isCurrentWindowFirstTrainingWindow: function() {
        var that = this;
        if (!that._isHITModeEnabled()) return false;
        return (
            that._getNumberOfTrainingWindows() > 0
            && that._getWindowIndexForTraining() === 0
        );
    },

    _isCurrentWindowLastTrainingWindow: function() {
        var that = this;
        if (!that._isHITModeEnabled()) return false;
        return that._getWindowIndexForTraining() == that._getNumberOfTrainingWindows() - 1;
    },

    _getWindowIndexForTraining: function() {
        var that = this;
        if (!that._isHITModeEnabled()) return false;
        if (that._areTrainingWindowsSpecified()) {
            return that.vars.currentTrainingWindowIndex;
        }
        else {
            return that._getCurrentWindowIndexInVisibleRegion();
        }
    },

    _revealCorrectAnnotations: function() {
        var that = this;
        that._getAnnotations(that.vars.currentWindowRecording, that.vars.currentWindowStart, that.vars.currentWindowStart + that.options.windowSizeInSeconds, true);
    },

    _setupExamplesMode: function() {
        var that = this;
        var examples = that.options.features.examples;

        if (!examples || examples.length == 0) {
            console.log('There are no examples for this viewer.');
            return;
        }
        examples.sort(function(a, b) {
            return a.start - b.start;
        });
        var firstExample = examples[0];
        var recordingName = firstExample.recording;
        var channelsDisplayed = [firstExample.channels_displayed[firstExample.channels]];
        that.options.recordingName = recordingName;
        that.options.channelsDisplayed = channelsDisplayed;
        that.options.graph.height = 200;
        that.options.features.showUserAnnotations = false;
        that.options.features.order = [ firstExample.type ];
        that.options.isReadOnly = true;
        that.options.channelGainAdjustmentEnabled = true;
        that.options.showChannelGainAdjustmentButtons = true;
        that.options.keyboardInputEnabled = false;
        that.options.showArtifactButtons = false;
        that.options.showNavigationButtons = false;
        that.options.showReferenceLines = false;
        that.options.features.cheatSheetsEnabled = true;
        that.options.features.openCheatSheetOnPageLoad = true;
        that.options.showTimeLabels = true;
        that._fetchOptionsFromURLParameter();

        $(that.element).find('.button_container').prepend('<span class="examples-title pull-left">Examples for:</span>');
        $(that.element).find('.button_container').append(' \
            <div class="examples_panel btn-group"> \
                <button type="button" class="btn btn-default open-cheat-sheet" aria-label="Open Cheat Sheet"> \
                    <span class="fa fa-info-circle" aria-hidden="true"></span> Open Cheat Sheet \
                </button> \
                <button type="button" class="btn btn-default previous-example" aria-label="Previous Example"> \
                    <span class="fa fa-chevron-left" aria-hidden="true"></span> \
                </button> \
                <button type="button" class="btn btn-default next-example" aria-label="Next Example"> \
                    <span class="fa fa-chevron-right" aria-hidden="true"></span> \
                </button> \
            </div> \
        ');

        if (!that.options.features.cheatSheetsEnabled) {
            $(that.element).find('.open-cheat-sheet').remove();
        }
        else {
            $(that.element).find('.open-cheat-sheet').click(function() {
                that._saveUserEvent('open_cheat_sheet', {
                    feature: firstExample.type,
                });
                openCheatSheet();
            });
            if (that.options.features.openCheatSheetOnPageLoad) {
                $(that.element).hover(function() {
                    if (that.vars.cheatSheetOpenedBefore) return;
                    openCheatSheet();
                });
            }
            function openCheatSheet() {
                that.vars.cheatSheetOpenedBefore = true;
                bootbox.dialog({
                    title: '<b>PLEASE READ CAREFULLY</b>',
                    message: '<img style="width: 100%; height: auto;" src="https://s3.amazonaws.com/curio-media/crowdeeg/feature-cheat-sheets/' + firstExample.type + '.png">',
                    buttons: {
                        close: {
                            label: 'Close',
                        }
                    },
                    size: 'large',
                }).appendTo(that.element);
            }
        }

        that.vars.currentExampleIndex = 0;
        that.options.startTime =  that._getWindowStartForTime(examples[that.vars.currentExampleIndex].start);

        $(that.element).find('.next-example').click(function() {
            that._saveUserEvent('view_example_window', {
                feature: firstExample.type,
                direction: 'next',
            });
            that._clearScrollThroughExamplesInterval();
            that._showNextExample(1);
        });
        $(that.element).find('.previous-example').click(function() {
            that._saveUserEvent('view_example_window', {
                feature: firstExample.type,
                direction: 'previous',
            });
            that._clearScrollThroughExamplesInterval();
            that._showNextExample(-1);
        });
        if (that.options.features.scrollThroughExamplesAutomatically) {
            $(that.element).hover(function() {
                if (that.vars.scrollThroughExamplesIntervalId !== undefined) return;
                that.vars.scrollThroughExamplesIntervalId = window.setInterval(function() {
                    that._showNextExample(1);
                }, that.options.features.scrollThroughExamplesSpeedInSeconds * 1000);
            });
        }

        var wrapper = $('<div>').addClass('well');
        $(that.element).children().wrap(wrapper);
        that.options.graph.backgroundColor = 'none';

        that._setup();
    },

    _clearScrollThroughExamplesInterval: function() {
        var that = this;
        if (
            that.vars.scrollThroughExamplesIntervalId !== undefined
            && that.vars.scrollThroughExamplesIntervalId !== false
        ) {
            window.clearInterval(that.vars.scrollThroughExamplesIntervalId);
            that.vars.scrollThroughExamplesIntervalId = false;
        }
    },

    _showNextExample: function(stepLength) {
        var that = this;
        do {
            that.vars.currentExampleIndex += stepLength;
            that.vars.currentExampleIndex %= that.options.features.examples.length;
            while (that.vars.currentExampleIndex < 0) {
                that.vars.currentExampleIndex += that.options.features.examples.length;
            }
            var example = that.options.features.examples[that.vars.currentExampleIndex];
            var nextWindowStart = that._getWindowStartForTime(example.start);
        } while (nextWindowStart == that.vars.currentWindowStart);
        that._switchToWindow(that.options.recordingName, nextWindowStart, that.options.windowSizeInSeconds);
    },

    _getMontages: function() {
        var that = this;
        if (that.options.channelsDisplayed instanceof Array) {
            return;
        }
        return Object.keys(that.options.channelsDisplayed);
    },

    _getChannelsDisplayed: function(montage) {
        var that = this;
        
        if (that.options.channelsDisplayed instanceof Array) {
            return that.options.channelsDisplayed;
        }
        if (montage) {
            return that.options.channelsDisplayed[montage];
        }
        if (that.vars.currentMontage && that.options.channelsDisplayed[that.vars.currentMontage]) {
            return that.options.channelsDisplayed[that.vars.currentMontage];
        }
        else if (that.options.defaultMontage && that.options.channelsDisplayed[that.options.defaultMontage]) {
            return that.options.channelsDisplayed[that.options.defaultMontage];
        }
        return that.options.channelsDisplayed[that._getMontages()[0]];
    },

    _dealyChannel: function(channelName, amount){
        var that = this;
        if(that.vars.channelsDealyedNames.includes(channelName)){
            var index = that.vars.channelsDealyedNames.indexOf(channelName);
            that.vars.delayAmount[index] = amount + that.vars.delayAmount[index];
           // console.log(channelName);
        }
        else{
           // console.log(channelName);
            that.vars.channelsDealyedNames.push(channelName);
            that.vars.delayAmount.push(amount);
        }
        that.vars.timeChange = true;
        that._setDelay();
        

    },
    _getChannelGains: function(montage) {
        var that = this;
        if (that.vars.channelGains instanceof Array) {
            return that.vars.channelGains;
        }
        if (montage) {
            return that.vars.channelGains[montage];
        }
        if (that.vars.currentMontage && that.vars.channelGains[that.vars.currentMontage]) {
            return that.vars.channelGains[that.vars.currentMontage];
        }
        else if (that.options.defaultMontage && that.vars.channelGains[that.options.defaultMontage]) {
            return that.vars.channelGains[that.options.defaultMontage];
        }
        return that.vars.channelGains[that._getMontages()[0]];
    },

    _getGainForChannelIndex: function(index, montage) {
        var that = this;
        return that._getChannelGains(montage)[index];
    },

    _getOffsetForChannelIndexPostScale: function(index) {
        var that = this;
        var offset = (that.vars.currentWindowData.channels.length - 1 - index) * that.options.graph.channelSpacing;
        return offset;
    },

    _getWindowStartForTime: function(time) {
        var that = this;
        var windowStart = Math.floor(time / that.options.windowSizeInSeconds);
        windowStart *= that.options.windowSizeInSeconds;
        return windowStart;
    },

    _setup: function() {
        var that = this;
        that._adaptContent();
        that._setupTimer();
        //that._setupFeaturePanel();
        //set the unslected feature to empty.
        that.vars.activeFeatureType = that.options.features.order[14]

        that._setupNavigationPanel();
        that._setupArtifactPanel();
        that._setupSleepStagePanel();
        that._setupTrainingPhase();
        that._setupArbitration();
        that._getRecordingMetadata(function(metadata) {
            that.vars.recordingMetadata = metadata;
            if (that.options.preloadEntireRecording) {
                that._preloadEntireRecording(function() {
                    that._getUserStatus();
                });
            }
            else {
                that._getUserStatus();
            }
        });
    },

    _getUrlParameter: function(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    },

    _getPreClassificationAnnotations: function(filter, callback) {
        var that = this;
        filter = filter || {};
        return that.options.context.assignment.preClassificationAnnotations(filter, { sort: { 'value.position.start': 1 } });
    },

    _setupExperiment: function() {
        var that = this;
        if (!that.options.experiment.running) return;
        var temporalContextHint;
        switch (that.options.experiment.current_condition.temporal_context) {
            case 'continuous':
                temporalContextHint = 'Continuous sequence of windows';
                break;
            case 'shuffled':
                temporalContextHint = 'Shuffled sequence of windows';
                break;
        }
        var hint = $('<h4>').html(temporalContextHint);
        $(that.element).find('.experiment_container .hints_container').append(hint);
    },

    _updateNavigationStatusForExperiment: function() {
        var that = this;
        if (!that.options.experiment.running) return;
        var currentWindowIndex = that.options.experiment.current_condition.current_window_index;
        var conditionWindows = that.options.experiment.current_condition.windows;
        var lastWindowIndex = conditionWindows.length - 1;
        var windowsRemaining = lastWindowIndex - currentWindowIndex;
        that._setForwardEnabledStatus(windowsRemaining >= 1);
        if (windowsRemaining < 1) {
            that._lastWindowReached();
        }
        that._setFastForwardEnabledStatus(windowsRemaining >= that.options.windowJumpSizeFastForwardBackward);
        that._setBackwardEnabledStatus(currentWindowIndex >= 1);
        that._setFastBackwardEnabledStatus(currentWindowIndex >= that.options.windowJumpSizeFastForwardBackward);
        if (that.options.experiment.current_condition.temporal_context == 'shuffled') {
            that._setFastForwardEnabledStatus(false);
            that._setFastBackwardEnabledStatus(false);
            $(that.element).find('.fastForward').hide();
            $(that.element).find('.fastBackward').hide();
        }
    },

    _setupTimer: function() {
        var that = this;
        that.vars.totalAnnotationTimeSeconds = 0
        var preferences = {};
        if (that.options.context.preferences) {
            preferences = that.options.context.preferences.annotatorConfig;
        }
        if (preferences.totalAnnotationTimeSeconds) {
            that.vars.totalAnnotationTimeSeconds = parseFloat(preferences.totalAnnotationTimeSeconds);
        }
        that.vars.lastAnnotationTime = that._getCurrentServerTimeMilliSeconds();
        if (preferences.lastAnnotationTime) {
            that.vars.lastAnnotationTime = parseInt(preferences.lastAnnotationTime);
        }
        var timerContainer = $(that.element).find('.annotation-time-container');
        var timeContainer = $('<span>').addClass('time form-control');
        timerContainer.append(timeContainer);
        that.vars.annotationTimeContainer = timeContainer;
        that._setTotalAnnotationTimeSeconds(that.vars.totalAnnotationTimeSeconds);
    },

    _setTotalAnnotationTimeSeconds: function(timeSeconds) {
        var that = this;
        that.vars.totalAnnotationTimeSeconds = timeSeconds;
        if (!that.vars.annotationTimeContainer) {
            return;
        }
        that.vars.annotationTimeContainer
                    .timer('remove')
                    .timer({
                        seconds: that.vars.totalAnnotationTimeSeconds,
                        format: '%H:%M:%S'
                    })
                    .timer('pause');
    },

    _updateLastAnnotationTime: function() {
        var that = this;
        var currentTime = that._getCurrentServerTimeMilliSeconds();
        var timeDifferenceSeconds = (currentTime - that.vars.lastAnnotationTime) / 1000;
        that.vars.lastAnnotationTime = currentTime;
        var preferencesUpdates = {
            lastAnnotationTime: that.vars.lastAnnotationTime
        }
        if (timeDifferenceSeconds <= that.options.idleTimeThresholdSeconds) {
            that.vars.totalAnnotationTimeSeconds += timeDifferenceSeconds;
            that._setTotalAnnotationTimeSeconds(that.vars.totalAnnotationTimeSeconds);
            preferencesUpdates.totalAnnotationTimeSeconds = that.vars.totalAnnotationTimeSeconds;
        }
        that.vars.lastActiveWindowStart = that.vars.currentWindowStart;
        that._savePreferences(preferencesUpdates);
    },

    _getCurrentServerTimeMilliSeconds: function() {
        var today = new Date();
        var serverOffset = -5;
        var date = new Date().getTime() + serverOffset * 3600 * 1000;
        return date;
    },

    _setupMontageSelector: function() {
        var that = this;
        if (!that._getMontages()) {
            return;
        }
        var selectContainer = $('<div><select></select></div>').appendTo(that.element.find('.montage_panel'));
        var select = selectContainer.find('select');
        that._getMontages().forEach(function(montage) {
            var selectedString = '';
            if (montage == that.vars.currentMontage) {
                selectedString = ' selected="selected"';
            }
            select.append('<option value="' + montage + '"' + selectedString + '>' + montage + '</option>');
        });
        select.material_select();
        select.change(function() {
            that.vars.currentMontage = select.val();
            that._savePreferences({
                defaultMontage: that.vars.currentMontage,
            })
            that._reinitChart();
        });
    },

    _setupFrequencyFilterSelector: function() {
        var that = this;
        var frequencyFilters = that.options.frequencyFilters || [];
        frequencyFilters.forEach((frequencyFilter, f) => {
            var filterSettings = frequencyFilter.options;
            if (!filterSettings) {
                return;
            }
            var selectContainer = $('<div class="select_panel"><select></select></div>').appendTo(that.element.find('.frequency_filter_panel'));
            var select = selectContainer.find('select');
          
            filterSettings.forEach(function(filterSetting) {
                var selectedString = '';
                if (filterSetting.default) {
                    selectedString = ' selected="selected"';
                }
                select.append('<option value="' + filterSetting.value + '"' + selectedString + '>' + frequencyFilter.title + ': ' + filterSetting.name + '</option>');
            });
            select.material_select();
            select.change(function() {
                filterSettings.forEach(function(filterSetting) {
                    delete filterSetting.default;
                });
                filterSettings[select.prop('selectedIndex')].default = true;
                that._savePreferences({
                    frequencyFilters: frequencyFilters,
                })
                that.vars.frequencyFilters[f].selectedValue = select.val();
                that._reloadCurrentWindow();
            });
            select.change();
        });
    },

    _setupAnnotationDisplayType: function() {	
        var that = this;
        //that.vars.printedBox = true;
        $(".frequency_filter_panel").after($("<div style=\"margin-bottom: 20px\" class=\"user_selection_panel\"></div>"))
        that.options.boxAnnotationUserSelection[0].options = []
        var temp = that.options.boxAnnotationUserSelection
        temp[0].options.push(
            {
                name: "Off",
                value: "none",
                default: true
            },
            {
                name: "Show My",
                value: "my",
            })
            //Allow admins to see all annotations from differnt users, by adding them to dropdown
        if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
            temp[0].options.push({ name: "Show All", value: "all" })
           // that._setDelay();
            assign = Assignments.find({
                task: that.options.context.task._id,
                data: that.options.context.data._id,
            }, {
                sort: { updatedAt: -1 },
                }).fetch();
          
            var users = assign[0].users
            var userNames = Meteor.users.find({ _id: { $in: users } }, { username: 1, sort: { updatedAt: -1 } }).fetch().map(u => u.username)
            for (var i = 0; i < users.length; i++) {
                var user = users[i]
                var username = userNames[i]
                if (user == Meteor.userId()){
                    continue
                }
                temp[0].options.push({name: username, value: user})
            }	
        }
        if(!that.vars.printedBox){
            that.vars.printedBox = true;
            that.__setupAnnotationChoice();
        }
        var selection = that.options.boxAnnotationUserSelection || []
        selection.forEach((boxAnnotation, t) => {
            var boxAnnotationSettings = boxAnnotation.options;
            var selectContainer = $('<div class="select_panel"><select></select></div>').appendTo(that.element.find('.user_selection_panel'));
            var select = selectContainer.find('select');
  
            
            boxAnnotationSettings.forEach(function(boxAnnotationSetting) {
                var selectedString = '';
                if (boxAnnotationSetting.default) {
                    selectedString = ' selected="selected"';
                }
                select.append('<option value="' + boxAnnotationSetting.value + '"' + selectedString + '>' + boxAnnotation.title + ': ' + boxAnnotationSetting.name + '</option>');
                if(boxAnnotationSetting.value == "my" && Roles.userIsInRole(Meteor.userId(), 'admin')){
                    select.append('<optgroup id="otherUsers" label="Other Users"></optgroup>')
                }
            });
           
            
            select.material_select();
            select.change(function() {
                that.options.features.showAllBoxAnnotations = select.val()
                that.vars.annotationsLoaded = false;
                that.vars.annotationsCache = []
                
                that._removeAnnotationBox();
   
                
                that._refreshAnnotations()
                
            })
        select.change();
        });
        	
    },
  

    _setupAnnotationChoice: function(){
        var that = this;
        that.vars.printedBox = true;
 
        that.options.annotationType[0].options = [];
        var temp = that.options.annotationType;
        temp[0].options.push(
            {
                name: "Off",
                value: "none",
                default: true
            },
            {
                name: "Box Annotation",
                value: "box",
            },
            {
                name: "Change Point Annotation",
                value: "cpoint",
            
            },
            {
                name: "Time Adjust",
                value: "tadjust",
            }
        )

        var selection = that.options.annotationType|| []
        selection.forEach((typeAnnotation, t) => {
            var typeAnnotationSettings = typeAnnotation.options;
            var selectContainer = $('<div class="select_panel"><select></select></div>').appendTo(that.element.find('.annotation_type_select_panel'));
   
            var select = selectContainer.find('select');
            typeAnnotationSettings.forEach(function(typeAnnotationSetting) {
                var selectedString = '';
                if (typeAnnotationSetting.default) {
                    selectedString = ' selected="selected"';
                }
                select.append('<option value="' + typeAnnotationSetting.value + '"' + selectedString + '>' + typeAnnotation.title + ': ' + typeAnnotationSetting.name + '</option>');
               
            });
           
            
            select.material_select();
            
            select.change(function(){
                that.options.features.annotationType = select.val();
                that._setupAnnotationInteraction();
                
            })
            select.change();
        });

    },

   
    _setupFeaturePanel: function() {
        var that = this;
        $('[data-toggle="popover"]').popover({ trigger: 'hover' });

        var firstFeature = that.options.features.order[0];
        that.vars.activeFeatureType = firstFeature;

        for (var i = 0; i < that.options.features.order.length; i++) {
            var feature_key = that.options.features.order[i];
            var feature_name = that.options.features.options[feature_key].name;
            var featureButton = $('<button type="button" class="btn feature ' + feature_key + '">' + feature_name + '</button>').data('annotation-type', feature_key);
            $(that.element).find('.feature_panel').append(featureButton);
            $('<style type="text/css">.feature.' + feature_key + ', .feature.' + feature_key + ':hover { background-color: ' + that._getFeatureColor(feature_key, false, 0.05) + '} .feature.' + feature_key + '.active { background-color: ' + that._getFeatureColor(feature_key) + '}</style>').appendTo('head');
        }
        $(that.element).find('.feature').click(function(event) {
            that._selectFeatureClass($(this));
        });
        $(that.element).find('.feature.' + firstFeature)
            .addClass('active')
            .siblings()
            .removeClass('active');
    },

    _preloadEntireRecording: function(callback) {
        var that = this;
        if (that._isArbitrating()) {
            callback();
            return;    
        }
        var montages = that._getMontages();
        var channelsDisplayedPerMontage = [];
        if (montages) {
            montages.forEach(function(montage) {
                channelsDisplayedPerMontage.push(that._getChannelsDisplayed(montage));
            });
        }
        else {
            channelsDisplayedPerMontage = [ that._getChannelsDisplayed() ];
        }
        var recordingLengthInSeconds = that.vars.recordingMetadata.LengthInSeconds;
        //console.log(that.vars.recordingMetadata);
        // For local debugging, only
        // preload a maximum of 10 epochs
        if (!Meteor.isProduction) {
            recordingLengthInSeconds = Math.min(10 * that.options.windowSizeInSeconds, recordingLengthInSeconds);
        }
        var numWindowsToRequestPerMontage = Math.ceil(recordingLengthInSeconds / that.options.windowSizeInSeconds);
        var numWindowsToRequestTotal = numWindowsToRequestPerMontage * channelsDisplayedPerMontage.length;
        var numWindowsLoaded = 0;
        var progressBar = $('<div class="progress"><div class="indicator determinate"></div></div>').appendTo(that.element.find('.graph_container'));
        var loadingCompleted = false;
        function updateLoadingProgress() {
            var percentage = Math.max(0, Math.min(100, Math.round(numWindowsLoaded / numWindowsToRequestTotal * 100)));
            progressBar.find('.indicator').css('width', percentage + '%');
            if (percentage >= 100 && !loadingCompleted) {
                loadingCompleted = true;
                setTimeout(() => {
                    progressBar.remove();
                    callback();                        
                }, 500);
            }
        }
        updateLoadingProgress();
        channelsDisplayedPerMontage.forEach(function(channelsDisplayed, m) {
            for (var i = 0; i < numWindowsToRequestPerMontage; ++i) {
                var startTime = i * that.options.windowSizeInSeconds;
                var options = {
                    recording_name: that.options.recordingName,
                    channels_displayed: channelsDisplayed,
                    start_time: i * that.options.windowSizeInSeconds + 90,
                    window_length: that.options.windowSizeInSeconds,
                    target_sampling_rate: that.options.targetSamplingRate,
                    use_high_precision_sampling: that.options.useHighPrecisionSampling,
                };
                //console.log(options);
                that._requestData(options, function(data, error) {
                    if (error) {
                        console.log(error);
                    }
                    ++numWindowsLoaded;
                    updateLoadingProgress();
                });
            }
        });
    },

    _getRecordingMetadata: function(callback) {
        var that = this;
        that._getDelay();
        if (that.vars.recordingMetadata) {
            callback(that.vars.recordingMetadata);
            return;
        }
        Meteor.call('get.edf.metadata', that.options.recordingName, function(error, metadata) {
            if (error) {
                callback(null, error.message);
                return;
            }
            
            that.vars.recordingMetadata = metadata;
            callback(that.vars.recordingMetadata);
        });
    },

    _triggerOnReadyEvent: function() {
        var that = this;
        $(that.element).parents('.assignment-container').trigger('readyToStart');
    },

    _getUserStatus: function() {
        var that = this;
        //that._getDelay();
        //that._setDelay();
        that._setupMontageSelector();
       
        that._setupFrequencyFilterSelector();
        
        that._setupAnnotationChoice();
        that._setupAnnotationDisplayType();
        
       
        
        
        if (that.options.experiment.running) {
            that._updateNavigationStatusForExperiment();
            var currentWindowIndex = that.options.experiment.current_condition.current_window_index;
            var conditionWindows = that.options.experiment.current_condition.windows;
            that.options.recordingName = that.options.experiment.current_condition.recording_name;
            var initialWindowStart = conditionWindows[currentWindowIndex];
            that.vars.lastActiveWindowStart = initialWindowStart;
            that._switchToWindow(that.options.recordingName, initialWindowStart, that.options.windowSizeInSeconds);
        }
        else if (that._areTrainingWindowsSpecified()) {
            var trainingWindow = that._getCurrentTrainingWindow();
            that._switchToWindow(trainingWindow.recordingName, trainingWindow.timeStart, trainingWindow.windowSizeInSeconds);
        }
        else if (that.options.recordingName) {
            that.vars.lastActiveWindowStart = + that.options.startTime;
            const context = that.options.context;
            const preferencesArbitrationRoundNumber = !!context.preferences.arbitrationRoundNumber ? context.preferences.arbitrationRoundNumber : 0;
            if (
                that._isArbitrating()
                && preferencesArbitrationRoundNumber < that._getArbitrationRoundNumberInt()
            ) {
                that.vars.currentWindowStart = 0;
                that.vars.lastActiveWindowStart = that._getClosestDisagreementWindowStartTimeInSeconds(1);
                if (that.vars.lastActiveWindowStart === false) {
                    that.vars.lastActiveWindowStart = that.options.startTime;
                }
            }
            that._switchToWindow(that.options.recordingName, that.vars.lastActiveWindowStart, that.options.windowSizeInSeconds);
        }
        else {
            alert('Could not retrieve user data.');
            return;
        }
        that._triggerOnReadyEvent();
        $(window).resize(that._reinitChart);
    },

    _setupArtifactPanel: function() {
        var activeClass = 'teal darken-4';
        var that = this;
        $(that.element).find('.artifact_panel button.artifact').click(function() {
            var button = $(this);
            var type = button.data('annotation-type');
            that._saveArtifactAnnotation(type);
            button
                .addClass(activeClass)
                .siblings()
                .removeClass(activeClass);
        });
    },

    _setupSleepStagePanel: function() {
       // console.log("inside sleep");
        var inactiveClass = 'grey lighten-1';
        var activeClassSelectedInPreviousRound = 'selected-in-previous-round ' + inactiveClass;
        var activeClassSelectedInCurrentRound = 'teal';
        var activeClasses = activeClassSelectedInPreviousRound + ' ' + activeClassSelectedInCurrentRound;
        var that = this;
        $(that.element).find('.sleep_stage_panel button.sleep_stage').click(function() {
           // console.log("clicked");
            
            var button = $(this);
            var type = button.data('annotation-type');
            button
                .removeClass(inactiveClass)
                .addClass(activeClassSelectedInCurrentRound)
                .siblings()
                .removeClass(activeClasses)
                .addClass(inactiveClass);
                
                that.vars.currType = type; 
                that._setupAnnotationInteraction();
                that._saveSleepStageAnnotation(type);
                
        });
    },

    _setupNavigationPanel: function() {
        var that = this;
        that._setJumpToLastDisagreementWindowEnabledStatus(false);
        that._setJumpToNextDisagreementWindowEnabledStatus(false);
        that._setForwardEnabledStatus(false);
        that._setFastForwardEnabledStatus(false);
        that._setBackwardEnabledStatus(false);
        that._setFastBackwardEnabledStatus(false);

        if (that.options.showBackToLastActiveWindowButton) {
            $(that.element).find('.backToLastActiveWindow').click(function() {
                that._switchBackToLastActiveWindow();
            });
        }
        if (that.options.showBookmarkCurrentPageButton) {
            $(that.element).find('.bookmarkCurrentPage').click(function() {
                that._toggleBookmarkCurrentPage();
            });
        }
        if (that._isArbitrating()) {
            $(that.element).find('.jumpToLastDisagreementWindow').click(function() {
                that._jumpToClosestDisagreementWindow(-1);
            });
            $(that.element).find('.jumpToNextDisagreementWindow').click(function() {
                that._jumpToClosestDisagreementWindow(1);
            });
        }
        if (that.options.showForwardButton) {
            $(that.element).find('.forward').click(function() {
                that._shiftChart(1);
            });
        }
        if (that.options.showBackwardButton) {
            $(that.element).find('.backward').click(function() {
                that._shiftChart(-1);
            });
        }
        if (that.options.showFastForwardButton) {
            $(that.element).find('.fastForward').click(function() {
                that._shiftChart(that.options.windowJumpSizeFastForwardBackward);
            });
        }
        if (that.options.showFastBackwardButton) {
            $(that.element).find('.fastBackward').click(function() {
                that._shiftChart(-that.options.windowJumpSizeFastForwardBackward);
            });
        }
        $(that.element).find('.gainUp').click(function() {
            that._updateChannelGain('step_increase');
        });
        $(that.element).find('.gainDown').click(function() {
            that._updateChannelGain('step_decrease');
        });
        $(that.element).find('.gainReset').click(function() {
            that._updateChannelGain('reset');
        });
        if (that.options.keyboardInputEnabled) {
            // setup arrow key navigation
            $(document).on('keydown', that._keyDownCallback);
        }
    },

    _getClosestDisagreementWindowStartTimeInSeconds: function(direction) {
        var that = this;
        if (!that._isArbitrating()) return false;
        annotationsWithDisagreement = that.options.context.assignment.annotationsWithDisagreementForCurrentArbitrationRound({ reactive: false });
        let notReclassified = Object.values(annotationsWithDisagreement.notReclassified).map(values => values[0].annotation.value.position.start);
        if (direction < 0) {
            notReclassified = notReclassified.filter(start => start < that.vars.currentWindowStart);
            if (notReclassified.length == 0) return false;
            return Math.max.apply(null, notReclassified);
        }
        else {
            notReclassified = notReclassified.filter(start => start > that.vars.currentWindowStart);
            if (notReclassified.length == 0) return false;
            return Math.min.apply(null, notReclassified);
        }
        return false;
    },

    _updateJumpToClosestDisagreementWindowButtonsEnabledStatus: function() {
        var that = this;
        const lastDisagreementWindowExists = that._getClosestDisagreementWindowStartTimeInSeconds(-1) !== false;
        that._setJumpToLastDisagreementWindowEnabledStatus(lastDisagreementWindowExists);
        const nextDisagreementWindowExists = that._getClosestDisagreementWindowStartTimeInSeconds(1) !== false;
        that._setJumpToNextDisagreementWindowEnabledStatus(nextDisagreementWindowExists);
    },

    _jumpToClosestDisagreementWindow: function(direction) {
        var that = this;
        var startInSeconds = that._getClosestDisagreementWindowStartTimeInSeconds(direction);
        if (startInSeconds === false) return;
        that.jumpToEpochWithStartTime(startInSeconds);
    },

    _keyDownCallback: function(e) {
        var that = this;
        if ($(e.target).is('input, textarea, select')) {
            return;
        }
        if (swal.isVisible()) {
            return;
        }
        var keyCode = e.which;
        var metaKeyPressed = e.metaKey;
        if (keyCode == 82 && metaKeyPressed) {
            // Suppress any action on CTRL+R / CMD+R page reload
            return;
        }
        if (keyCode == 72) {
            that._toggleClassificationSummary();
        } else if(keyCode == 66 && that.options.showBookmarkCurrentPageButton) {
            that._toggleBookmarkCurrentPage();
            return;
        } else if((keyCode == 37 /* || keyCode == 65 */ || keyCode == 34) && that.options.showBackwardButton) { // left arrow, a, page down
            // backward
            e.preventDefault();
            that._shiftChart(-1);
            return;
        } else if ((keyCode == 39 /* || keyCode == 68 */ || keyCode == 33) && that.options.showForwardButton) { // right arrow, d, page up
            // forward
            e.preventDefault();
            that._shiftChart(1);
            return;
        } else if (keyCode == 38) { // up arrow
            // fast foward
            e.preventDefault();
            that._updateChannelGain('step_increase');
            return;
        } else if (keyCode == 40) { // down arrow
            // fast backward
            e.preventDefault();
            that._updateChannelGain('step_decrease');
            return;
        } else if (keyCode == 65) {
            that._jumpToClosestDisagreementWindow(-1);
        } else if (keyCode == 68) {
            that._jumpToClosestDisagreementWindow(1);
        } else if (that.options.showSleepStageButtons) {
            var sleepStageShortCutPressed = false;
            $(that.element).find('.sleep_stage_panel .shortcut-key').each(function() {
                var character = $(this).text();
                var characterKeyCodeLowerCase = character.toLowerCase().charCodeAt(0);
                var characterKeyCodeAlternative = character.toUpperCase().charCodeAt(0);
                if (characterKeyCodeLowerCase >= 48 && characterKeyCodeLowerCase <= 57) {
                    characterKeyCodeAlternative = characterKeyCodeLowerCase + 48;
                }
                if (keyCode == characterKeyCodeLowerCase || keyCode == characterKeyCodeAlternative) {
                    e.preventDefault();
                    sleepStageShortCutPressed = true;
                    var button = $(this).parents('.sleep_stage').first();
                    button.click();
                }
            });
            if (sleepStageShortCutPressed) {
                return;
            }
        // make it possible to choose feature classificaiton using number keys
        } else if (keyCode >= 49 && keyCode <= 57) {
            e.preventDefault();
            var featureClassButton = $(that.element).find('.feature').eq(keyCode - 49)
            if (featureClassButton) {
                that._selectFeatureClass(featureClassButton);
            }
            return;
        // separate case for the numpad keys, because javascript is a stupid language
        } else if (keyCode >= 97 && keyCode <= 105) {
            e.preventDefault();
            var featureClassButton = $(that.element).find('.feature').eq(keyCode - 97)
            if (featureClassButton) {
                that._selectFeatureClass(featureClassButton);
            }
            return;
        }
    },

    _toggleClassificationSummary: function() {
        var that = this;
        var classificationSummaryElement = that._getClassificationSummaryElement();
        if (classificationSummaryElement.is(':visible')) {
            classificationSummaryElement.hide();
            classificationSummaryElement.css({ height: 0 });
        }
        else {
            classificationSummaryElement.show();
            classificationSummaryElement.css({ height: '' });
        }
        that._reinitChart();
    },

    _toggleBookmarkCurrentPage: function() {
        var that = this;
        const bookmarkedPages = that.options.context.preferences.annotatorConfig.bookmarkedPages || {};
        const pageKey = that.vars.currentWindowStart;
        if (bookmarkedPages[pageKey] === true) {
            delete bookmarkedPages[pageKey];
        }
        else {
            bookmarkedPages[pageKey] = true;
        }
        that._reinitChart();
        that._updateBookmarkCurrentPageButton();
        that._savePreferences({
            bookmarkedPages: bookmarkedPages,
        });
    },

    _updateBookmarkCurrentPageButton: function() {
        var that = this;
        const bookmarkedPages = that.options.context.preferences.annotatorConfig.bookmarkedPages || {};
        const pageKey = that.vars.currentWindowStart;
        const isBookmarked = bookmarkedPages[pageKey] === true;
        $(that.element).find('.bookmarkCurrentPage').prop('disabled', null).toggleClass('active', isBookmarked);
    },

    _setupTrainingPhase: function() {
        var that = this;
        if (!that._areTrainingWindowsSpecified()) return;
        that._setForwardEnabledStatus(true);
        that._getSpecifiedTrainingWindows();
    },

    _setupArbitration: function() {
        var that = this;
        if (!that._isArbitrating()) return;
        that.options.numberOfForwardWindowsToPrefetch = 2;
        that.options.numberOfFastForwardWindowsToPrefetch = 0;
        that.options.numberOfBackwardWindowsToPrefetch = 2;
        that.options.numberOfFastBackwardWindowsToPrefetch = 0;
    },

    _setJumpToLastDisagreementWindowEnabledStatus: function(status) {
        var that = this;
        var status = !!status;

        that.vars.jumpToLastDisagreementWindow = status;
        $(that.element).find('.jumpToLastDisagreementWindow').prop('disabled', !status);
    },

    _setJumpToNextDisagreementWindowEnabledStatus: function(status) {
        var that = this;
        var status = !!status;

        that.vars.jumpToNextDisagreementWindow = status;
        $(that.element).find('.jumpToNextDisagreementWindow').prop('disabled', !status);
    },

    _setForwardEnabledStatus: function(status) {
        var that = this;
        var status = !!status;

        that.vars.forwardEnabled = status;
        $(that.element).find('.forward').prop('disabled', !status);
    },

    _setFastForwardEnabledStatus: function(status) {
        var that = this;
        var status = !!status;

        that.vars.fastForwardEnabled = status;
        $(that.element).find('.fastForward').prop('disabled', !status);
    },

    _setBackwardEnabledStatus: function(status) {
        var that = this;
        var status = !!status;

        that.vars.backwardEnabled = status;
        $(that.element).find('.backward').prop('disabled', !status);
    },

    _setFastBackwardEnabledStatus: function(status) {
        var that = this;
        var status = !!status;

        that.vars.fastBackwardEnabled = status;
        $(that.element).find('.fastBackward').prop('disabled', !status);
    },

    _selectFeatureClass: function(featureClassButton) {
        /* called with the user clicks on one of the feature toggle buttons, or presses one of the
        relevant number keys, this method updates the state of the toggle buttons, and sets the
        feature type */
        var that = this;
        featureClassButton.addClass('active');
        featureClassButton.siblings().removeClass('active');
        that.vars.activeFeatureType = featureClassButton.data('annotation-type');
    },

    _shiftChart: function(windows) {
        var that = this;
        if (!that.vars.forwardEnabled && windows >= 1) return;
        if (!that.vars.fastForwardEnabled && windows >= that.options.windowJumpSizeFastForwardBackward) return;
        if (!that.vars.backwardEnabled && windows <= -1) return;
        if (!that.vars.fastBackwardEnabled && windows <= -that.options.windowJumpSizeFastForwardBackward) return;
        var nextRecordingName = that.options.recordingName;
        var nextWindowSizeInSeconds = that.options.windowSizeInSeconds;
        var nextWindowStart = that.options.currentWindowStart;
        if (that.options.experiment.running) {
            var currentWindowIndex = that.options.experiment.current_condition.current_window_index;
            currentWindowIndex += windows;
            that.options.experiment.current_condition.current_window_index = currentWindowIndex;
            nextWindowStart = that.options.experiment.current_condition.windows[currentWindowIndex];
            that._updateNavigationStatusForExperiment();
        }
        else if (
            that._areTrainingWindowsSpecified()
            && that._isCurrentWindowTrainingWindow()
        ) {
            that.vars.currentTrainingWindowIndex += windows;
            if (that._isCurrentWindowTrainingWindow()) {
                var nextTrainingWindow = that._getCurrentTrainingWindow();
                nextRecordingName = nextTrainingWindow.recordingName;
                nextWindowStart = nextTrainingWindow.timeStart;
                nextWindowSizeInSeconds = nextTrainingWindow.windowSizeInSeconds;
            }
            else {
                nextWindowStart = that.options.startTime;
                nextWindowSizeInSeconds = that.options.windowSizeInSeconds;
            }
            that._flushAnnotations();
        }
        else {
            if (that._areTrainingWindowsSpecified()) {
                that.vars.currentTrainingWindowIndex += windows;
            }
            nextWindowStart = Math.max(0, that.vars.currentWindowStart + that.options.windowSizeInSeconds * windows);
        }
        that._switchToWindow(nextRecordingName, nextWindowStart, nextWindowSizeInSeconds);
    },

    _switchToWindow: function (recording_name, start_time, window_length) {
        var that = this;
        if (!that._isCurrentWindowSpecifiedTrainingWindow()) {
            if (that.options.visibleRegion.start !== undefined) {
                start_time = Math.max(that.options.visibleRegion.start, start_time );
                start_time = window_length * Math.ceil(start_time / window_length);
                that._setBackwardEnabledStatus(start_time - window_length >= that.options.visibleRegion.start);
                that._setFastBackwardEnabledStatus(start_time - window_length * that.options.windowJumpSizeFastForwardBackward >= that.options.visibleRegion.start);
            }

            if (that.options.visibleRegion.end !== undefined) {
                start_time = Math.min(that.options.visibleRegion.end - window_length, start_time);
                start_time = window_length * Math.floor(start_time / window_length);
                var forwardEnabled = start_time + window_length <= that.options.visibleRegion.end - window_length;
                that._setForwardEnabledStatus(forwardEnabled);
                if (!forwardEnabled) {
                    that._lastWindowReached();
                }
                that._setFastForwardEnabledStatus(start_time + window_length * that.options.windowJumpSizeFastForwardBackward < that.options.visibleRegion.end - window_length);
            }
        }

        if (that.vars.currentWindowStart != start_time) {
            that._setNumberOfAnnotationsInCurrentWindow(0);
        }

        that.vars.currentWindowStart = start_time;
        that.vars.currentWindowRecording = recording_name;
        that._updateJumpToClosestDisagreementWindowButtonsEnabledStatus();

        if (that._isVisibleRegionDefined()) {
            var progress = that._getProgressInPercent();
            $(that.element).find('.progress-bar').css('width', progress + '%');
        }

        if (that._isCurrentWindowLastTrainingWindow() && that._isTrainingOnly()) {
            that._lastWindowReached();
        }

        if (that._isCurrentWindowFirstTrainingWindow() && !that._isTrainingOnly()) {
            bootbox.alert({
                closeButton: false,
                title: 'Beginning of the Training Phase',
                message: 'Welcome to our CrowdEEG experiment for scientific crowdsourcing!<br><br>This is the beginning of the training phase, meaning that, for the next ' + that._getNumberOfTrainingWindows() + ' window(s), we will show you the correct answer after you have submitted yours. The examples panel below will be visible throughout the entire task. We hope the training phase will help you learn more about the signal pattern we are looking for.',
                callback: function() {
                    that._saveUserEventWindowBegin();
                },
            }).css({zIndex: 1}).appendTo(that.element);
        }
        else {
            that._saveUserEventWindowBegin();
        }

        that._savePreferences({ startTime: start_time })

        var windowsToRequest = [
            start_time
        ];
        if (
            !that._isCurrentWindowSpecifiedTrainingWindow()
            && !that.options.experiment.running
        ) {
            for (var i = 1; i <= that.options.numberOfForwardWindowsToPrefetch; ++i) {
                windowsToRequest.push(start_time + i * window_length);
            }
            for (var i = 1; i <= that.options.numberOfFastForwardWindowsToPrefetch; ++i) {
                windowsToRequest.push(start_time + i * that.options.windowJumpSizeFastForwardBackward * window_length);
            }
            for (var i = 1; i <= that.options.numberOfBackwardWindowsToPrefetch; ++i) {
                windowsToRequest.push(start_time  - i * window_length);
            }
            for (var i = 1; i <= that.options.numberOfFastBackwardWindowsToPrefetch; ++i) {
                windowsToRequest.push(start_time - i * that.options.windowJumpSizeFastForwardBackward * window_length);
            }
        }
        that._getDelay();
        //console.log(that.vars.delayAmount);
        //that._setDelay(assign);
        //console.log(that.vars.delayAmount);
        windowsToRequest.forEach((windowStartTime) => {
            channelsDelayed = {
                channelNames: that.vars.channelsDealyedNames,
                delayAmount: that.vars.delayAmount,
            }
            var options = {
                recording_name: recording_name,
                channels_displayed: that._getChannelsDisplayed(),
                start_time: windowStartTime,
                delayExists: that.vars.delayExists,
                channelsDelayed: channelsDelayed,
                window_length: window_length,
                target_sampling_rate: that.options.targetSamplingRate,
                use_high_precision_sampling: that.options.useHighPrecisionSampling,
            };
           
            that._requestData(options, (data, errorData) => {
               // console.log(options);
                var windowAvailable = !errorData;
                if (windowAvailable && windowStartTime == that.vars.currentWindowStart) {
                    that._applyFrequencyFilters(data, (dataFiltered) => {
                        that.vars.currentWindowData = dataFiltered;
                        that._populateGraph(that.vars.currentWindowData);
                    });
                }
                if (!that.options.experiment.running) {
                    switch (windowStartTime) {
                        case that.vars.currentWindowStart + window_length:
                            if (that.options.visibleRegion.end === undefined) {
                                that._setForwardEnabledStatus(windowAvailable);
                                if (!windowAvailable) {
                                    that._lastWindowReached();
                                }
                            }
                            break;
                        case that.vars.currentWindowStart + window_length * that.options.windowJumpSizeFastForwardBackward:
                            if (that.options.visibleRegion.end === undefined) {
                                that._setFastForwardEnabledStatus(windowAvailable);
                            }
                            break;
                        case that.vars.currentWindowStart - window_length:
                            if (that.options.visibleRegion.start === undefined) {
                                that._setBackwardEnabledStatus(windowAvailable);
                            }
                            break;
                        case that.vars.currentWindowStart - window_length * that.options.windowJumpSizeFastForwardBackward:
                            if (that.options.visibleRegion.start === undefined) {
                                that._setFastBackwardEnabledStatus(windowAvailable);
                            }
                            break;
                    }
                }
            });
        });
    }, 

    jumpToEpochWithStartTime: function(epochStartTimeInSeconds) {
        var that = this;
        if (isNaN(epochStartTimeInSeconds) || epochStartTimeInSeconds === undefined) {
            console.error('Cannot jump to epoch with start time', epochStartTimeInSeconds);
            return;
        }
        that._switchToWindow(that.options.recordingName, epochStartTimeInSeconds, that.options.windowSizeInSeconds);
    },

    getCurrentWindowStartReactive: function() {
        var that = this;
        return that.vars.currentWindowStartReactive.get();
    },

    _reloadCurrentWindow: function() {
        var that = this;
        that._switchToWindow(that.options.recordingName, that.vars.currentWindowStart, that.options.windowSizeInSeconds);
    },

    _reinitChart: function() {
        var that = this;
        if (that.vars.chart) {
            that.vars.chart.destroy();
        }
        that.vars.chart = undefined;
        that.vars.annotationsLoaded = false;
        that.vars.annotationsCache = {};
        that._reloadCurrentWindow();
    },

    _getProgressInPercent: function() {
        var that = this;
        if (!that._isVisibleRegionDefined()) return;
        var windowSize = that.options.windowSizeInSeconds;
        var start = windowSize * Math.ceil(that.options.visibleRegion.start / windowSize);
        var end = windowSize * Math.floor((that.options.visibleRegion.end - windowSize) / windowSize);
        if (!that._areTrainingWindowsSpecified()) {
            var progress = (that.vars.currentWindowStart - start + windowSize) / (end - start + 2 * windowSize);
        }
        else {
            var numberOfTrainingWindows = that._getNumberOfTrainingWindows();
            var numberOfWindowsInVisibleRegion = Math.floor((end - start) / windowSize);
            var numberOfWindowsTotal = numberOfWindowsInVisibleRegion + numberOfTrainingWindows;
            var currentWindowIndex = that.vars.currentTrainingWindowIndex;
            var progress = (currentWindowIndex + 1) / (numberOfWindowsTotal + 2);
        }
        var progressInPercent = Math.ceil(progress * 100);
        return progressInPercent;
    },

    _switchBackToLastActiveWindow: function() {
        var that = this;
        if (!that.vars.lastActiveWindowStart) {
            that.vars.lastActiveWindowStart = 0;
        }        that._switchToWindow(that.options.recordingName, that.vars.lastActiveWindowStart, that.options.windowSizeInSeconds);

    },

    _requestData: function(options, callback) {
        
        var that = this;
        var identifierKey = that._getIdentifierKeyForDataRequest(options);
        
        var noDataError = 'No data available for window with options ' + JSON.stringify(options);

       // console.log(options.start_time);
       // console.log(that.vars.recordingMetadata.LengthInSeconds);
        if (options.start_time < 0) {
            that.vars.windowsCache[identifierKey] = false;
            //console.log("1");
        }
        else if (options.start_time > that.vars.recordingMetadata.LengthInSeconds) {
            that.vars.windowsCache[identifierKey] = false;
           // console.log("2");
        }
      //  console.log(that.vars.windowsCache[identifierKey]);
        if (that.vars.windowsCache[identifierKey] === false) {
            if (callback) {
               // console.log("3");
                
                callback(null, noDataError);
                
            }
           // console.log("4");
            return;
        }
        
        var reprint = that.vars.reprint;
        if(that.vars.timeChange == true ){
            that.vars.timeChange = false;
        } 
        else {
            if (that.vars.windowsCache[identifierKey] && reprint == 0) {
                if (that.vars.windowsCache[identifierKey].data && callback) {
                    //console.log("optionsTime");
                    callback(that.vars.windowsCache[identifierKey].data);
                }
                return;
            }
    }
        const numSecondsToPadBeforeAndAfter = 2;
        
        const optionsPadded = JSON.parse(JSON.stringify(options));
    
        optionsPadded.start_time -= numSecondsToPadBeforeAndAfter;
       
        optionsPadded.start_time = Math.max(0, optionsPadded.start_time);
       
        const numSecondsPaddedBefore = options.start_time - optionsPadded.start_time ;
        optionsPadded.window_length = options.window_length + numSecondsPaddedBefore + numSecondsToPadBeforeAndAfter;

       // console.log("crossed");
        //console.log(that.vars.delayAmount);
        Meteor.call('get.edf.data', optionsPadded, (error, data) => {
            if (error) {
                console.log(error.message);
                callback(null, error.message);
                return;
            }
            //console.log(data);
            if (!that._isDataValid(data)) {
                that.vars.windowsCache[identifierKey] = false;
                
                if (callback) {
                    callback(null, noDataError);
                }
            }
            else {
             //   console.log(data);
                that.vars.windowsCache[identifierKey].data = that._transformData(data, numSecondsPaddedBefore, options.window_length, numSecondsToPadBeforeAndAfter);
                that.vars.reprint = 0;
                if (callback) {
                    
                    callback(that.vars.windowsCache[identifierKey].data);
                }
            }
        });

        that.vars.windowsCache[identifierKey] = {
            request: 'placeholder'
        };
    },

    _transformData: function(input, numSecondsPaddedBefore, numSecondsDataOfInterest, numSecondsPaddedAfter) {
       // console.log("inside here");
        var that = this;
        var channels = [];
        var options = that.vars.valueOptions;
        if(options == null){
            options = 0;
        }
        var channelAudioRepresentations = {};
        var channelNumSamples = {};
        var samplingRate = input.sampling_rate;
        for (var name in input.channel_values) {
            var values = input.channel_values[name];
            //console.log(that.vars.audioContextSampleRate);
            var offlineCtx = new OfflineAudioContext(1, values.length, that.vars.audioContextSampleRate);
            var audioBuffer = offlineCtx.createBuffer(1, values.length, offlineCtx.sampleRate);
            var scaleFactorFrequency = offlineCtx.sampleRate / samplingRate;
            
            var scaleFactorAmplitude = values.map(Math.abs).reduce((a, b) => Math.max(a,b));
            var maxIn = scaleFactorAmplitude;
            //console.log(maxIn);
            var thisCounting = values.reduce((a,b) => a + 1);
            var y95 = 0;
            var y05 = 0;
            scaleFactorAmplitude = values.map(Math.abs).reduce((a, b) => Math.max(a,b));//that._findMeanPercentile(0.95,0.005,values, thisCounting);
            //console.log(name);
            var avg = (values.reduce((a,b) => a + b))/thisCounting;
            avg = Math.abs(avg);
            //console.log(avg);
            var changeVal = values.reduce((a,b) => a + Math.abs(avg -b));
            //console.log(changeVal);
           
           // console.log(name);
         //   console.log(scaleFactorAmplitude) ;
            var valuesScaled = values;

            var scaleValueChange = maxIn*scaleFactorAmplitude;
          
            if (scaleFactorAmplitude != 0) {
              //  console.log(name);
                valuesScaled = values.map(v => v/scaleFactorAmplitude);//(500*(v-scaleFactorAmplitude))/(y95-y05));
    
               // console.log(valuesScaled);
            }
            audioBuffer.copyToChannel(valuesScaled, 0, 0);
          var scaleFault = 0;
            if( options == 0){
                switch(name){
                    case  "F4-A1":
                        scaleFault = 1;
                        break;
        
                    case "C4-A1":
                        scaleFault = 1;
                        break;
                    case "O2-A1":
                        scaleFault = 1;
                        break;
                    case "LOC-A2":
                        scaleFault = 1;
                        break;
                    case "ROC-A1":
                        scaleFault = 1;
                        break;
                    case "Chin 1-Chin 2":
                        scaleFault = 1000;
                        break;
        
                    case "ECG":
                        scaleFault = 100;
                        break;
                    case "Leg/L":
                        scaleFault = 50;
                        break;
                    case "Leg/R":
                        scaleFault = 50;
                        break;
                    case "Snore":
                        scaleFault = 600;
                        break;
                    case "Airflow":
                        scaleFault = 100;
                        break;
                    case "Nasal Pressure":
                        scaleFault = 100;     
                        break;
                    case "Thor":
                        scaleFault = 500;
                        break;
                    
                    case "Abdo":
                        scaleFault = 100;
                        break;
                    case "SpO2":
                        scaleFault = 1.5;
                        break;
                    case "Pleth":
                        scaleFault = 0.03;
                         break;
                    case "Accl Pitch":
                        scaleFault = 10;
                        break;
                    case "Accl Roll":
                        scaleFault = 10;
                        break;
                    case "Resp Effort":
                        scaleFault = 100;
                        break;
                    case "HR(bpm)":
                        scaleFault = 3.5;
                        break;
                    case "SpO2(%)":
                        scaleFault = 3.5;
                        break;
                    case "PI(%)":
                        scaleFault = 85;
                        break;
                    case "PAT(ms)":
                        scaleFault = 0.1;
                        break;
                    case "Chest Temp(A C)":
                        scaleFault = 10;
                            break;
                    case "Limb Temp(A C)":
                        scaleFault = 10;
                        break;
                }
                scaleFactorAmplitude = scaleFactorAmplitude*scaleFault;
                sessionStorage.setItem(name+"scaleFactorAmplitude", scaleFault);
                
                //console.log(name);
               // console.log(scaleFactorAmplitude);
            }
            else if(options == 2){
            //console.log(changeVal);
           // console.log(scaleFactorAmplitude);
            while(changeVal > 0 && scaleValueChange > 0 && changeVal < 10000 && (scaleValueChange*10) < 500){
               //       console.log(changeVal);
                scaleFactorAmplitude = scaleFactorAmplitude*3;
                //scaleValueChange = scaleFactorAmplitude*maxIn;
              //  console.log(scaleFactorAmplitude*maxIn);
                changeVal = changeVal*7;
            }
           // console.log(name);
          //  console.log(scaleFactorAmplitude);
            sessionStorage.setItem((name+"scaleFactorAmplitude"), scaleFactorAmplitude);
        }
        else if(options == 1){
            //requiredName = "Thor"//sessionStorage.getItem("requiredName");
            requiredName = that.vars.requiredName;
            //console.log(name);
           // console.log(requiredName);
            var scaleFault = sessionStorage.getItem(name+"scaleFactorAmplitude");
            var oncecheck = that.vars.increaseOnce;
            if(name == requiredName && oncecheck == 1 ){
                scaleFault = scaleFault*5;
               // console.log(scaleFault);
                that.vars.increaseOnce = 0;
            }
            
            sessionStorage.setItem((name+"scaleFactorAmplitude"), scaleFault);
            //sessionStorage.setItem(("requiredName"),"");
            scaleFactorAmplitude = scaleFactorAmplitude*scaleFault;
           // console.log(sessionStorage.setItem((name+"scaleFactorAmplitude"), scaleFault));
          //  console.log(scaleFault);
            //console.log(scaleFactorAmplitude);
        }
        else if(options == -1){
            //requiredName = "Thor"//sessionStorage.getItem("requiredName");
            var scaleFault = sessionStorage.getItem(name+"scaleFactorAmplitude");
            requiredName = that.vars.requiredName;
            var oncecheck = that.vars.increaseOnce;
            if(name == requiredName && oncecheck == 1){
                scaleFault = scaleFault/5;
                that.vars.increaseOnce = 0;
            }
           // console.log(sessionStorage.setItem((name+"scaleFactorAmplitude"), scaleFault));
            //console.log(scaleFault);
            sessionStorage.setItem((name+"scaleFactorAmplitude"), scaleFault);
            scaleFactorAmplitude = scaleFactorAmplitude*scaleFault;
        }
         /*   
            if(scaleValueChange > 500 ){
                scaleValueChange = 500/maxIn;
                scaleFactorAmplitude = scaleValueChange;
            }
*/
            channelAudioRepresentations[name] = {
                buffer: audioBuffer,
                scaleFactors: {
                    frequency: scaleFactorFrequency,
                    amplitude:scaleFactorAmplitude,
                },
            };
            var numSamplesPaddedBefore = numSecondsPaddedBefore * samplingRate;
            var numSamplesDataOfInterest = Math.min(numSecondsDataOfInterest * samplingRate, values.length - numSamplesPaddedBefore);

            var numSamplesPaddedAfter = values.length - numSamplesPaddedBefore - numSamplesDataOfInterest;
            channelNumSamples[name] = {
                paddedBefore: numSamplesPaddedBefore,
                dataOfInterest: numSamplesDataOfInterest,
                paddedAfter: numSamplesPaddedAfter,
            };
        }
       
        for (var i = 0; i < input.channel_order.length; ++i) {
            var name = input.channel_order[i];
            
            if(channelNumSamples[name]){
                var channel = {
                    name: name,
                    audio: channelAudioRepresentations[name],
                    numSamples: channelNumSamples[name],
                }
                channel.valuesPadded = new Float32Array(channel.audio.buffer.length - channel.numSamples.paddedBefore);
    
                channels.push(channel);
        }
        }
        var output = {
            channels: channels,
            sampling_rate: input.sampling_rate
        }
        return output;
    },


    _findMeanPercentile: function (top, bottom, values, thisCounting){
    var sortValues = values;
    sortValues.sort();
    var upside = top*thisCounting;
    var downside = bottom*thisCounting;

    var topValue = sortValues[Math.ceil(upside)];
    var bottomValue = sortValues[Math.floor(downside)];

    return (((topValue+bottomValue)/2),topValue, bottomValue);

    },

    _applyFrequencyFilters: function(data, callback) {
        var that = this;
        var numRemainingChannelsToFilter = data.channels.length;
        var maxDetectableFrequencyInHz = data.sampling_rate / 2;
        var frequencyFilters = that.vars.frequencyFilters || [];
        data.channels.forEach((channel, c) => {
            
            var staticFrequencyFilters = that._getStaticFrequencyFiltersForChannel(channel);
            var buffer = channel.audio.buffer;
            var offlineCtx = new OfflineAudioContext(1, buffer.length, that.vars.audioContextSampleRate);
            var valuesFiltered = data.channels[c].valuesFilteredHolder;
            var bufferSource = offlineCtx.createBufferSource();
            bufferSource.buffer = buffer;
            var currentNode = bufferSource;
            const allFrequencyFilters = staticFrequencyFilters.concat(frequencyFilters);
            allFrequencyFilters.forEach((frequencyFilter) => {
                var filterType = frequencyFilter.type;
                var frequencyInHz = parseFloat(frequencyFilter.selectedValue);
                if (isNaN(frequencyInHz) || frequencyInHz === undefined || frequencyInHz <= 0) {
                    return;
                }
                if (frequencyInHz > maxDetectableFrequencyInHz) {
                    // console.log('Not applying ' + filterType + ' filter with frequency ' + frequencyInHz + 'Hz as it exceeds the maximum detectable frequency of ' + maxDetectableFrequencyInHz + 'Hz for this data, sampled at ' + data.sampling_rate + 'Hz.');
                    return;
                }
                // console.log('Applying ' + filterType + ' filter with frequency ' + frequencyInHz + 'Hz.');
                var filterNode = offlineCtx.createBiquadFilter();
                filterNode.type = filterType;
                var scaleFactorFrequency = channel.audio.scaleFactors.frequency;
                filterNode.frequency.value = frequencyInHz * scaleFactorFrequency;
                // If filter results are not as expected,
                // double check settings for Q factor:
                //   - https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
                //   - https://electronics.stackexchange.com/questions/221887/does-q-factor-matter-for-low-pass-and-high-pass-filters
                //   - https://stackoverflow.com/questions/33540440/bandpass-filter-which-frequency-and-q-value-to-represent-frequency-range
                // filterNode.Q.value = 1 (default)
                currentNode.connect(filterNode);
                currentNode = filterNode;
            });
            currentNode.connect(offlineCtx.destination);
            bufferSource.start();
            offlineCtx.startRendering().then((bufferFiltered) => {
                bufferFiltered.copyFromChannel(channel.valuesPadded, 0, channel.numSamples.paddedBefore);
                channel.values = channel.valuesPadded.subarray(0, channel.numSamples.dataOfInterest);
                var scaleFactorAmplitude = channel.audio.scaleFactors.amplitude;
                if (scaleFactorAmplitude != 0) {
                    channel.values = channel.values.map(v => v * scaleFactorAmplitude);
                 //   console.log(buffer);
                  //  console.log(channel.values);
                }
                --numRemainingChannelsToFilter;
                if (numRemainingChannelsToFilter <= 0) {
                    callback(data);
                }
            }).catch((error) => {
                console.error('Rendering failed', error);
            });
        });
    },

    _getIdentifierObjectForDataRequest: function(options) {
        var options = options || {};
        var relevantOptions = [
            'recording_name',
            'start_time',
            'window_length',
            'channels_displayed',
        ];
        var identifierObject = {};
        for (var i = 0; i < relevantOptions.length; ++i) {
            identifierObject[relevantOptions[i]] = options[relevantOptions[i]];
        }
        return identifierObject;
    },

    _getIdentifierKeyForDataRequest: function(options) {
        var that = this;
        var identifierKey = JSON.stringify(that._getIdentifierObjectForDataRequest(options));
        return identifierKey;
    },

    _isDataValid: function(data) {
        if (!data) return false;
        if (!data.sampling_rate) return false;
        if (!data.channel_order) return false;
        if (!data.channel_values) return false;
        for (let c = 0; c < data.channel_values.length; ++c) {
            if (data.channel_values[c].length == 0) {
                return false;
            }
        }
        return true;
    },

    _populateGraph: function(data) {
        /* plot all of the points to the chart */
        var that = this;
        // if the chart object does not yet exist, because the user is loading the page for the first time
        // or refreshing the page, then it's necessary to initialize the plot area
        if (!that.vars.chart) {
            //console.log("here")
            // if this is the first pageload, then we'll need to load the entire
            that._initGraph(data);
        // if the plot area has already been initialized, simply update the data displayed using AJAX calls
        }
        that._updateChannelDataInSeries(that.vars.chart.series, data);
        that.vars.chart.xAxis[0].setExtremes(that.vars.currentWindowStart, that.vars.currentWindowStart + that.options.windowSizeInSeconds, false, false);
        that.vars.chart.redraw(); // efficiently redraw the entire window in one go
        var chart = that.vars.chart;
        // use the chart start/end so that data and annotations can never
        // get out of synch
        that._refreshAnnotations();
        that._renderChannelSelection();
        that._updateBookmarkCurrentPageButton();
        that.vars.currentWindowStartReactive.set(that.vars.currentWindowStart);
    },

    _updateChannelDataInSeries: function(series, data) {
        var that = this;
        var channels = data.channels;
        var xValues = Array.from(data.channels[0].values.map(function(value, v) {
            return that.vars.currentWindowStart + v / data.sampling_rate;
        }));
        var recordingEndInSecondsSnapped = that._getRecordingEndInSecondsSnapped();
        return channels.map(function (channel, c) {
            var flipFactor = that._getFlipFactorForChannel(channel);
            var gain = that._getGainForChannelIndex(c);
            if (gain === undefined) {
                gain = 1.0;
            }
            var flipFactorAndGain = flipFactor * gain;
            var offsetPreScale = that._getOffsetForChannelPreScale(channel);
            var offsetPostScale = that._getOffsetForChannelIndexPostScale(c);
            samplesScaledAndOffset = channel.values.map(function(value, v) {
                return (value + offsetPreScale) * flipFactorAndGain + offsetPostScale;
            });
            var seriesData = xValues.map(function(x, i) {
                return [x, samplesScaledAndOffset[i]];
            });
            seriesData.unshift([-that.options.windowSizeInSeconds, offsetPostScale]);
            seriesData.push([recordingEndInSecondsSnapped, offsetPostScale]);
            series[c].setData(seriesData, false, false, false);
        });
    },

    _initSeries: function(data) {
        var that = this;
        var samplingRate = data.sampling_rate;
        var channels = data.channels;
        var recordingEndInSecondsSnapped = that._getRecordingEndInSecondsSnapped();
        return channels.map(function (channel, c) {
            var offset = that._getOffsetForChannelIndexPostScale(c);
            return {
                name: channel.name,
                data: [[0, offset], [recordingEndInSecondsSnapped, offset]],
            };
        });
    },

    _getRecordingEndInSecondsSnapped: function() {
        var that = this;
        return (Math.ceil(that.vars.recordingMetadata.LengthInSeconds / that.options.windowSizeInSeconds) + 1) * that.options.windowSizeInSeconds;
    },

    _getLatestPossibleWindowStartInSeconds: function() {
        var that = this;
        return Math.floor(that.vars.recordingMetadata.LengthInSeconds / that.options.windowSizeInSeconds) * that.options.windowSizeInSeconds;
    },

    _getClassificationSummaryElement: function() {
        var that = this;
        return $(that.element).parents('.annotator-edf').find('.classification-summary');
    },

    _initGraph: function(data) {
        /* This method is called only when the page is first loaded, it sets up the plot area, the
        axis, channel name labels, time formatting and everything else displayed on the plot

        subsequent changes to this plot to scroll through the signal use the much computationally expensive
        series update and axis update methods.
        */
        var that = this;
        var channels = data.channels;
        
        //console.log(that.vars.channelsDealyedNames);
        that.vars.graphID = 'time-series-graph-' + that._getUUID();
        var graph = $(that.element).find('.graph');
        graph.children().remove();
        graph.append('<div id="' + that.vars.graphID + '" style="margin: 0 auto"></div>');

        var classificationSummaryContainer = that._getClassificationSummaryElement();
        if (classificationSummaryContainer.length == 0) {
            var classificationSummaryHeight = 0;
        } else {
            var classificationSummaryHeight = classificationSummaryContainer.height() + parseInt(classificationSummaryContainer.css('margin-top')) + parseInt(classificationSummaryContainer.css('margin-bottom'));
        }
        var graphHeight = $(that.element).height() - (parseInt(graph.css('padding-top')) + parseInt(graph.css('padding-bottom')) + parseInt(graph.css('margin-top')) + parseInt(graph.css('margin-bottom'))) - classificationSummaryHeight;
        var graphContainerOtherChildren = $(that.element).find('.graph_container > *').not(graph);
        graphContainerOtherChildren.each(function() {
            var child = $(this);
            graphHeight -= (child.height() + parseInt(child.css('margin-top')) + parseInt(child.css('margin-bottom')));
        });

        bookmarkData = [];
        const bookmarkedPages = that.options.context.preferences.annotatorConfig.bookmarkedPages;
        for (pageKey in bookmarkedPages) {
            if (bookmarkedPages[pageKey] === true) {
                bookmarkData.push(parseInt(pageKey));
            }
        }
        bookmarkData.sort((a, b) => a - b);
        bookmarkData = bookmarkData.map((pageKey) => {
            return [pageKey + that.options.windowSizeInSeconds / 2, 1];
        });

        myFunction = function() {
            var popup = document.getElementById("myPopup");
            popup.classList.toggle("show");
        },

        that.vars.chart = new Highcharts.Chart({
            boost: {
                enabled: true,
                seriesThreshold: 1,
            },
            chart: {
                animation: false,
                renderTo: that.vars.graphID,
                width: that.options.graph.width,
                height: graphHeight,
                marginTop: that.options.graph.marginTop,
                marginBottom: that.options.graph.marginBottom,
                marginLeft: that.options.graph.marginLeft,
                marginRight: that.options.graph.marginRight,
                backgroundColor: that.options.graph.backgroundColor,
                events: {
                    load: function(event) {
                        that._setupLabelHighlighting();
                    },
                    redraw: function(event) {
                        that._setupLabelHighlighting();
                        that._setupYAxisLinesAndLabels();
                    }
                },
            },
            credits: {
                enabled: false
            },
            title: {
                text: (that.options.recordingName.split('/'))[(that.options.recordingName.split('/')).length - 1 ]
            },
            tooltip: {
                enabled: false
            },
            annotations: null,
            plotOptions: {
                series: {
                    animation: false,
                    turboThreshold: 0,
                    type: 'line',
                    color: 'black',
                    lineWidth: that.options.graph.lineWidth,
                    enableMouseTracking: that.options.graph.enableMouseTracking,
                    stickyTracking: true,
                    events: {
                        mouseOver: function(e) {
                            that._selectChannel(e.target.index);
                        },
                        mouseOut: function(e) {
                            that._unselectChannels();
                        },
                    }
                },
                line: {
                    marker: {
                        enabled: false,
                    }
                },
                polygon: {

                },
            },
            navigator: {
                enabled: true,
                adaptToUpdatedData: true,
                height: 20,
                margin: 25,
                handles: {
                    enabled: false,
                },
                xAxis: {
                    labels: {
                        formatter: that._formatXAxisLabel,
                        style: {
                            textOverflow: 'none',
                        }
                    },
                },
                series: {
                    type: 'area',
                    color: '#26a69a',
                    fillOpacity: 1.0,
                    lineWidth: 1,
                    marker: {
                        enabled: false
                    },
                    data: bookmarkData,
                }
            },
            xAxis: {
                gridLineWidth: 1,
                labels: {
                    enabled: that.options.showTimeLabels,
                    crop: false,
                    style: {
                        textOverflow: 'none',
                    },
                    step: that.options.windowSizeInSeconds / 6,
                    formatter: that._formatXAxisLabel,
                },
                tickInterval: 1,
                minorTickInterval: 0.5,
                min: that.vars.currentWindowStart,
                max: that.vars.currentWindowStart + that.options.windowSizeInSeconds,
                unit: [
                    ['second', 1]
                ],
                events: {
                    setExtremes: function (e) {
                        if (e.trigger == 'navigator') {
                            var startTimeSnapped = Math.round(e.min / that.options.windowSizeInSeconds) * that.options.windowSizeInSeconds;
                            startTimeSnapped = Math.max(0, startTimeSnapped);
                            startTimeSnapped = Math.min(that._getLatestPossibleWindowStartInSeconds(), startTimeSnapped);
                            that._switchToWindow(that.options.recordingName, startTimeSnapped, that.options.windowSizeInSeconds);
                            return false;
                        }
                    }
                }
            },
            yAxis: {
                tickInterval: 100,
                minorTickInterval: 50,
                min: -0.75 * that.options.graph.channelSpacing * 0.75,
                max: (channels.length - 0.25) * that.options.graph.channelSpacing,
                gridLineWidth: 0,
                minorGridLineWidth: 0,
                labels: {
                    enabled: that.options.showChannelNames,
                    step: 1,
                    useHTML: true,
                    formatter: function() {
                        if (
                            this.value < 0
                            || this.value > channels.length * that.options.graph.channelSpacing
                            || this.value % that.options.graph.channelSpacing !== 0
                        ) {
                            return null;
                        };
                        var index = that._getChannelIndexFromY(this.value);
                        that.vars.allChannels = channels;
                        var channel = channels[index];
                       
                        that.vars.popUpActive = 1;
                        
                        var html = '<div class="popup"><span class="channel-label" id="channel-' + index + '" data-index="' + index + '">' + channel.name + ' <span class="popuptext" id="myPopup-'+index + '">'+ channel.name + ": " +'<button class="popupbutton" id="increase-'+index+'">Increase Amplitude</button> <button class="popupbutton" id="decrease-'+index+'">Decrease Amplitude</button> <button class="popupbutton" id="default-'+index+'">Default</button></span></span></div>' 
                       
                        return html;
                    },
                    
                },
                title: {
                    text: null
                }
            },
            legend: {
                enabled: false
            },
            series: that._initSeries(data),
            annotationsOptions: {
                enabledButtons: false,
            },
            
        });
       
        if (that.options.features.examplesModeEnabled) {
            that._displayAnnotations(that._turnExamplesIntoAnnotations(that.options.features.examples));
        }
        that._setupYAxisLinesAndLabels();
        //that.setupSleepStagePanel();
        
    },

    
    _changeAmplitude: function(index, channels){
    var that = this;
   
    var check;
    //var channel = channels[index];
    var cid = "channel-" + index;
    //console.log(channel.name)
    //console.log(cid);
   
    //var toggler = $("#channel-"+(index)).on('click', (evt) => {
        
        //console.log("button clicked");
        //console.log($('.popup').id);
   // $(this).hide();
     //addClass('<button>click me</button>');
    // console.log("inside");
     //console.log(channel.name);
    //console.log(index);
    var checker = that.vars.oldIndex;
    if(checker > -1){
     // console.log(checker);
        $("#increase-"+(checker)).css("visibility", "hidden");
        $("#decrease-"+(checker)).css("visibility", "hidden");
        $("#default-"+(checker)).css("visibility", "hidden");
     
        $("#myPopup-"+(checker)).css("visibility", "hidden");
        that.vars.oldIndex = -1;
        //that._reloadCurrentWindow();
        //console.log("here");
    }
   var channel = channels[index];
   //console.log(channel);
    check = that.vars.popUpActive;
    
   // console.log(that.vars.popUpActive)
    if(check == 1 ){
        //console.log("here as well");
        $("#myPopup-"+(index)).css("visibility", "visible");
        
        $("#increase-"+(index)).css("visibility", "visible");
        $("#decrease-"+(index)).css("visibility", "visible");
        $("#default-"+(index)).css("visibility", "visible");
       
      //  console.log("inside it")
     }
     that.vars.popUpActive = 2;
     that.vars.oldIndex =index;
     var increaser = $("#increase-"+(index)).on('click', (evt) => {
       //  console.log()
       
        name = channel.name;
       // console.log(name);
        //var scaleFault = sessionStorage.getItem(name+"scaleFactorAmplitude");
        //scaleFault = scaleFault*5;
       // sessionStorage.setItem((name+"scaleFactorAmplitude"), scaleFault);

        that.vars.valueOptions = 1;
        that.vars.increaseOnce = 1;
        that.vars.requiredName = name;
        that.vars.reprint = 1;
       // console.log("inbutton");
        that._reloadCurrentWindow();
        //location.reload();
       // scaleFactorAmplitude = scaleFactorAmplitude*scaleFault;
       

//console.log(increase);
  });
  
  var decreaser = $("#decrease-"+(index)).on('click', (evt) => {
    //  console.log()
     name = channel.name;
    // console.log(name);
     //var scaleFault = sessionStorage.getItem(name+"scaleFactorAmplitude");
     //scaleFault = scaleFault*5;
    // sessionStorage.setItem((name+"scaleFactorAmplitude"), scaleFault);
     
    that.vars.valueOptions = -1;
    that.vars.requiredName = name;
    that.vars.increaseOnce = 1;
    that.vars.reprint = 1;
    that._reloadCurrentWindow();
   
    // scaleFactorAmplitude = scaleFactorAmplitude*scaleFault;
    

//console.log(increase);
});
var defaulter = $("#default-"+(index)).on('click', (evt) => {
    //  console.log()
    name = channel.name;
    // console.log(name);
     //var scaleFault = sessionStorage.getItem(name+"scaleFactorAmplitude");
     //scaleFault = scaleFault*5;
    // sessionStorage.setItem((name+"scaleFactorAmplitude"), scaleFault);
    
    that.vars.valueOptions = 0;
    that.vars.requiredName = name;
    that.vars.reprint = 1;
    that._reloadCurrentWindow();
   
    // scaleFactorAmplitude = scaleFactorAmplitude*scaleFault;
    

//console.log(increase);
});

     //$(".popupbutton").css("visibility", "visible");

    //document.getElementById("myPopup-"+index).classList.toggle("show");
    //console.log(index);
     //addClass('<button>click me</button>');
  //  })
    //console.log(toggler);
   /* toggler.addEvent(function(){
        var popup = document.getElementById("myPopup");
        popup.classList.toggle("show");
        console.log("printed");

    });
    */
    },

    _formatXAxisLabel: function() {
        // Format x-axis at HH:MM:SS
        var s = this.value;
        var h = Math.floor(s / 3600);
        s -= h * 3600;
        var m = Math.floor(s / 60);
        s -= m * 60;
        return h + ":" + (m < 10 ? '0' + m : m) + ":" + (s < 10 ? '0' + s : s); //zero padding on minutes and seconds
    },

    _myfunction: function() {
        var popup = document.getElementById("myPopup");
        popup.classList.toggle("show");
    },
    
    _blockGraphInteraction: function() {
        var that = this;
        var container = $(that.element);
       // console.log(container);
        var graph = $('#' + that.vars.graphID);
        var blocker = $('<div>')
            .addClass('blocker')
            .css({
                position: 'absolute',
                left: 0,
                width: '100%',
                top: graph.offset().top,
                height: graph.height(),
                backgroundColor: 'rgba(0, 0, 0, 0)',
            })
            .appendTo(container);
    },

    _unblockGraphInteraction: function() {
        var that = this;
        $(that.element).find('> .blocker').remove();
    },

    _setupAnnotationInteraction: function() {

        var that = this;
        that._getDelay();
        that.vars.channelsDealyedNames = that._getChannelsDisplayed();

        if(that.vars.delayAmount.length == 0){
            that.vars.channelsDealyedNames.forEach(channel => {
                that.vars.delayAmount.push(0);
            })

        }
        if( !that.vars.setupOn){
            that.vars.setupOn = true;
        }
        else{
            if (that.options.isReadOnly) return;
            if (!that.options.features.order || !that.options.features.order.length) return;
            var chart = that.vars.chart;
            var container = chart.container;

            function drag(e) {
                var annotation,
                    clickX = e.pageX - container.offsetLeft,
                    clickY = e.pageY - container.offsetTop;
                if (!chart.isInsidePlot(clickX - chart.plotLeft, clickY - chart.plotTop)) {
                    return;
                }
                Highcharts.addEvent(document, 'mousemove', step);
                Highcharts.addEvent(document, 'mouseup', drop);
                var annotationId = undefined;
                var clickXValue = that._convertPixelsToValue(clickX, 'x');
                var clickYValue = that._convertPixelsToValue(clickY, 'y');
                var channelIndexStart = that._getChannelIndexFromY(clickYValue);
                var channelIndices = [ channelIndexStart ];
                var featureType = that.vars.activeFeatureType;
                annotation = that._addAnnotationBox(annotationId, clickXValue, channelIndices, featureType);

                function getAnnotationChannelIndices(e) {
                    var y = e.clientY - container.offsetTop,
                        dragYValue = that._convertPixelsToValue(y, 'y'),
                        channelIndices = that._getChannelsAnnotated(clickYValue, dragYValue);
                    return channelIndices;
                }

                function getAnnotationAttributes(e) {
                    var x = e.clientX - container.offsetLeft,
                        dx = x - clickX,
                        width = that._convertPixelsToValueLength(parseInt(dx, 10) + 1, 'x'),
                        channelIndices = getAnnotationChannelIndices(e),
                        { height, yValue } = that._getAnnotationBoxHeightAndYValueForChannelIndices(channelIndices);
                    if (dx >= 0) {
                        var xValue = that._convertPixelsToValue(clickX, 'x');
                    }
                    else {
                        var xValue = that._convertPixelsToValue(x, 'x');
                    }
                    return {
                        xValue: xValue,
                        yValue: yValue,
                        shape: {
                            params: {
                                width: width,
                                height: height,
                            }
                        }
                    };
                }

                function step(e) {
                    annotation.update(getAnnotationAttributes(e));
                    annotation.metadata.channelIndices = getAnnotationChannelIndices(e);
                }

                function drop(e) {
                    Highcharts.removeEvent(document, 'mousemove', step);
                    Highcharts.removeEvent(document, 'mouseup', drop);
                    var x = e.clientX - container.offsetLeft;
                    if (x == clickX) {
                        if (annotation && annotation.destroy) {
                            annotation.destroy();
                            $('html').off('mousedown', annotation.outsideClickHandler);
                        }
                        that.vars.chart.selectedAnnotation = null;
                        return;
                    }
                    if (annotation) {
                        annotation.update(getAnnotationAttributes(e));
                    }
                    annotation.outsideClickHandler = function() {
                        annotation.destroy();
                        $('html').off('mousedown', annotation.outsideClickHandler);
                        that.vars.chart.selectedAnnotation = null;
                    }
                    $('html').on('mousedown', annotation.outsideClickHandler);
                }
            }
            function drag2(e) {
                var annotation,
                    clickX = e.pageX - container.offsetLeft,
                    clickY = e.pageY - container.offsetTop;
                if (!chart.isInsidePlot(clickX - chart.plotLeft, clickY - chart.plotTop)) {
                    return;
                }
                Highcharts.addEvent(document, 'mousemove', step2);
                Highcharts.addEvent(document, 'mouseup', drop2);

                var annotationId = undefined;
                var clickXValue = that._convertPixelsToValue(clickX, 'x');
                var clickYValue = that._convertPixelsToValue(clickY, 'y');
                var channelIndexStart = that._getChannelIndexFromY(clickYValue);
                var channelIndices = [ channelIndexStart ];
                var featureType = that.vars.activeFeatureType;

                annotation = that._addAnnotationBox(annotationId, clickXValue, channelIndices, featureType);

                function getAnnotationChannelIndices2(e) {
                    var y = e.clientY - container.offsetTop,
                        dragYValue = that._convertPixelsToValue(y, 'y'),
                        channelIndices = that._getChannelsAnnotated(clickYValue, dragYValue);
                    return channelIndices;
                }

                function getAnnotationAttributes2(e) {
                    var x = e.clientX - container.offsetLeft,
                        //dx = x - clickX,
                        //width = that._convertPixelsToValueLength(parseInt(dx, 10) + 1, 'x'),
                        channelIndices = getAnnotationChannelIndices2(e),
                        { height, yValue } = that._getAnnotationBoxHeightAndYValueForChannelIndices(channelIndices);
                        channelIndices.forEach(channel => {
                            that._dealyChannel(that._getChannelsDisplayed()[channel], clickXValue);
                            //console.log(that._getChannelsDisplayed()[channel]);
                        });
                        var xValue = that._convertPixelsToValue(clickX, 'x');
                    
                    return {
                        xValue: xValue,
                        yValue: yValue,
                        shape: {
                            params: {
                                width: 0.1,
                                height: height,
                            }
                        }
                    };
                }

                function step2(e) {
                    annotation.update(getAnnotationAttributes2(e));
                    annotation.metadata.channelIndices = getAnnotationChannelIndices2(e);
                }

            
            
                function drop2(e) {
                    //console.log("drop2");
                    Highcharts.removeEvent(document, 'mousemove', step2);
                    Highcharts.removeEvent(document, 'mouseup', drop2);
            
                    var x = e.clientX - container.offsetLeft;
                    that.vars.delayExists = true;

                    var newList = [];
                    var delayList = [];
                    that._getChannelsDisplayed().forEach( channel =>
                        {
                            
                            if(that.vars.channelsDealyedNames.includes(channel)){
                                delayList.push(that.vars.delayAmount[that.vars.channelsDealyedNames.indexOf(channel)]);
                            
                            }
                            else{
                                delayList.push(0);
                            }
                        })
                        that.vars.delayAmount = delayList;
                        that.vars.channelsDealyedNames = that._getChannelsDisplayed();
                        that.vars.delayExists = true;

                    that._reloadCurrentWindow();
                    if (x == clickX) {
                        if (annotation && annotation.destroy) {
                            annotation.destroy();
                            $('html').off('mousedown', annotation.outsideClickHandler);
                        }
                        that.vars.chart.selectedAnnotation = null;
                        return;
                    }
                    if (annotation) {
                        annotation.update(getAnnotationAttributes2(e));
                    }
                    annotation.outsideClickHandler = function() {
                        annotation.destroy();
                        $('html').off('mousedown', annotation.outsideClickHandler);
                        that.vars.chart.selectedAnnotation = null;
                    }
                $('html').on('mousedown', annotation.outsideClickHandler);
                }

            }
            function drag3(e) {
                var annotation,
                    clickX = e.pageX - container.offsetLeft,
                    clickY = e.pageY - container.offsetTop;
                if (!chart.isInsidePlot(clickX - chart.plotLeft, clickY - chart.plotTop)) {
                    return;
                }
                Highcharts.addEvent(document, 'mousemove', step3);
                Highcharts.addEvent(document, 'mouseup', drop3);

                var annotationId = undefined;
                var clickXValue = that._convertPixelsToValue(clickX, 'x');
                that.vars.currentAnnotationTime = clickXValue;
                var clickYValue = that._convertPixelsToValue(clickY, 'y');
                //console.log(clickXValue);
                var channelIndexStart = that._getChannelIndexFromY(clickYValue);
                var channelIndices = [ channelIndexStart ];
                var featureType = that.vars.activeFeatureType;

           
                annotation = that._addAnnotationChangePoint(annotationId, clickXValue, channelIndices, featureType);
                
                
                //that._addAnnotationChangePoint(annotationId, clickXValue, channelIndices, "");

                function getAnnotationChannelIndices3(e) {
                    var y = e.clientY - container.offsetTop,
                        dragYValue = that._convertPixelsToValue(y, 'y'),
                        channelIndices = that._getChannelsAnnotated(0, that.vars.currentWindowData.channels.length * that.options.graph.channelSpacing -1 );
                    return channelIndices;
                }

                function getAnnotationAttributes3(e) {
                    var x = e.clientX - container.offsetLeft,
                        //dx = x - clickX,
                        //width = that._convertPixelsToValueLength(parseInt(dx, 10) + 1, 'x'),
                        channelIndices = getAnnotationChannelIndices3(e),
                        { height, yValue } = that._getAnnotationBoxHeightAndYValueForChannelIndices(channelIndices);
                    // console.log(height);
                        var xValue = that._convertPixelsToValue(clickX, 'x');
                    
                    return {
                        xValue: xValue,
                        yValue: yValue,
                        shape: {
                            params: {
                                width: 0.01,
                                height: 8000,
                            }
                        }
                    };
                }

                function step3(e) {
                    annotation.update(getAnnotationAttributes3(e));
                    annotation.metadata.channelIndices = getAnnotationChannelIndices3(e);
                }

            
            
                function drop3(e) {
                // console.log("drop2");
                    Highcharts.removeEvent(document, 'mousemove', step3);
                    Highcharts.removeEvent(document, 'mouseup', drop3);
                    var x = e.clientX - container.offsetLeft;

                    if (x == clickX ) {
                        if (annotation && annotation.destroy) {
                            annotation.destroy();
                            $('html').off('mousedown', annotation.outsideClickHandler);
                            
                        }
                        that.vars.chart.selectedAnnotation = null;
                        
                        return;
                    }
                    if (annotation) {
                        annotation.update(getAnnotationAttributes3(e));
                    }
                    annotation.outsideClickHandler = function() {
                        //console.log("doing this");
                        annotation.destroy();
                        $('html').off('mousedown', annotation.outsideClickHandler);
                        
                        that.vars.chart.selectedAnnotation = null;
                    }
                //  $('html').on('mousedown', annotation.outsideClickHandler);

                    
                }

            }
            function drag4(e) {
                var annotation,
                    clickX = e.pageX - container.offsetLeft,
                    clickY = e.pageY - container.offsetTop;
                if (!chart.isInsidePlot(clickX - chart.plotLeft, clickY - chart.plotTop)) {
                    return;
                }
                Highcharts.addEvent(document, 'mousemove', step4);
                Highcharts.addEvent(document, 'mouseup', drop4);

                var annotationId = undefined;
                var clickXValue = that._convertPixelsToValue(clickX, 'x');
                that.vars.currentAnnotationTime = clickXValue;
                var clickYValue = that._convertPixelsToValue(clickY, 'y');
                //console.log(clickXValue);
                var channelIndexStart = that._getChannelIndexFromY(clickYValue);
                var channelIndices = [ channelIndexStart ];
                var featureType = that.vars.activeFeatureType;

                annotation = that._addAnnotationChangePoint(annotationId, clickXValue, channelIndices, featureType);
        
                //that._addAnnotationChangePoint(annotationId, clickXValue, channelIndices, "");

                function getAnnotationChannelIndices4(e) {
                    var y = e.clientY - container.offsetTop,
                        dragYValue = that._convertPixelsToValue(y, 'y'),
                        channelIndices = that._getChannelsAnnotated(0, that.vars.currentWindowData.channels.length * that.options.graph.channelSpacing -1 );
                        //console.log(channelIndices);
                    return channelIndices;
                }

                function getAnnotationAttributes4(e) {
                    var x = e.clientX - container.offsetLeft,
                        //dx = x - clickX,
                        //width = that._convertPixelsToValueLength(parseInt(dx, 10) + 1, 'x'),
                        channelIndices = getAnnotationChannelIndices4(e),
                        { height, yValue } = that._getAnnotationBoxHeightAndYValueForChannelIndices(channelIndices);
                        channelIndices.forEach(channel => {
                            that._dealyChannel(that._getChannelsDisplayed()[channel], clickXValue);
                            //console.log(that._getChannelsDisplayed()[channel]);
                        })
                        var xValue = that._convertPixelsToValue(clickX, 'x');
                    
                    return {
                        xValue: xValue,
                        yValue: yValue,
                        shape: {
                            params: {
                                width: 0.1,
                                height: 8000,
                            }
                        }
                    };
                }

                function step4(e) {
                    annotation.update(getAnnotationAttributes4(e));
                    annotation.metadata.channelIndices = getAnnotationChannelIndices4(e);
                }

            
            
                function drop4(e) {
                //   console.log("drop2");
                    Highcharts.removeEvent(document, 'mousemove', step4);
                    Highcharts.removeEvent(document, 'mouseup', drop4);
                    that.vars.delayExists = true;
                    
                    //console.log(that.vars.delayAmount);
                    var x = e.clientX - container.offsetLeft;
                    //console.log(that.vars.channelsDealyedNames);
                    that._reloadCurrentWindow();
                    if (x == clickX ) {
                        if (annotation && annotation.destroy) {
                            annotation.destroy();
                            $('html').off('mousedown', annotation.outsideClickHandler);
                            
                        }
                        that.vars.chart.selectedAnnotation = null;
                        
                        return;
                    }
                    if (annotation) {
                        annotation.update(getAnnotationAttributes4(e));
                    }
                    annotation.outsideClickHandler = function() {
                        //console.log("doing this");
                        annotation.destroy();
                        $('html').off('mousedown', annotation.outsideClickHandler);
                        
                        that.vars.chart.selectedAnnotation = null;
                    }
                //  $('html').on('mousedown', annotation.outsideClickHandler);

                    
                }

            }
           
            
            if( that.options.features.annotationType == "box" ){
            // Highcharts.removeEvent(container, 'mousedown', drag2);
                //Highcharts.removeEvent(container, 'mousedown', drag3);
                //Highcharts.removeEvent(container, 'mousedown', drag4);
                Highcharts.removeEvent(container, 'mousedown');
                Highcharts.addEvent(container, 'mousedown', drag);
            }
            else if (that.options.features.annotationType == "" )
            {
                Highcharts.removeEvent(container, 'mousedown', drag);
                Highcharts.removeEvent(container, 'mousedown', drag3);
                Highcharts.removeEvent(container, 'mousedown', drag4);
                Highcharts.removeEvent(container, 'mousedown', drag2);
            }
            else if (that.options.features.annotationType == "cpoint" )
            {
          //      console.log("here");
                
                Highcharts.removeEvent(container, 'mousedown');
                Highcharts.addEvent(container, 'mousedown', drag3);
            }
            else if (that.options.features.annotationType == "tadjust" )
            {
               // console.log("here as well");
                //Highcharts.removeEvent(container, 'mousedown', drag2);
            // Highcharts.removeEvent(container, 'mousedown', drag3);
            // Highcharts.removeEvent(container, 'mousedown', drag);
            Highcharts.removeEvent(container, 'mousedown');
                Highcharts.addEvent(container, 'mousedown', drag2);
            }
            //Highcharts.addEvent(container, 'mousedown', drag);
       
        
        
    }

    },

    _getAnnotationBoxHeightAndYValueForChannelIndices: function(channelIndices) {
        var that = this;

        if (!Array.isArray(channelIndices)) {
            channelIndices = [channelIndices];
        }
        var channelIndexMin = Math.min(...channelIndices);
        var channelIndexMax = Math.max(...channelIndices);
        var height = (Math.abs(channelIndexMax - channelIndexMin) + 1) * that.options.graph.channelSpacing;
        var yValue = that._getBorderTopForChannelIndex(channelIndexMin);
        return {
            height,
            yValue,
        };
    },

    //removes all box annotations from screen (they still exist in the backend)
    _removeAnnotationBox: function(){
        var that = this;
        if(that.vars.chart){
            const annotations = that.vars.chart.annotations.allItems
           // console.log(annotations);
            for (let i = annotations.length - 1; i > -1; --i) {
                annotations[i].destroy()
            }
    }
    },


    _addAnnotationChangePoint: function(annotationId, timeStart, channelIndices, featureType, timeEnd, confidence, comment, annotationData) {
     /*var that = this;
        var annotations = that.vars.chart.annotations.allItems;
        if (!Array.isArray(channelIndices)) {
            channelIndices = [channelIndices];
        }
        if (annotations.some(a => 
                a.metadata.id == annotationId
                && (
                    a.metadata.channelIndices == channelIndices
                    || channelIndices.length == 1 && a.metadata.channelIndices.indexOf(channelIndices[0]) > -1
                )
            )
        ) {
            return;
        }
        var annotationData = annotationData !== undefined ? annotationData : {};
        var { height, yValue } = that._getAnnotationBoxHeightAndYValueForChannelIndices(channelIndices);
        var shapeParams = {
            height: height,
        }
        shapeParams.width = 10;
        shapeParams.fill = 'blue';
        //shapeParams.stroke = that._getFeatureColor(featureType, annotationData.is_answer);
        shapeParams.strokeWidth = 0;
        that.vars.chart.addAnnotation({
            xValue: timeStart,
            yValue: yValue,
           // allowDragX: preliminary,
            allowDragY: false,
            anchorX: 'left',
            anchorY: 'top',
            shape: {
                type: 'rect',
                units: 'values',
                params: shapeParams,
            },
            events: {
                mouseup: function(event) {
                    $(this.group.element).find('rect[shape-rendering="crispEdges"]').last().remove();
                },
                dblclick: function(event) {
                    if (that.options.isReadOnly) return;
                    if (annotationData.is_answer) return;
                    event.preventDefault();
                    var xMinFixed = that._getAnnotationXMinFixed(this);
                    var xMaxFixed = that._getAnnotationXMaxFixed(this);
                    var annotationId = annotation.metadata.id;
                    var channelIndices = annotation.metadata.channelIndices;
                    var channelsDisplayed = that._getChannelsDisplayed();
                    if (annotation.metadata.originalData) {
                        channelIndices = annotation.metadata.originalData.channels;
                        channelsDisplayed = annotation.metadata.originalData.channels_displayed;
                    }
                    that._deleteAnnotation(annotationId, that.vars.currentWindowRecording, xMinFixed, xMaxFixed, channelIndices, channelsDisplayed);
                    annotations.slice().reverse().filter(a => a.metadata.id == annotationId).forEach(a => {
                        a.destroy();
                        that.vars.chart.selectedAnnotation = null;
                    });
                }
            }
        });
        var annotation = annotations[annotations.length - 1];
       // var classString = $(annotation.group.element).attr('class');
       // classString += ' saved';
        //$(annotation.group.element).attr('class', classString);
        //$(annotation.group.element).on('mousedown', function(event) {
       //     event.stopPropagation();
      //  });
        annotation.metadata = {
            id: annotationId,
            //featureType: featureType,
            channelIndices: channelIndices,
            comment: ''
        }
        //if (!preliminary) {
           // annotation.metadata.confidence = confidence;
            annotation.metadata.comment = "Comment";
            annotation.metadata.originalData = annotationData;
       // }
       /*
        if (!that.options.isReadOnly && !annotationData.is_answer) {
            that._addConfidenceLevelButtonsToAnnotationBox(annotation);
            if (!preliminary) {
                that._addCommentFormToAnnotationBox(annotation);
            }
        }
        //
       console.log(annotation.metadata);
        return annotation;

*/

//console.log("anotater");
var that = this;
var annotations = that.vars.chart.annotations.allItems;

console.log(annotations);
if (!Array.isArray(channelIndices)) {
    channelIndices = [channelIndices];
}
if (annotations.some(a => 
        a.metadata.id == annotationId
        && (
            a.metadata.channelIndices == channelIndices
            || channelIndices.length == 1 && a.metadata.channelIndices.indexOf(channelIndices[0]) > -1
        )
    )
) {
    return;
}
console.log("returncrossedhere");
var timeEnd = timeEnd !== undefined ? timeEnd : false;
var annotationData = annotationData !== undefined ? annotationData : {};
var preliminary = timeEnd === false;
var { height, yValue } = that._getAnnotationBoxHeightAndYValueForChannelIndices(channelIndices);
var shapeParams = {
    height: height,
}
if (preliminary) {
    //console.log("BOM");
    shapeParams.width = 0;
    shapeParams.fill = 'blue';
    shapeParams.stroke = 'blue';//that._getFeatureColor(featureType, annotationData.is_answer);
    shapeParams.strokeWidth = 100;
}
else {
    shapeParams.width = 200;
    shapeParams.fill = 'blue';
  // shapeParams.fill = that._getFeatureColor(featureType, annotationData.is_answer, confidence);
    shapeParams.stroke = 'blue';
    shapeParams.strokeWidth = 0;
}
that.vars.chart.addAnnotation({
    
    xValue: timeStart,
    yValue: yValue,
    allowDragX: preliminary,
    allowDragY: false,
    anchorX: 'left',
    anchorY: 'top',
    title: that.vars.currType,
    shape: {
        type: 'rect',
        units: 'values',
        parms: shapeParams,
    },
        labelOptions: {
            shape: 'connector',
            align: 'right',
            justify: false,
            crop: true,
            style: {
                fontSize: '0.8em',
                textOutline: '1px white'
            },
        params: shapeParams,
        label: {
            text: "label",
            width: 22,
            xAxis: 0,
            yAxis: 0,
            x: timeStart,
            y: yValue,
        },
    },
    
    events: {
        mouseup: function(event) {
            $(this.group.element).find('rect[shape-rendering="crispEdges"]').last().remove();
        },
        dblclick: function(event) {
            if (that.options.isReadOnly) return;
            if (annotationData.is_answer) return;
            event.preventDefault();
            var xMinFixed = that._getAnnotationXMinFixed(this);
            var xMaxFixed = that._getAnnotationXMaxFixed(this);
            var annotationId = annotation.metadata.id;
            var channelIndices = annotation.metadata.channelIndices;
            var channelsDisplayed = that._getChannelsDisplayed();
            if (annotation.metadata.originalData) {
                channelIndices = annotation.metadata.originalData.channels;
                channelsDisplayed = annotation.metadata.originalData.channels_displayed;
            }
            that._deleteAnnotation(annotationId, that.vars.currentWindowRecording, xMinFixed, xMaxFixed, channelIndices, channelsDisplayed);
            annotations.slice().reverse().filter(a => a.metadata.id == annotationId).forEach(a => {
                a.destroy();
                that.vars.chart.selectedAnnotation = null;
            });
        }
    }
});
var annotation = annotations[annotations.length - 1];
if (!preliminary) {
   // console.log("inside this");
    var classString = $(annotation.group.element).attr('class');
    classString += ' saved';
    $(annotation.group.element).attr('class', classString);
}
$(annotation.group.element).on('mousedown', function(event) {
    event.stopPropagation();
});
//console.log(featureType);
annotation.metadata = {
    id: annotationId,
    featureType: featureType,
    channelIndices: channelIndices,
    comment: ''
}

//console.log(annotation);
if (!preliminary) {
    //annotation.metadata.confidence = confidence;
    annotation.metadata.comment = comment;
    annotation.metadata.originalData = annotationData;
}

if (!that.options.isReadOnly && !annotationData.is_answer) {
   // that._addConfidenceLevelButtonsToAnnotationBox(annotation);
  
    if (!preliminary) {
        that._addCommentFormToAnnotationBox(annotation);
    }
  that._saveFeatureAnnotation(annotation);
  
    $('html').off('mousedown', annotation.outsideClickHandler);
    var classString =  $(annotation.group.element).attr('class');
    classString += ' saved';
   $(annotation.group.element).attr('class', classString);

}

//console.log("postTimeOut")
//console.log(annotation);
return annotation;
    },
_addAnnotationBox: function(annotationId, timeStart, channelIndices, featureType, timeEnd, confidence, comment, annotationData) {
        var that = this;
       // console.log("anotater");
        var annotations = that.vars.chart.annotations.allItems;
        //console.log(annotations);
        if (!Array.isArray(channelIndices)) {
            channelIndices = [channelIndices];
        }
        if (annotations.some(a => 
                a.metadata.id == annotationId
                && (
                    a.metadata.channelIndices == channelIndices
                    || channelIndices.length == 1 && a.metadata.channelIndices.indexOf(channelIndices[0]) > -1
                )
            )
        ) {
            return;
        }
        var timeEnd = timeEnd !== undefined ? timeEnd : false;
        var annotationData = annotationData !== undefined ? annotationData : {};
        var preliminary = timeEnd === false;
        var { height, yValue } = that._getAnnotationBoxHeightAndYValueForChannelIndices(channelIndices);
        var shapeParams = {
            height: height,
        }
        if (preliminary) {
            shapeParams.width = 0;
            shapeParams.fill = 'transparent';
            shapeParams.stroke = that._getFeatureColor(featureType, annotationData.is_answer);
            shapeParams.strokeWidth = 10;
        }
        else {
            shapeParams.width = timeEnd - timeStart;
            shapeParams.fill = that._getFeatureColor(featureType, annotationData.is_answer, confidence);
            shapeParams.stroke = 'transparent';
            shapeParams.strokeWidth = 0;
            
        }
        
        that.vars.chart.addAnnotation({
            xValue: timeStart,
            yValue: yValue,
            allowDragX: preliminary,
            allowDragY: false,
            anchorX: 'left',
            anchorY: 'top',
          
            shape: {
                type: 'rect',
                units: 'values',
                params: shapeParams,
            },
            events: {
                mouseup: function(event) {
                    $(this.group.element).find('rect[shape-rendering="crispEdges"]').last().remove();
                },
                dblclick: function(event) {
                    if (that.options.isReadOnly) return;
                    if (annotationData.is_answer) return;
                    event.preventDefault();
                    var xMinFixed = that._getAnnotationXMinFixed(this);
                    var xMaxFixed = that._getAnnotationXMaxFixed(this);
                    var annotationId = annotation.metadata.id;
                    var channelIndices = annotation.metadata.channelIndices;
                    var channelsDisplayed = that._getChannelsDisplayed();
                    if (annotation.metadata.originalData) {
                        channelIndices = annotation.metadata.originalData.channels;
                        channelsDisplayed = annotation.metadata.originalData.channels_displayed;
                    }
                    that._deleteAnnotation(annotationId, that.vars.currentWindowRecording, xMinFixed, xMaxFixed, channelIndices, channelsDisplayed);
                    annotations.slice().reverse().filter(a => a.metadata.id == annotationId).forEach(a => {
                        a.destroy();
                        that.vars.chart.selectedAnnotation = null;
                    });
                }
            }
        });
        
       
        
        var annotation = annotations[annotations.length - 1];
        if (!preliminary) {
            var classString = $(annotation.group.element).attr('class');
            classString += ' saved';
            $(annotation.group.element).attr('class', classString);
        }
        $(annotation.group.element).on('mousedown', function(event) {
            event.stopPropagation();
        });
        annotation.metadata = {
            id: annotationId,
            featureType: featureType,
            channelIndices: channelIndices,
            comment: ''
        }
       
        if (!preliminary) {
            annotation.metadata.confidence = confidence;
            annotation.metadata.comment = comment;
            annotation.metadata.originalData = annotationData;
        }
        if (!that.options.isReadOnly && !annotationData.is_answer) {
            //that._addConfidenceLevelButtonsToAnnotationBox(annotation);
            that._addFeatureTypeButtonsToAnnotationBox(annotation, channelIndices);
            if (!preliminary) {
                that._addCommentFormToAnnotationBox(annotation);
            }
        }
        return annotation;
    },

    _addConfidenceLevelButtonsToAnnotationBox: function(annotation) {
        var that = this;
        var annotations = that.vars.chart.annotations.allItems;
        var annotationElement = $(annotation.group.element);
        // To learn more about the foreignObject tag, see:
        // https://developer.mozilla.org/en/docs/Web/SVG/Element/foreignObject
        var htmlContext = $(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
        htmlContext
            .attr({
                width: 70,
                height: 25,
                x: 0,
                y: 30,
                zIndex: 2,
            })
            .mousedown(function(event) {
                event.stopPropagation();
            })
            .click(function(event) {
                event.stopPropagation();
            })
            .dblclick(function(event) {
                event.stopPropagation();
            });
        var body = $(document.createElement('body'))
            .addClass('toolbar confidence-buttons')
            .attr('xmlns', 'http://www.w3.org/1999/xhtml');
        var buttonGroup = $('<form>')
        var buttonDefinitions = [{
            confidence: 0,
            class: 'red',
        }, {
            confidence: 0.5,
            class: 'yellow',
        }, {
            confidence: 1,
            class: 'light-green',
        }]
        buttonDefinitions.forEach((buttonDefinition) => {
            var button = $('<div>')
                .addClass('btn')
                .addClass(buttonDefinition.class)
                .addClass(buttonDefinition.confidence == annotation.metadata.confidence ? 'active' : '')
                .data('confidence', buttonDefinition.confidence)
                .click(function(event) {
                    var confidence = $(this).data('confidence');
                    var newColor = that._getFeatureColor(annotation.metadata.featureType, false, confidence);
                    annotations.filter(a => a.metadata.id == annotation.metadata.id).forEach(a => {
                        a.metadata.confidence = confidence;
                        $(a.group.element).find('.toolbar.confidence-buttons .btn').each(function() {
                            if ($(this).data('confidence') === confidence) {
                                $(this).addClass('active').siblings().removeClass('active');
                            }
                        });
                        a.update({
                            allowDragX: false,
                            shape: {
                                params: {
                                    strokeWidth: 0,
                                    stroke: 'transparent',
                                    fill: newColor,
                                }
                            }
                        });
                    });
                    that._saveFeatureAnnotation(annotation);
                    $('html').off('mousedown', annotation.outsideClickHandler);
                    var classString =  $(annotation.group.element).attr('class');
                    classString += ' saved';
                    $(annotation.group.element).attr('class', classString);
                })
            buttonGroup.append(button);
        });
        body.append(buttonGroup);
        htmlContext.append(body);
        annotationElement.append(htmlContext);
    },

    _addFeatureTypeButtonsToAnnotationBox: function(annotation, channelIndices) {
        console.log(channelIndices)
        var that = this;
        var annotations = that.vars.chart.annotations.allItems;
        var annotationElement = $(annotation.group.element);
        //set default to empty feature
        that.vars.activeFeatureType = that.options.features.order[14]
        // To learn more about the foreignObject tag, see: 
        // https://developer.mozilla.org/en/docs/Web/SVG/Element/foreignObject
        var htmlContext = $(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
        htmlContext
            .addClass('type')
            .attr({
                // width and hieght set in css
                width: 350,
                //width: auto,
                height: 30,
                x: 0,
                y: 0,
                zIndex: 2,
            })
            .mousedown(function(event) {
                event.stopPropagation();
            })
            .click(function(event) {
                event.stopPropagation();
            })
            .dblclick(function(event) {
                event.stopPropagation();
            });
        var body = $(document.createElement('body'))
            .addClass('toolbar feature-type-buttons')
            .attr('xmlns', 'http://www.w3.org/1999/xhtml');
        var buttonGroup = $('<form>')
        features = that.options.features.options

        console.log(annotation)

        //this will clone the features object.
        var tempFeatures;
        tempFeatures = JSON.parse(JSON.stringify(features))

        //removes all features from tempFeatures except the valid ones.
        for (feat in tempFeatures){
            if(!tempFeatures[feat].validChannels[that.vars.currentMontage].includes(channelIndices[0])){
                delete tempFeatures[feat]
            }
        }

        for(var featureName of Object.keys(tempFeatures)){

            feature = tempFeatures[featureName]

            var button = $('<div>')
                .addClass('btn')
                .addClass(feature.class)
                .data('featureName', featureName)
                .html(featureName)
                .click(function(event) {
                    var confButtons = $(that.element).find('.confidence-buttons .btn');

                    //make the confidencse button visible. There are hideen with css in style.css
                    for (var i = 0; i < confButtons.length; i ++) {
                        confButtons[i].style.visibility = 'visible';
                    }

                    $(this).addClass('active');
                    $(this).siblings().removeClass('active');

                    that.vars.activeFeatureType = $(this).data('featureName')
                    console.log($(this).data('featureName'))
                    
                    annotations.filter(a => a.metadata.id == annotation.metadata.id).forEach(a => {
                        a.metadata.featureType =  $(this).data('featureName')
                    });
                    that._addConfidenceLevelButtonsToAnnotationBox(annotation);
                    $('html').off('mousedown', annotation.outsideClickHandler);

                })
            buttonGroup.append(button);
        }
        body.append(buttonGroup);
        htmlContext.append(body);
        annotationElement.append(htmlContext);
    },

    _addStageButtonsToAnnotationBox: function(annotation) {
        var that = this;
        var annotations = that.vars.chart.annotations.allItems;
        var annotationElement = $(annotation.group.element);
        // To learn more about the foreignObject tag, see:
        // https://developer.mozilla.org/en/docs/Web/SVG/Element/foreignObject
        var htmlContext = $(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
        htmlContext
            .attr({
                width: 70,
                height: 25,
                x: 0,
                y: 0,
                zIndex: 2,
            })
            .mousedown(function(event) {
                event.stopPropagation();
            })
            .click(function(event) {
                event.stopPropagation();
            })
            .dblclick(function(event) {
                event.stopPropagation();
            });
        var body = $(document.createElement('body'))
            .addClass('toolbar confidence-buttons')
            .attr('xmlns', 'http://www.w3.org/1999/xhtml');
        var buttonGroup = $('<form>')
        var buttonDefinitions = [{
            confidence: 0,
            class: 'red',
        }, {
            confidence: 0.5,
            class: 'yellow',
        }, {
            confidence: 1,
            class: 'light-green',
        }]
        buttonDefinitions.forEach((buttonDefinition) => {
            var button = $('<div>')
                .addClass('btn')
                .addClass(buttonDefinition.class)
                .addClass(buttonDefinition.confidence == annotation.metadata.confidence ? 'active' : '')
                .data('confidence', buttonDefinition.confidence)
                .click(function(event) {
                    var confidence = $(this).data('confidence');
                    var newColor = that._getFeatureColor(annotation.metadata.featureType, false, confidence);
                    annotations.filter(a => a.metadata.id == annotation.metadata.id).forEach(a => {
                        a.metadata.confidence = confidence;
                        $(a.group.element).find('.toolbar.confidence-buttons .btn').each(function() {
                            if ($(this).data('confidence') === confidence) {
                                $(this).addClass('active').siblings().removeClass('active');
                            }
                        });
                        a.update({
                            allowDragX: false,
                            shape: {
                                params: {
                                    strokeWidth: 0,
                                    stroke: 'transparent',
                                    fill: newColor,
                                }
                            }
                        });
                    });
                    that._saveFeatureAnnotation(annotation);
                    $('html').off('mousedown', annotation.outsideClickHandler);
                    var classString =  $(annotation.group.element).attr('class');
                    classString += ' saved';
                    $(annotation.group.element).attr('class', classString);
                    that._addCommentFormToAnnotationBox(annotation);
                })
            buttonGroup.append(button);
        });
        body.append(buttonGroup);
        htmlContext.append(body);
        annotationElement.append(htmlContext);
    },
    _addCommentFormToAnnotationBox: function(annotation) {
        if (annotation.metadata.commentFormAdded) {
            return;
        }
        var that = this;
        var annotations = that.vars.chart.annotations.allItems;
        var annotationElement = $(annotation.group.element);
        // To learn more about the foreignObject tag, see:
        // https://developer.mozilla.org/en/docs/Web/SVG/Element/foreignObject
        var htmlContext = $(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
        htmlContext
            .attr({
                width: 250,
                height: 25,
                x: 0,
                y: 20,
                zIndex: 2,
            })
            .mousedown(function(event) {
                event.stopPropagation();
            })
            .click(function(event) {
                event.stopPropagation();
            })
            .dblclick(function(event) {
                event.stopPropagation();
            });
        var body = $('<body>')
            .addClass('toolbar comment')
            .attr('xmlns', 'http://www.w3.org/1999/xhtml');
        var form = $('<form>');
        var toggleButton = $('<button type="submit" class="btn btn-primary fa fa-comment"></button>');
        form.append(toggleButton);
        var comment = annotation.metadata.comment;
        var input = $('<input type="text" placeholder="Your comment..." value="' + comment + '">')
            .hide()
            .keydown(function(event) {
                event.stopPropagation();
            });
        form.submit(function(event) {
            event.preventDefault();
            var collapsed = toggleButton.hasClass('fa-comment');
            if (collapsed) {
                toggleButton
                    .removeClass('fa-comment')
                    .addClass('fa-floppy-o')
                input.show().focus();
            }
            else {
                toggleButton
                    .removeClass('fa-floppy-o')
                    .addClass('fa-comment')
                input.hide();
                var comment = input.val();
                toggleButton.focus();
                annotations.filter(a => a.metadata.id == annotation.metadata.id).forEach(a => {
                    a.metadata.comment = comment;
                    $(a.group.element).find('.toolbar.comment input').val(comment);
                });
                that._saveFeatureAnnotation(annotation);
            }
        });
        form.append(input);
        body.append(form);
        htmlContext.append(body);
        annotationElement.append(htmlContext);
        annotation.metadata.commentFormAdded = true;
    },

    _saveFeatureAnnotation: function(annotation) {
        var that = this;
        var annotationId = annotation.metadata.id;
        var type = annotation.metadata.featureType;
        var time_start = that._getAnnotationXMinFixed(annotation);
        var time_end = that._getAnnotationXMaxFixed(annotation);
        var channel = annotation.metadata.channelIndices;
        var confidence = annotation.metadata.confidence;
        var comment = annotation.metadata.comment;
        var rationale = undefined;
        var metadata = {}
        if (that._isHITModeEnabled()) {
            metadata = {
                visibleRegion: that.options.visibleRegion,
                windowSizeInSeconds: that.options.windowSizeInSeconds,
                isTrainingWindow: that._isCurrentWindowTrainingWindow(),
            }
            if (that.options.projectUUID) {
                metadata.projectUUID = that.options.projectUUID;
            }
        }
       

        that._saveAnnotation(annotationId, that.vars.currentWindowRecording, type, time_start, time_end, channel, confidence, comment, metadata, rationale, function(savedAnnotation, error) {
            if (savedAnnotation) {
                annotation.metadata.id = savedAnnotation.id;
                annotationFormatted = savedAnnotation.value;
                annotationFormatted.id = savedAnnotation.id;
                annotationFormatted.arbitration = savedAnnotation.arbitration;
                annotationFormatted.arbitrationRoundNumber = savedAnnotation.arbitrationRoundNumber;
                annotationFormatted.rationale = savedAnnotation.rationale;
               // that._displayAnnotations([annotationFormatted]);
            }
        });
    },

    _saveFullWindowLabel: function(annotationCategory, label, rationale) {
        var that = this;
        var label = label;
        var time_start = that.vars.currentAnnotationTime;
        var time_end = time_start + that.options.windowSizeInSeconds;
        var channel = undefined;
        var confidence = 1;
        var comment = '';
        var cacheKey = that._getAnnotationsCacheKey(that.vars.currentWindowRecording, time_start, time_end, false, annotationCategory);
        var annotation = that.vars.annotationsCache[cacheKey] || {};
        
        //console.log(time_start);
        that._saveAnnotation(annotation.id, that.vars.currentWindowRecording, label, time_start, time_end, channel, confidence, comment, {}, rationale, function(savedAnnotation, error) {
            if (savedAnnotation) {
                annotationFormatted = savedAnnotation.value;
                annotationFormatted.id = savedAnnotation.id;
                annotationFormatted.arbitration = savedAnnotation.arbitration;
                annotationFormatted.arbitrationRoundNumber = savedAnnotation.arbitrationRoundNumber;
                annotationFormatted.rationale = savedAnnotation.rationale;
                that.vars.currentAnnotationTime = null;
                that.vars.annotationsCache[cacheKey] = savedAnnotation;
            }
            that._refreshAnnotations();
        });
    },

    _refreshAnnotations: function() {
        var that = this;
        that._getAnnotations(that.vars.currentWindowRecording, that.vars.currentWindowStart, that.vars.currentWindowStart + that.options.windowSizeInSeconds);
    },
    

    _saveArtifactAnnotation: function(type) {
        var that = this;
        that._saveFullWindowLabel('ARTIFACT', type);
    },

    _isDisagreementCase: function() {
        var that = this;
        return $(that.element).find('.votes-info.has-disagreement').length > 0;
    },

    _saveSleepStageAnnotation: function(type) {
        var that = this;
        if (that._isArbitrating()) {
            if (!that._isDisagreementCase() && !confirm("You are trying to re-score a case for which all panel members already agree with you. While you're free to do this, it is not required to re-score agreement cases. We only ask to re-score those cases with any level of disagreement. The red arrow buttons in the bottom right-hand corner of the page let you jump to the next or previous disagreement case. There are also keyboard shortcuts for this: [D] to jump to the next disagreement case; and [A] to jump to the previous disagreement case. In addition, you may also press [SPACE BAR] to toggle a panel showing you how many disagreement cases you have already re-scored and how many are left. Press OK to re-score this agreement case anyways; or press CANCEL to stop here.")) {
                that._refreshAnnotations();
                
            }
            else {
                c
                const fullWindowLabelHumanReadable = that.vars.fullWindowLabelsToHumanReadable[type];
                var title = 'Why ' + fullWindowLabelHumanReadable + '?';
                const rationaleFormData = _.extend(that.options.context, {
                    task: that.options.context.task,
                    decisionField: 'value.label',
                    decision: type,
                    decisionHumanReadable: fullWindowLabelHumanReadable,
                });
                let rationaleFormView;
               // console.log("here is reached");
                swal({
                    title: title,
                    confirmButtonText: 'Submit',
                    showCancelButton: true,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    footer: '<b>Press SHIFT + ENTER to submit.</b>',
                    animation: false,
                    focusConfirm: false,
                    backdrop: 'rgba(0, 0, 0, 0.4)',
                    onBeforeOpen() {
                        rationaleFormView = Blaze.renderWithData(Template.RationaleForm, rationaleFormData, swal.getContent(), swal.getContent().firstChild);
                        $(swal.getContent()).keypress((e) => {
                            if (e.which == 13 && e.shiftKey) {
                                e.stopImmediatePropagation();
                                swal.clickConfirm();
                            }
                        });
                        $(swal.getContent()).find('input').keypress((e) => {
                            if (e.which == 13) {
                                e.stopImmediatePropagation();
                                swal.clickConfirm();
                            }
                        });
                    },
                    preConfirm() {
                        return Template.RationaleForm.__helpers.get('rationale').call(rationaleFormView._domrange.members[0].view.templateInstance(), swal.showValidationMessage);
                    }
                })
                .then((result) => {
                    if (result.dismiss) {
                        that._refreshAnnotations();
                        swal('Scoring decision not saved.', 'Please try again and provide a rationale.', 'warning');
                        return;
                    }
                    const rationale = result.value;
                    that._saveFullWindowLabel('SLEEP_STAGE', type, rationale);
                });
            }
        }
        else {
           // console.log("wtc");
            that._saveFullWindowLabel('SLEEP_STAGE', type);            
        }
    },

    _getAnnotationXMinFixed: function(annotation) {
        return parseFloat(annotation.options.xValue).toFixed(2);
    },

    _getAnnotationXMaxFixed: function(annotation) {
        return parseFloat(annotation.options.xValue + annotation.options.shape.params.width).toFixed(2);
    },

    _getAxis: function(key) {
        var that = this;
        switch (key) {
            case 'x':
            case 'X':
                var axis = that.vars.chart.xAxis[0];
                break;
            default:
                var axis = that.vars.chart.yAxis[0];
                break;
        }
        return axis;
    },

    _convertPixelsToValue: function(pixels, axisKey) {
        var axis = this._getAxis(axisKey);
        return axis.toValue(pixels);
    },

    _convertValueToPixels: function(value, axisKey) {
        var axis = this._getAxis(axisKey);
        return axis.toPixels(value);
    },

    _convertPixelsToValueLength: function(pixels, axisKey) {
        var axis = this._getAxis(axisKey);
        return Math.abs(axis.toValue(pixels) - axis.toValue(0));
    },

    _convertValueToPixelsLength: function(value, axisKey) {
        var axis = this._getAxis(axisKey);
        return Math.abs(axis.toPixels(value) - axis.toPixels(0));
    },

    _getChannelsAnnotated: function(yMin, yMax) {
        var that = this;
        var index1 = that._getChannelIndexFromY(yMin);
        var index2 = that._getChannelIndexFromY(yMax);
        var indexMin = Math.min(index1, index2);
        var indexMax = Math.max(index1, index2);
        var channels = [];
        for (var i = indexMin; i <= indexMax; ++i) {
            channels.push(i);
        }
        return channels;
    },

    _getChannelIndexFromY: function(value) {
        var that = this;
        var numberOfChannels = that.vars.currentWindowData.channels.length;
        var indexFromEnd = Math.floor((value + that.options.graph.channelSpacing / 2) / that.options.graph.channelSpacing);
        var index = numberOfChannels - 1 - indexFromEnd;
        index = Math.min(numberOfChannels - 1, index);
        index = Math.max(index, 0);
        return index;
    },

    _setupLabelHighlighting: function() {
        var that = this;
        $(that.element).find('.channel-label').click(function(event) {
            var index = $(this).data('index');
            
            that._selectChannel(index);
            that._changeAmplitude(index, that.vars.allChannels);
        });
    },

    _selectChannel: function(index) {
        var that = this;
        that.vars.selectedChannelIndex = index;
        $(that.element).find('.channel-label').removeClass('selected');
        $(that.element).find('.gain-button').prop('disabled', false);
        if (index !== undefined) {
            $(that.element).find('.channel-label[data-index="' + index + '"]').addClass('selected');
            
        }
    },

    _unselectChannels: function() {
        var that = this;
        that._selectChannel();
    },

    _renderChannelSelection: function() {
        var that = this;
        that._selectChannel(that.vars.selectedChannelIndex);
    },

    _setupYAxisLinesAndLabels: function() {
        var that = this;
        var axis = that.vars.chart.yAxis[0];
        var channels = that.vars.currentWindowData.channels;

        channels.forEach((channel, c) => {
            var offsetPreScale = that._getOffsetForChannelPreScale(channel);
            var offsetPostScale = that._getOffsetForChannelIndexPostScale(c);
            var channelUnit = that._getUnitForChannel(channel);
            var zeroLineID = 'channel_' + c + '_zero';
            axis.removePlotLine(zeroLineID);
            var zeroLineOptions = {
                id: zeroLineID,
                color: '#dddddd',
                value: offsetPostScale,
                width: 1
            };
            axis.addPlotLine(zeroLineOptions);

            if (!that.options.showReferenceLines) return;

            var referenceValues = that._getReferenceValuesForChannel(channel);
            referenceValues.forEach((referenceValue, r) => {
                var referenceValueWithGain = (referenceValue + offsetPreScale) * that._getGainForChannelIndex(c);
                var referenceLineID = 'channel_' + c + '_reference_' + r;
                axis.removePlotLine(referenceLineID);
                var flipFactor = that._getFlipFactorForChannel(channel);
                var referenceLineOptions = {
                    id: referenceLineID,
                    color: '#ff0000',
                    dashStyle: 'dash',
                    value: offsetPostScale + referenceValueWithGain,
                    width: 1,
                    zIndex: 1,
                    label: {
                        text: (flipFactor * referenceValue) + ' ' + channelUnit,
                        textAlign: 'right',
                        verticalAlign: 'middle',
                        x: -15,
                        y: 3,
                        style: {
                            color: 'red',
                            marginRight: '50px',
                        }
                    }
                }
                axis.addPlotLine(referenceLineOptions);
            });
        });
    },

    _inferDataModalityFromChannel: function(channel) {
        var name = channel.name.toLowerCase();
        // electrooculography
        if (
                name.indexOf('eog') > -1
            ||  name.indexOf('loc') > -1
            ||  name.indexOf('roc') > -1
        ) {
            return 'EOG';
        }
        // electrocardiography
        if (
                name.indexOf('ecg') > -1
            ||  name.indexOf('ekg') > -1
        ) {
            return 'ECG';
        }
        // electromygraphy
        if (
                name.indexOf('emg') > -1
            ||  name.indexOf('chin') > -1
            ||  name.indexOf('leg') > -1
            ||  name.indexOf('tib') > -1
        ) {
            return 'EMG';
        }
        // respiratory signal
        if (
                name.indexOf('resp') > -1
            ||  name.indexOf('abd') > -1
            ||  name.indexOf('tho') > -1
            ||  name.indexOf('can') > -1
            ||  name.indexOf('therm') > -1
            ||  name.indexOf('airflow') > -1
            ||  name.indexOf('nasal') > -1
        ) {
            return 'RESP';
        }
        // snoring signal
        if (name.indexOf('snore') > -1) {
            return 'SNORE';
        }
        // pulse-oximetric oxygen saturation
        if (name.indexOf('spo2') > -1) {
            return 'SPO2';
        }
        // unnamed auxiliary non-EEG channels
        if (name.indexOf('aux') > -1) {
            return 'AUX';
        }
        // electroencephalography
        // (default if no other channel
        // type was recognized)
        return 'EEG';
    },

    _getUnitForChannel: function(channel) {
        var that = this;
        var inferredDataModality = that._inferDataModalityFromChannel(channel);
        switch (inferredDataModality) {
            case 'EEG':
            case 'EOG':
            case 'EMG':
                return 'μV';
            case 'ECG':
                return 'mV';
            case 'RESP':
                return '';
            case 'SPO2':
                return '%';
            default:
                return '?';
        }
    },

    _getFlipFactorForChannel: function(channel) {
        var that = this;
        if (that._shouldChannelBeFlippedVertically(channel)) {
            return -1;
        }
        return 1;
    },

    _shouldChannelBeFlippedVertically: function(channel) {
        var that = this;
        var inferredDataModality = that._inferDataModalityFromChannel(channel);
        switch (inferredDataModality) {
            case 'EEG':
            case 'EOG':
            case 'EMG':
            case 'ECG':
                return true;
            case 'RESP':
            case 'SPO2':
                return false;
            default:
                return true;
        }
    },

    _getReferenceValuesForChannel: function(channel) {
        var that = this;
        var inferredDataModality = that._inferDataModalityFromChannel(channel);
        switch (inferredDataModality) {
            case 'EEG':
                return [ -37.5, 37.5 ];
            case 'EOG':
            case 'EMG':
            case 'ECG':
            case 'RESP':
                return [];
            case 'SPO2':
                return [ 90, 100 ];
            default:
                return [];
        }
    },

    _getOffsetForChannelPreScale: function(channel) {
        var that = this;
        var inferredDataModality = that._inferDataModalityFromChannel(channel);
        switch (inferredDataModality) {
            case 'EEG':
            case 'EOG':
            case 'EMG':
            case 'ECG':
            case 'RESP':
                return 0;
            case 'SPO2':
                return -96;
            default:
                return 0;
        }
    },

    _getStaticFrequencyFiltersForChannel: function(channel) {
        var that = this;
        const inferredDataModality = that._inferDataModalityFromChannel(channel);
        const staticFrequencyFiltersByDataModality = that.options.staticFrequencyFiltersByDataModality || {};
        const staticFilters = staticFrequencyFiltersByDataModality[inferredDataModality] || {};
        return Object.entries(staticFilters).map(e => { return { type: e[0], selectedValue: e[1] } });
    },

    _updateChannelGain: function(action) {
        var that = this;
        if (that.options.channelGainAdjustmentEnabled === false) {
            return;
        }
        var channelIndices;
        if (that.vars.selectedChannelIndex === undefined) {
            channelIndices = that._getChannelGains().map((gain, c) => c);
        }
        else {
            channelIndices = [ that.vars.selectedChannelIndex ];
        }
        if (action === "reset") {
            channelIndices.forEach((c) => {
                that._getChannelGains()[c] = 1;
            });
        }
        else {
            var gainChangeFactor = 1 + that.options.relativeGainChangePerStep;
            if (action === "step_decrease") {
                gainChangeFactor = 1 / gainChangeFactor;
            }
            channelIndices.forEach((c) => {
                that._getChannelGains()[c] *= gainChangeFactor;
            });
        }
        that._reloadCurrentWindow();
        that._savePreferences({
            channelGains: that.vars.channelGains,
        });
    },

    _getFeatureColor: function(featureKey, isAnswer, confidence) {
        var that = this;
        var isAnswer = !!isAnswer;
        var confidence = confidence !== undefined ? confidence : 1;
        var feature = that.options.features.options[featureKey];
        if (!feature) {
            console.error('Could not find feature', featureKey);
            return 'rgba(255, 0, 0, 1)';
        }
        if (isAnswer) {
            var color = feature.answer;
        }
        else {
            var color = feature.annotation;
        }
        var min = color.alpha.min;
        var max = color.alpha.max;
        var alpha = min + confidence * (max - min);
        var colorValues = [color.red, color.green, color.blue, alpha];
        var colorString = 'rgba(' + colorValues.join(',') + ')';
        return colorString;
    },

    _getUUID: function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    },

    _getBorderTopForChannelIndex: function(index) {
        var that = this;
        var top = that._getOffsetForChannelIndexPostScale(index) + that.options.graph.channelSpacing / 2;
        return top;
    },

    _getBorderBottomForChannelIndex: function(index) {
        var that = this;
        var bottom = that._getOffsetForChannelIndexPostScale(index) - that.options.graph.channelSpacing / 2;
        return bottom;
    },

    _getArbitration: function() {
        var that = this;
        return that.options.context.assignment.arbitration;
    },

    _getArbitrationDoc: function() {
        var that = this;
        return that.options.context.assignment.arbitrationDoc();
    },

    _getArbitrationRoundNumber: function() {
        var that = this;
        return that.options.context.assignment.arbitrationRoundNumber;
        return roundNumber;
    },

    _getArbitrationRoundNumberInt: function() {
        var that = this;
        var roundNumber = that._getArbitrationRoundNumber();
        roundNumber = !!roundNumber ? roundNumber : 0;
        return roundNumber;
    },

    _isArbitrating: function() {
        var that = this;
        return that._getArbitration() && that._getArbitrationRoundNumberInt() > 0;
    },

    _addArbitrationInformationToObject: function(object) {
        var that = this;
        var arbitration = that._getArbitration();
        if (arbitration !== undefined) {
            object.arbitration = arbitration;
        }
        var arbitrationRoundNumber = that._getArbitrationRoundNumber();
        if (arbitrationRoundNumber !== undefined) {
            object.arbitrationRoundNumber = arbitrationRoundNumber;
        }
    },

    _savePreferences: function(updates) {
        var that = this;
        if (that.options.isReadOnly) return;
        if (!that.options.context.preferences) return;
        var modifier = {};
        for (key in updates) {
            modifier['annotatorConfig.' + key] = updates[key];
        }
        const context = that.options.context;
        that._addArbitrationInformationToObject(modifier);
        modifier = { $set: modifier };
        Preferences.update(that.options.context.preferences._id, modifier, (error, numPreferencesUpdated) => {
            if (error) {
                console.error(error);
                if (!Roles.userIsInRole(Meteor.userId(), 'tester')) {
                    alert(error.message);
                }
            }
            that.options.context.preferences = Preferences.findOne(that.options.context.preferences._id);
        });
    },

    _saveUserEvent: function(eventType, metadata) {
        var that = this;
        var eventType = eventType !== undefined ? eventType : 'undefined';
        var metadata = metadata !== undefined ? metadata : {};
        if (that.options.projectUUID) {
            metadata.projectUUID = that.options.projectUUID;
        }
        var options = {
            eventType: eventType,
            metadata: metadata,
        };
        console.error('Trying to save a user event, but this feature is not implemented yet.');
    },

    _getDelay: function(){
        that = this;
        assigns = Assignments.find({
            task: that.options.context.task._id,
            data: that.options.context.data._id,
         }, {
            sort: { updatedAt: -1 },
        }).fetch();

        
        assign = assigns[0];
        //console.log(assign.getchannelsDelayedAmount());
     //   console.log(assign.channelsDelayed);
        if(assign.channelsDelayed){
            that.vars.delayAmount = assign.channelsDelayed.split(",");
            that.vars.channelsDealyedNames = that._getChannelsDisplayed();
        }
        else{
            that.vars.delayAmount = [];
        }
    
        //console.log(that.vars.delayAmount);
        //Data.find({
            //_id: that.options.context.data._id
        //})
        //var delayString ="";
       // that.vars.delayAmount.forEach( channelAmount =>{
            //delayString = delayString + channelAmount + ",";

        //})
        //console.log(assign);
       //console.log(delayString);
        //assign._dealyChannels(delayString)


          
      

    },

    _getCurrAssignment(){
        that = this;
        assigns = Assignments.find({
            task: that.options.context.task._id,
            data: that.options.context.data._id,
        }, {
            sort: { updatedAt: -1 },
            }).fetch();

        
        assign = assigns[0];
       
        return assign;

    },

    _setDelay: function(assign){
        that = this;
        assigns = Assignments.find({
            task: that.options.context.task._id,
            data: that.options.context.data._id,
        }, {
            sort: { updatedAt: -1 },
            }).fetch();

        
        assign = that._getCurrAssignment();
        //assigns[0];
       
       // console.log(assign);
        var delayString ="";
        that.vars.delayAmount.forEach( channelAmount =>{
            delayString = delayString + channelAmount + ",";
        });
        delayString = delayString.substring(0,delayString.length-1);
        assign.delayChannels(delayString);
        //Data.find({
            //_id: that.options.context.data._id
        //})
       
        //})
       //console.log(assign.channelsDelayed);
        //console.log(assign);
       //console.log(delayString);
        //assign._dealyChannels(delayString);

          
      

    },

    _saveUserEventWindow: function(beginOrComplete) {
        var that = this;
        if (!that._isHITModeEnabled()) return;
        that._saveUserEvent('window_' + beginOrComplete, {
            recordingName: that.options.recordingName,
            windowStart: that.vars.currentWindowStart,
            windowSizeInSeconds: that.options.windowSizeInSeconds,
            channelsDisplayed: that._getChannelsDisplayed(),
            features: that.options.features.order,
            isTraining: that._isCurrentWindowTrainingWindow(),
        });
    },

    _saveUserEventWindowBegin: function() {
        var that = this;
        that._saveUserEventWindow('begin');
    },

    _saveUserEventWindowComplete: function() {
        var that = this;
        that._saveUserEventWindow('complete');
    },

    _getAnnotations: function(recording_name, window_start, window_end, correctAnswers) {
        var that = this;
        if (!that.options.features.showUserAnnotations) return;
        if (that.options.features.showAllBoxAnnotations == "none") return;

        var cacheKey = that._getAnnotationsCacheKey(recording_name, window_start, window_end, correctAnswers);
        if (that.vars.annotationsLoaded || that.vars.annotationsCache[cacheKey]) {
            var data = that.vars.annotationsCache[cacheKey] || {
                annotations: [],
            };
            if (!correctAnswers) {
                that._incrementNumberOfAnnotationsInCurrentWindow(that._getVisibleAnnotations(data.annotations).length);
            }
            that._displayArtifactsSelection(data.annotations);
            that._displaySleepStageSelection(data.annotations, window_start, window_end);
            return;
        }
        that.vars.annotationsCache[cacheKey] = {
            annotations: [],
        };
        var annotations;

        if (Roles.userIsInRole(Meteor.userId(), 'admin')) {
            if (that.options.features.showAllBoxAnnotations == "all") {
           //     console.log("inside annotate");
                //grab annotations from all users
                //console.log(that.options.context.data._id);
               // console.log(that.options.context.assignment._id);
                annotations = Annotations.find({
                    assignment: that.options.context.assignment._id,
                    data: that.options.context.data._id,
                    type: 'SIGNAL_ANNOTATION',
                }, {
                    sort: { updatedAt: -1 },
                }).fetch();
                
            } else if (that.options.features.showAllBoxAnnotations == "my") {
                //grab annotations from this current admin user
                annotations = Annotations.find({
                    assignment: that.options.context.assignment._id,
                    data: that.options.context.data._id,
                    user: Meteor.userId(),
                    type: 'SIGNAL_ANNOTATION',
                }, {
                    sort: { updatedAt: -1 },
                }).fetch();
            } else if (that.options.features.showAllBoxAnnotations != "") {
                //grab annotations from the selected user
                annotations = Annotations.find({
                    assignment: that.options.context.assignment._id,
                    data: that.options.context.data._id,
                    user: that.options.features.showAllBoxAnnotations,
                    type: 'SIGNAL_ANNOTATION',
                }, {
                    sort: { updatedAt: -1 },
                }).fetch();
            }
        } else {
            //grab annotations from this current non-admin user
            annotations = Annotations.find({
                assignment: that.options.context.assignment._id,
                data: that.options.context.data._id,
                user: Meteor.userId(),
                type: 'SIGNAL_ANNOTATION',
            }, {
                sort: { updatedAt: -1 },
            }).fetch();
        }

        that.vars.annotationsLoaded = true;
        
        annotations = annotations.map(function(annotation) {
            var annotationFormatted = annotation.value
            annotationFormatted.id = annotation._id;
            annotationFormatted.arbitration = annotation.arbitration;
            annotationFormatted.arbitrationRoundNumber = annotation.arbitrationRoundNumber;
            annotationFormatted.rationale = annotation.rationale;
            return annotationFormatted;
        });
        annotations.forEach(function(annotation) {
            var annotationWindowStart = Math.floor(annotation.position.start / that.options.windowSizeInSeconds) * that.options.windowSizeInSeconds;
            var annotationWindowEnd = annotationWindowStart + that.options.windowSizeInSeconds;
            var annotationCacheKey = that._getAnnotationsCacheKey(recording_name, annotationWindowStart, annotationWindowEnd, correctAnswers);
            if (!that.vars.annotationsCache[annotationCacheKey]) {
                that.vars.annotationsCache[annotationCacheKey] = {
                    annotations: [],
                };
            }
            that.vars.annotationsCache[annotationCacheKey].annotations.push(annotation);
        });
        var data = that.vars.annotationsCache[cacheKey] || {
            annotations: [],
        };
        that._displayArtifactsSelection(data.annotations);
        that._displaySleepStageSelection(data.annotations, window_start, window_end);
        that._displayAnnotations(annotations);
    },

    _getVisibleAnnotations: function(annotations) {
        var that = this;
        var visibleAnnotations = annotations.filter(function(annotation) {
            var isVisibleFeature = that.options.features.order.indexOf(annotation.label) > -1;
            var isVisibleChannel = false;
            var annotationChannels = annotation.position.channels;
            if (annotationChannels) {
                if (!annotationChannels.length) {
                    annotationChannels = [annotationChannels];
                }
                for (var c = 0; c < annotationChannels.length; ++c) {
                    var channel = annotation.metadata.channels_displayed[annotationChannels[c]];
                    if (that._getChannelsDisplayed().indexOf(channel) > -1) {
                        isVisibleChannel = true;
                        break;
                    }
                }
            }
            return isVisibleFeature && isVisibleChannel;
        });
        return visibleAnnotations;
    },

    _getAnnotationsCacheKey: function(recording_name, window_start, window_end, correctAnswers, cacheCategory) {
        cacheCategory = cacheCategory || 'FEATURE';
        var key = recording_name + '_' + cacheCategory + '_' + window_start + '_' + window_end;
        if (correctAnswers) {
            key += '_correct_answers';
        }
        return key;
    },

    _displayArtifactsSelection: function(annotations) {
        var that = this;
        var activeClass = 'teal darken-4';
        var noArtifactAnnotation = true;
        $(that.element).find('.artifact_panel button.artifact').removeClass(activeClass);
        for (var i = 0; i < annotations.length; ++i) {
            var annotation = annotations[i];
            if (that.vars.fullWindowLabels[annotation.label] === 'ARTIFACT') {
                var cacheKey = that._getAnnotationsCacheKey(that.vars.currentWindowRecording, annotation.position.start, annotation.position.end, false, 'ARTIFACT');
                that.vars.annotationsCache[cacheKey] = annotation;
                $(that.element).find('.artifact_panel button.artifact[data-annotation-type="' + annotation.label + '"]').addClass(activeClass);
                noArtifactAnnotation = false;
                break;
            }
        }
        if (noArtifactAnnotation) {
            $(that.element).find('.artifact_panel button.artifact[data-annotation-type="artifacts_none"]').addClass(activeClass);
        }
    },

    _displaySleepStageSelection: function(annotations, epochStartTimeInSeconds, epochEndTimeInSeconds) {
        var that = this;

        const arbitrationDoc = that._getArbitrationDoc();
        const arbitrationRoundNumber = that._getArbitrationRoundNumberInt();

        var inactiveClass = 'grey lighten-1';
        var activeClassSelectedInPreviousRound = 'selected-in-previous-round ' + inactiveClass;
        var activeClassSelectedInCurrentRound = 'teal';
        var activeClasses = activeClassSelectedInPreviousRound + ' ' + activeClassSelectedInCurrentRound;
        var activeClass = activeClassSelectedInCurrentRound;
        $(that.element).find('.sleep_stage_panel button.sleep_stage').removeClass(activeClasses).addClass(inactiveClass);
        $(that.element).find('.sleep_stage_panel button.sleep_stage .votes-info').removeClass('visible').removeClass('has-disagreement');
        
        var preClassificationAnnotation = that._getPreClassificationAnnotations({ 'value.position.start': epochStartTimeInSeconds, 'value.position.end': epochEndTimeInSeconds });
        $(that.element).find('.sleep_stage_panel button.sleep_stage').removeClass('pre-classification');
        if (preClassificationAnnotation && preClassificationAnnotation.length > 0) {
            preClassificationAnnotation = preClassificationAnnotation[0];
            preClassificationLabel = preClassificationAnnotation.value.label;
            $(that.element).find('.sleep_stage_panel button.sleep_stage[data-annotation-type="' + preClassificationLabel + '"]').addClass('pre-classification');
        }

        try {
            annotations.forEach((annotation) => {
                if (that.vars.fullWindowLabels[annotation.label] === 'SLEEP_STAGE') {
                    var cacheKey = that._getAnnotationsCacheKey(that.vars.currentWindowRecording, annotation.position.start, annotation.position.end, false, 'SLEEP_STAGE');
                    that.vars.annotationsCache[cacheKey] = annotation;
                    if (arbitrationDoc && !!arbitrationRoundNumber) {
                        annotationArbitrationRoundNumber = !!annotation.arbitrationRoundNumber ? annotation.arbitrationRoundNumber : 0;
                        if (!annotation.arbitration || annotationArbitrationRoundNumber < arbitrationRoundNumber) {
                            activeClass = activeClassSelectedInPreviousRound;
                        }
                        const labelCounts = {};
                        const arbitrationAnnotations = Object.values(arbitrationDoc.aggregatedAnnotations({ 'value.position.start': annotation.position.start, 'value.position.end': annotation.position.end }, { reactive: false, fields: { 'user': 1, 'value.label': 1 } }, arbitrationRoundNumber).all)[0] || [];
                        const uniqueLabels = new Set(arbitrationAnnotations.map(a => a.annotation.value.label));
                        const hasDisagreement = uniqueLabels.size > 1;
                        arbitrationAnnotations.forEach((arbitrationAnnotation) => {
                            if (arbitrationAnnotation.annotation.user == Meteor.userId()) return;
                            const label = arbitrationAnnotation.annotation.value.label;
                            if (!labelCounts[label]) {
                                labelCounts[label] = 1;
                            }
                            else {
                                labelCounts[label] += 1;
                            }
                        });
                        Object.keys(labelCounts).forEach((label) => {
                            labelCount = labelCounts[label];
                            const votesInfo = $(that.element).find('.sleep_stage_panel button.sleep_stage[data-annotation-type="' + label + '"] .votes-info').addClass('visible').text(labelCount);                            
                            if (hasDisagreement) {
                                votesInfo.addClass('has-disagreement');
                            }
                        });
                        if (hasDisagreement && arbitrationDoc.currentRoundNumber > 1) {
                            that._showInfoPanel();
                        }
                        else {
                            that._hideInfoPanel();
                        }
                    }
                    $(that.element).find('.sleep_stage_panel button.sleep_stage[data-annotation-type="' + annotation.label + '"]').removeClass(inactiveClass).addClass(activeClass);
                    throw false;
                }
            });
        } catch (error) {
            if (error !== false) {
                console.error(error);
            }
        }
    },

    _turnExampleIntoAnnotation: function(example) {
        var that = this;
        var annotation = {
            id: that._getUUID(),
            label: example.type,
            confidence: example.confidence,
            position: {
                start: example.start,
                end: example.end,
                channels: example.channels,
            },
            metadata: {
                channels_displayed: example.channels_displayed,
                comment: example.comment,
            },
        };
        return annotation;
    },

    _turnExamplesIntoAnnotations: function(examples) {
        var that = this;
        var annotations = [];
        examples.forEach(function(example) {
            annotations.push(that._turnExampleIntoAnnotation(example));
        });
        return annotations;
    },

    _displayAnnotations: function(annotations) {
        var that = this;
        var chart = that.vars.chart;
        if (chart === undefined) {
            return;
        }
        annotations.forEach((annotation) => {
            
            var type = (annotation.label);
          
            if (that.options.features.order.indexOf(type) < 0) {
                
                    return;
            }
            var annotationId = annotation.id;
            var start_time = annotation.position.start;
            var end_time = annotation.position.end;
            var confidence = annotation.confidence;
            var comment = annotation.metadata.comment;

            var channelIndices = annotation.position.channels;
            if (channelIndices === undefined) {
                
                return;
            }
            if (!Array.isArray(channelIndices)) {
                channelIndices = [channelIndices];
            }
            var channelIndicesMapped = [];
            channelIndices.forEach((channelIndex) => {
                var channelIndexRecording = annotation.metadata.channels_displayed[channelIndex];
                var channelIndexMapped = that._getChannelsDisplayed().indexOf(channelIndexRecording);
                while (channelIndexMapped > -1) {
                    channelIndicesMapped.push(channelIndexMapped);
                    channelIndexMapped = that._getChannelsDisplayed().indexOf(channelIndexRecording, channelIndexMapped + 1);
                }
            });

            channelIndicesMapped.sort().reverse().forEach((channelIndexMapped) => {
               // console.log("inside thids")
               //console.log(channelIndexMapped);
             
               if(!end_time){
                   
                    annotation = that._addAnnotationChangePoint(annotationId, start_time, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,], that.vars.activeFeatureType);
                    annotation.update({
                        
                        shape: {
                            params: {
                                width: 0.01,
                                height: 8000,
                            }
                        }
                    });
                
               }
               else{
                  //annotation = that._addAnnotationBox(annotationId, start_time, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], that.vars.activeFeatureType);
                that._addAnnotationBox(annotationId, start_time, channelIndexMapped, type, end_time, confidence, comment, annotation);
               }
    
            });
        });
    },

    _flushAnnotations: function() {
        var that = this;
        annotations = that.vars.chart.annotations.allItems;
        while (annotations && annotations.length > 0) {
            annotations[0].destroy();
            that.vars.chart.selectedAnnotation = null;
        }
        that.vars.annotationsCache = {};
    },

    _saveAnnotation: function(annotationId, recording_name, type, start, end, channels, confidence, comment, metadata, rationale, callback) {

        var that = this;
        if (that.options.isReadOnly) return;
        that._incrementNumberOfAnnotationsInCurrentWindow(1);
        that._updateLastAnnotationTime();
        var metadata = metadata !== undefined ? metadata : {};
        if (channels && !channels.length) {
            channels = [ channels ];
        }
    //    console.log(metadata);
        const context = that.options.context;
      //  console.log(annotationId);
        if (!annotationId) {
           // console.log("nZ");
            var graph = $(that.element).find('.graph');
            var annotationDocument = {
                assignment: that.options.context.assignment._id,
                user: Meteor.userId(), 
                data: that.options.context.data._id,
                type: 'SIGNAL_ANNOTATION',
                value: {
                    label: type,
                    confidence: confidence,
                    position: {
                        channels: channels,
                        start: parseFloat(start),
                        end: parseFloat(end),
                    },
                    metadata: {
                        recording: that.options.recordingName,
                        channels_displayed: that._getChannelsDisplayed(),
                        comment: comment,
                        metadata: metadata,
                        annotatorConfig: {
                            task: that.options.context.task.annotatorConfig,
                            preferences: that.options.context.preferences.annotatorConfig,
                        },
                        graph: {
                            width: graph.width(),
                            height: graph.height(),
                        }
                    },
                },
                rationale: rationale,
            }
            that._addArbitrationInformationToObject(annotationDocument);
            annotationDocument.id = Annotations.insert(annotationDocument, (error, annotationId) => {
                that._updateMarkAssignmentAsCompletedButtonState();
                if (error) {
                    console.error(error);
                    if (!Roles.userIsInRole(Meteor.userId(), 'tester')) {
                        alert(error.message);
                    }
                    return;
                }
            });
            that._updateMarkAssignmentAsCompletedButtonState();
            updateCache(annotationDocument);
        }
        else {
            const annotationModifier = {
                'value.label': type,
                'value.confidence': confidence,
                'value.metadata.comment': comment,
                'rationale': rationale,
            };
            that._addArbitrationInformationToObject(annotationModifier);
            Annotations.update(annotationId, { $set: annotationModifier }, (error, numAnnotationsUpdated) => {
                that._updateMarkAssignmentAsCompletedButtonState();
                if (error) {
                    console.error(error);
                    if (!Roles.userIsInRole(Meteor.userId(), 'tester')) {
                        alert(error.message);
                    }
                    return;
                }
                var annotationDocument = Annotations.findOne(annotationId);
              //  console.log(annotationDocument);
                annotationDocument.id = annotationDocument._id;
                updateCache(annotationDocument);
            });
            that._updateMarkAssignmentAsCompletedButtonState();
        }
        function updateCache(annotation) {
            var key = that._getAnnotationsCacheKey(recording_name, annotation.value.position.start, annotation.value.position.end, false);
            var cacheEntry = that.vars.annotationsCache[key];
            if (!cacheEntry) {
                cacheEntry = {
                    annotations: []
                }
            }
            if (cacheEntry.annotations) {
                cacheEntry.annotations.unshift(annotation.value);
            }
            that.vars.annotationsCache[key] = cacheEntry;
            callback && callback(annotation, null);
        }
    },

    _deleteAnnotation: function(annotationId, recording_name, start, end, channels, channelsDisplayed) {
        var that = this;
        if (that.options.isReadOnly) return;
        that._incrementNumberOfAnnotationsInCurrentWindow(-1);
        that._updateLastAnnotationTime();
        Annotations.remove(annotationId, (error, numAnnotationsRemoved) => {
            if (error) {
                console.error(error);
                if (!Roles.userIsInRole(Meteor.userId(), 'tester')) {
                    alert(error.message);
                }
                return;
            }
        });
    },

    _incrementNumberOfAnnotationsInCurrentWindow: function(increment) {
        var that = this;
        that._setNumberOfAnnotationsInCurrentWindow(that.vars.numberOfAnnotationsInCurrentWindow + increment);
    },

    _setNumberOfAnnotationsInCurrentWindow: function(value) {
        var that = this;
        that.vars.numberOfAnnotationsInCurrentWindow = Math.max(0, value);
        var zeroAnnotations = that.vars.numberOfAnnotationsInCurrentWindow == 0
        $(that.element).find('.no-features').prop('disabled', !zeroAnnotations);
        $(that.element).find('.submit-features').prop('disabled', zeroAnnotations);
    },

    _lastWindowReached: function() {
        var that = this;
        if (!that.vars.lastWindowHasBeenReachedBefore) {
            that._lastWindowReachedForTheFirstTime();
        }
        that.vars.lastWindowHasBeenReachedBefore = true;
        $(that.element).find('.next-window').hide();
    },

    _lastWindowReachedForTheFirstTime: function() {
        var that = this;
        if (that.options.showConfirmationCode && that.options.confirmationCode) {
            var code = that.options.confirmationCode;
            var textCompletionButton = 'Show Confirmation Code'
            var confirmationCodeInstructions = 'You need to copy and paste your confirmation code into the input field on the Mechanical Turk instructions page and submit in order to receive the full payment for this task.';
            if (!that._isHITModeEnabled()) {
                bootbox.alert('<div style="text-align: left;">This is the last data window. Please annotate it just like you did with the others. After that, please click the green button saying "<b>' + textCompletionButton + '</b>" to get your confirmation code and finish the task.<br><br><span style="color: #ff0000; font-weight: bold;">Important: ' + confirmationCodeInstructions + '</span>', showCompletionButton)
                    .appendTo(that.element);
            }
            else {
                $(that.element).find('.submit-annotations').add('.next-window').click(function() {
                    showCompletionButton();
                    showConfirmationCode();
                });
            }

            function showCompletionButton() {
                $(that.element).find('.graph_footer .middle').children().hide();
                var taskCompletionCodeButton = $("<button>")
                    .addClass('btn btn-success')
                    .html(textCompletionButton)
                    .click(function() {
                        showConfirmationCode();
                    })
                    .appendTo('.graph_footer .middle');
            }

            function showConfirmationCode() {
                completeProgressBar();
                bootbox.alert({
                    title: 'Thank you for completing the task!',
                    message: 'Your confirmation code is:<br><br><span style="color: #ff0000; font-weight: bold; font-size: 30px">' + code + '</span><br><br>' + confirmationCodeInstructions + '<br><br>After that, you can simply close this tab. Thank you for your participation!'
                }).appendTo(that.element);
            }

            function completeProgressBar() {
                $(that.element).find('.progress-bar').css('width', '100%');
            }
        }
    }

});