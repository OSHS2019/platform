import isWebGLEnabled from 'detector-webgl';
import moment from 'moment';

Template.AnnotatorEDF.onCreated(function() {
    if (!browser.satisfies({
        chrome: '>7.0.517',
    })) {
        const chromeDownloadUrl = 'https://www.google.com/chrome/';
        const confirmedToOpenChromeDownloadUrl = confirm('In order to view recordings, you need to use the Chrome browser in version 8 or higher. If you do not have Chrome installed on your computer yet, please click OK to open the Chrome download page in a new tab. Alternatively, you may also copy and paste the address below and paste in into a new tab to get to the same page:\n\n' + chromeDownloadUrl);
        if (confirmedToOpenChromeDownloadUrl) {
            window.open(chromeDownloadUrl);
        }
        Router.go('home');
    }
    if (!isWebGLEnabled) {
        const webGLVideoURL = 'https://tinyurl.com/enable-webgl';
        const confirmedToOpenVideo = confirm('In order to view recordings, your browser needs to support WebGL. Watch this video to learn how to enable WebGL in your Chrome browser:\n\n' + webGLVideoURL + '\n\nWould you like to open this video and learn how to enable WebGL?');
        if (confirmedToOpenVideo) {
            window.open(webGLVideoURL);
        }
        Router.go('home');
    }
    this.keyDownToggleFloatingPanelListener = (event) => {
        if (this.view.isDestroyed) {
            return;
        }
        if ($(event.target).is('input, textarea, select')) {
            return;
        }
        const keyCode = event.which;
        const spaceKeyCode = 32;
        switch (keyCode) {
            case spaceKeyCode:
                if (!toggleFloatingPanel(event, this, '.input-panel-container')) {
                    toggleFloatingPanel(event, this, '.info-panel-container');
                }
                break;
            case 'i'.charCodeAt(0):
            case 'I'.charCodeAt(0):
                toggleFloatingPanel(event, this, '.info-panel-container');
                break;
            default:
                break;
        }
    };
    $(document).keydown('on', this.keyDownToggleFloatingPanelListener);
});

Template.AnnotatorEDF.onRendered(function() {
    const annotatorContainer = $(this.find('.annotator-container'));
    const template = this;
    console.log(this);
    let config = $.extend({}, this.data.task.annotatorConfig);
    config = $.extend(config, this.data.preferences.annotatorConfig);
    config = $.extend(config, {
        recordingName: this.data.data.path,
        context: this.data,
        allRecordings: [this.data.data.path, this.data.data2.path],
        setVisibilityStatusForInfoPanel: (isVisible) => {
            setVisibilityStatusForFloatingPanel(isVisible, template, '.info-panel-container');
        },
        toggleInfoPanel: () => {
            toggleFloatingPanel(undefined, template, '.info-panel-container');
        },
    });
    annotatorContainer.TimeSeriesAnnotator(config);

    
});

Template.AnnotatorEDF.onDestroyed(function() {
    const annotator = $(this.find('.annotator-container')).data('crowdeegTimeSeriesAnnotator');
    if (annotator) {
        annotator.destroy();
    }
    if (this.keyDownToggleFloatingPanelListener) {
        $(document).keydown('off', this.keyDownToggleFloatingPanelListener);
    }
});

Template.AnnotatorEDF.helpers({
    medicationIntakeIsRegularIsSet() {
        return this.assignment.dataDoc().patientDoc().medicationIntakeIsRegular !== undefined;
    },
    isSavingData() {
        return Session.get('numPendingItemsToSave') > 0;
    },
    showInfoPanel() {
        const missingAnnotations = this.assignment.missingAnnotations();
        const upperLimitForSmallAmountOfMissingAnnotations = 10;
        const hasSmallAmountOfMissingAnnotations = missingAnnotations.length > 0 && missingAnnotations.length <= upperLimitForSmallAmountOfMissingAnnotations;
        const isInArbitrationRound = this.assignment.arbitration && this.assignment.arbitrationRoundNumber > 0;
        return isInArbitrationRound || hasSmallAmountOfMissingAnnotations;
    },
    revisionsWithRationalesForAnnotation() {
        const template = Template.instance();
        if (!template.view.isRendered) return [];
        const annotator = $(template.find('.annotator-container')).data('crowdeegTimeSeriesAnnotator');
        const currentWindowStart = annotator.getCurrentWindowStartReactive();
        if (currentWindowStart === undefined || currentWindowStart === null) return [];
        const arbitrationDoc = this.assignment.arbitrationDoc();
        if (!arbitrationDoc) return [];
        const expandInstructionAndConditionIds = true;
        return arbitrationDoc.revisionsWithRationalesForAnnotations(
            { 'value.position.start': currentWindowStart },
            this.assignment.arbitrationRoundNumber,
            expandInstructionAndConditionIds,
        );
    },
    labelToHumanReadable(label) {
        const fullWindowLabelsToHumanReadable = {
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
        };
        const humanReadable = fullWindowLabelsToHumanReadable[label];
        if (humanReadable) return humanReadable;
        return label;
    },
    classificationSummary() {
        const template = Template.instance();
        if (!template.view.isRendered) return;
        const annotator = $(template.find('.annotator-container')).data('crowdeegTimeSeriesAnnotator');
        const currentWindowStart = annotator.getCurrentWindowStartReactive();
        const annotations = this.assignment.annotationsForClassificationSummary();
        if (!annotations || annotations.length == 0) return;
        const durationInSecondsTotal = annotations[annotations.length - 1].value.position.end - annotations[0].value.position.start;
        let activeAnnotation;
        annotations.forEach((annotation, a) => {
            const durationInSecondsAnnotation = annotation.value.position.end - annotation.value.position.start;
            const isFirst = a == 0;
            const isLast = a == annotations.length - 1;
            const isFullHour = annotation.value.position.start % 3600 == 0;
            const hasTick = isFirst || isLast || isFullHour;
            annotation.value.metadata = annotation.value.metadata || {};
            let tickLabel = moment.utc(annotation.value.position.start * 1000).format('H:mm:ss');
            const zeroTimeSuffix = ':00';
            while (tickLabel.slice(-zeroTimeSuffix.length) == zeroTimeSuffix) {
                tickLabel = tickLabel.slice(0, -zeroTimeSuffix.length)
            }
            const isSelected = currentWindowStart == annotation.value.position.start;
            annotation.value.metadata.classificationSummary = {
                width: (Math.floor(durationInSecondsAnnotation / durationInSecondsTotal * 100000) / 1000) + '%',
                tick: {
                    type: hasTick ? 'normal' : 'none',
                    label: tickLabel,
                },
                isSelected: isSelected,
            };
            if (isSelected) {
                activeAnnotation = annotation;
            }
        });
        let yAxisLabels = annotations[0].opinionsOnPossibleLabels().map(l => l.valueHumanReadable);
        const preClassificationConfig = this.task.annotatorConfig.preClassification;
        const uncertaintyInformationConfig = preClassificationConfig.uncertaintyInformation || {};
        let activeAnnotationExplanation;
        if (activeAnnotation) {
            const uncertaintyInformationArgumentativeConfig = uncertaintyInformationConfig.argumentative || {};
            activeAnnotationExplanation = activeAnnotation.explanationForClassificationSummary(uncertaintyInformationArgumentativeConfig.noiseProbability);
        }
        return {
            title: preClassificationConfig.title,
            uncertaintyInformationConfig: uncertaintyInformationConfig,
            annotations: annotations,
            activeAnnotation: activeAnnotation,
            activeAnnotationExplanation: activeAnnotationExplanation,
            yAxisLabels: yAxisLabels,
        };
    },
});

Template.AnnotatorEDF.events({
    'click .input-panel-toggle': (event, template) => { toggleFloatingPanel(event, template, '.input-panel-container') },
    'click .info-panel-toggle': (event, template) => { toggleFloatingPanel(event, template, '.info-panel-container') },
    'click .jump-to-epoch-with-start-time': (event, template) => {
        const epochStartTimeInSeconds = parseFloat($(event.currentTarget).attr('data-epoch-start-time-in-seconds'));
        if (epochStartTimeInSeconds === undefined) return;
        const annotator = $(template.find('.annotator-container')).data('crowdeegTimeSeriesAnnotator');
        if (!annotator) return;
        annotator.jumpToEpochWithStartTime(epochStartTimeInSeconds);
    },
});

function setVisibilityStatusForFloatingPanel(isVisible, template, panelContainerSelector) {
    const panelContainer = $(template.find(panelContainerSelector));
    if (panelContainer.is(':hidden')) return false;
    const panelToggleIcon = panelContainer.find('.floating-panel-toggle i');
    const panel = panelContainer.find('.floating-panel');
    const fadeDurationMilliseconds = 100;
    if (isVisible) {
        panelContainer.addClass('active');
        panel.fadeIn(fadeDurationMilliseconds);
        panelToggleIcon.removeClass(panelToggleIcon.data('icon-class')).addClass('fa-times black-text');
    }
    else {
        panelContainer.removeClass('active');
        panel.hide();
        panelToggleIcon.removeClass('fa-times black-text').addClass(panelToggleIcon.data('icon-class'));
    }
    return true;
}

function toggleFloatingPanel(event, template, panelContainerSelector) {
    event && event.preventDefault && event.preventDefault();
    const panelContainer = $(template.find(panelContainerSelector));
    const isVisible = !panelContainer.hasClass('active');
    return setVisibilityStatusForFloatingPanel(isVisible, template, panelContainerSelector);
}
