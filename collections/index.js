import { Match } from 'meteor/check'
import { helpers } from 'meteor/ostrio:files';
import moment, { relativeTimeRounding } from 'moment'
import swal from 'sweetalert2'
import seedrandom from 'seedrandom'


function formatDurationInSeconds(durationInSeconds) {
    return moment('1970-01-01').startOf('day').seconds(durationInSeconds).format('H:mm:ss');
}

function formatAsPercentage(proportion) {
    const numDecimals = 1;
    const decimalFactor = Math.pow(10, numDecimals);
    return Math.round(proportion * 100 * decimalFactor) / decimalFactor + '%';
}

function convertNumStepsRequiredAndCompletedIntoProgressObject(numStepsRequired, numStepsCompleted) {
    const asProportion = numStepsRequired == 0 ? 1.0 : numStepsCompleted / numStepsRequired;
    const asPercentage = formatAsPercentage(asProportion);
    const asNumStepsCompletedOfNumStepsRequired = numStepsCompleted + '/' + numStepsRequired;
    const asNumStepsCompletedOfNumStepsRequiredAndPercentage = asNumStepsCompletedOfNumStepsRequired + ' (' + asPercentage + ')';
    return {
        numStepsRequired,
        numStepsCompleted,
        asProportion,
        asPercentage,
        asNumStepsCompletedOfNumStepsRequired,
        asNumStepsCompletedOfNumStepsRequiredAndPercentage,
    }
}

function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};

function byLastModifiedDateLatestFirst(a, b) {
    return b.lastModified - a.lastModified;
}

function byLastModifiedDateOldestFirst(a, b) {
    return a.lastModified - b.lastModified;
}

function ensureIndicesForCollection(collection, indices) {
    Meteor.startup(() => {
        if (Meteor.isServer) {
            const indexOptions = {
                background: true,
            };
            const indexKeys = {};
            indices.forEach((index) => {
                indexKeys[index] = 1;
            })
            collection.rawCollection().createIndex(indexKeys, indexOptions);
        }
        else if (Meteor.isClient) {
            collection._collection._ensureIndex(indices);
        }
    });
}

let Patients;
let Data;
let Tasks;
let Guidelines;
let Instructions;
let Propositions;
let Assignments;
let Annotations;
let Preferences;
let Arbitrations;
let PreferencesFiles;
let AlignmentFiles;
let AnnotationFiles;
let TaskNames;

if (Meteor.isClient) {
    Meteor.subscribe('all');
}

Security.defineMethod('ifNotTester', {
    fetch: [],
    allow(type, field, userId, doc) {
        return !Roles.userIsInRole(userId, 'tester');
    },
});

Security.defineMethod('ifAssigned', {
    fetch: [],
    allow(type, field, userId, assignment) {
        return assignment.users.indexOf(userId) > -1 || assingment.reviewer === userId;
    },
});

Security.defineMethod('ifForOwnAssignment', {
    fetch: [],
    allow(type, field, userId, annotation) {
        const assignment = Assignments.findOne(annotation.assignment);
        if (!assignment) return false;
        return assignment.users.indexOf(userId) > -1 || assignment.reviewer === userId;
    },
});

CollectionRevisions.defaults.ignoreWithinUnit = 'seconds';
CollectionRevisions.defaults.ignoreWithin = false;
CollectionRevisions.defaults.keep = true;
CollectionRevisions.Annotations = {
    ignoreWithin: 5,
}

const Schemas = {};

const SchemaHelpers = {
    // Force value to be current date (on server) upon insert
    // and prevent updates thereafter.
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {$setOnInsert: new Date()};
            } else {
                this.unset();  // Prevent user from supplying their own value
            }
        }
    },
    // Force value to be current date (on server) upon update
    // and don't allow it to be set upon insert.
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    },
    dataType: {
        type: String,
        label: 'Type',
        allowedValues: [
            'EDF',
            'Questionnaire',
        ],
    },
    dataSource: {
        type: String,
        label: 'Source',
        allowedValues: [
            'PSG',
            'watchpat',
            'ANNE',
            'MUSE',
            'Apnealink',
            'GENEActiv',
            'AX3',
            'Actical',
            'Other'
        ],
    },
    annotator: {
        type: String,
        label: 'Annotator',
        allowedValues: [
            'EDF',
            'Questionnaire',
        ],
    },
    annotatorConfig: {
        type: Object,
        label: 'Annotator Configuration',
        blackbox: true,
        defaultValue: {},
    },
    csvAnnotationInfo:{
        type: Object,
        label: "CSV Annotation File Info",
        blackbox: true,
        defaultValue: {}
    },
    csvAnnotations:{
        type: Object,
        label: "CSV File Annotations",
        blackbox: true,
        defaultValue: {}
    },
    annotationType: {
        type: String,
        label: 'Type',
        allowedValues: [
            // General annotation types
            'SIGNAL_ANNOTATION',
            // Overall annotations for epilepsy analysis
            'QUALITY_OF_EEG',
            'ALL_LEADS_WORKING_THROUGHOUT_RECORDING',
            'NOT_ALL_LEADS_WORKING_THROUGHOUT_RECORDING_DESCRIPTION',
            'IS_EEG_USABLE_FOR_CLINICAL_PURPOSES',
            'EEG_NOT_USABLE_FOR_CLINICAL_PURPOSES_DESCRIPTION',
            'NORMAL_EEG_PATTERN',
            'NOT_NORMAL_EEG_PATTERN_DESCRIPTION',
            'EPILEPTIFORM_DISCHARGES_PRESENT',
            'EPILEPTIFORM_DISCHARGES_PRESENT_DESCRIPTION',
            'EPILEPTIFORM_DISCHARGES_TYPE',
            'EPILEPTIFORM_DISCHARGES_FOCALITY_FRONTAL',
            'EPILEPTIFORM_DISCHARGES_FOCALITY_TEMPORAL',
            'EPILEPTIFORM_DISCHARGES_FOCALITY_PARIETAL',
            'EPILEPTIFORM_DISCHARGES_FOCALITY_PARACENTRAL',
            'EPILEPTIFORM_DISCHARGES_FOCALITY_OCCIPITAL',
            'SLOWING_PRESENT',
            'SLOWING_PRESENT_DESCRIPTION',
            'SLOWING_TYPE',
            'SLOWING_FOCALITY_FRONTAL',
            'SLOWING_FOCALITY_TEMPORAL',
            'SLOWING_FOCALITY_PARIETAL',
            'SLOWING_FOCALITY_PARACENTRAL',
            'SLOWING_FOCALITY_OCCIPITAL',
            'CLASSIFICATION_OF_EPILEPSY_SYNDROME',
            'STAGE_NREM2_SLEEP_ARCHITECTURE_PRESENT',
            'FINAL_CHARACTERIZATION_OF_EEG',
            'RECOMMEND_NO_CHANGE_TO_PATIENT_MANAGEMENT_OR_DIAGNOSIS',
            'RECOMMEND_FURTHER_10_20_EEG',
            'RECOMMEND_NEUROIMAGING',
        ],
    },
    fromCollection (collection, options) {
        options = options || {};
        return _.extend({
            type: String,
            regEx: SimpleSchema.RegEx.Id,
            autoform: {
                options () {
                    const options = collection.find().fetch().map((doc) => {
                        let label = doc._id;
                        switch (collection._name) {
                            case 'users':
                                label = doc.emails[0].address;
                                break;
                            case 'patients':
                                label = 'Patient #' + doc.id;
                                break;
                            case 'tasks':
                                label = doc.name;
                                break;
                            case 'guidelines':
                                label = doc.name;
                                break;
                            case 'instructions':
                                label = '[' + doc.identifier + '] ' + (doc.title || doc.text);
                                break;
                            case 'propositions':
                                label = doc.description;
                                break;
                            case 'data':
                                label = doc.pathAndLengthFormatted();
                                // label = {};
                                break;
                            case 'assignments':
                                label = doc.userNames() + ' - ' + doc.taskDoc().name + ' for ' + doc.dataDoc().path;
                                break;
                            case 'arbitrations':
                                label = doc.arbiterNamesArray().join(' / ') + ' - ' + doc.taskDoc().name + ' for ' + doc.dataDoc().path;
                                break;
                        }
                        return {
                            label: label,
                            value: doc._id,
                        };
                    });
                    options.sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0));
                    return options;
                },
            },
        }, options);
    },
};

Patients = new Meteor.Collection('patients');
Schemas.Patients = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    id: {
        type: String,
        label: 'Patient ID',
    },
    age: {
        type: SimpleSchema.Integer,
        label: 'Age (Years)',
        min: 0,
        optional: true,
    },
    sex: {
        type: String,
        label: 'Sex',
        allowedValues: [
            'Female',
            'Male',
            'Other',
        ],
        optional: true,
    },
    name: {
        type: String,
        label: 'Name',
        optional: true,
    },
    currentAEDs: {
        type: String,
        // AED = anti-epileptic drug
        label: 'Current AEDs',
        optional: true,
    },
    medicationIntakeIsRegular: {
        type: String,
        label: 'Regularly take medication?',
        allowedValues: [
            'Yes',
            'No',
        ],
        optional: true,
    },
});
Patients.helpers({
    anonymizedDescription() {
        const descriptionParts = [];
        if (this.age !== undefined && this.age !== null) {
            descriptionParts.push(this.age + ' Year-old');
        }
        if (this.sex !== undefined && this.sex !== null) {
            descriptionParts.push(this.sex);
        }
        if (descriptionParts.length == 0) {
            descriptionParts.push('Anonymous Patient');
        }
        if (this.id !== undefined && this.id !== 'NaN') {
            descriptionParts.push('(#' + this.id + ')');
        }
        return descriptionParts.join(' ');
    },
    anonymizedDescriptionShort() {
        const descriptionParts = [];
        if (this.age !== undefined && this.age !== null) {
            descriptionParts.push(this.age + 'yo');
        }
        if (this.sex !== undefined && this.sex !== null) {
            descriptionParts.push(this.sex);
        }
        if (descriptionParts.length == 0) {
            descriptionParts.push('Anon. Patient');
        }
        if (this.id !== undefined && this.id !== 'NaN') {
            descriptionParts.push('(#' + this.id + ')');
        }
        return descriptionParts.join(' / ');
    },
});
Patients.attachSchema(Schemas.Patients);
Patients.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Patients.attachCollectionRevisions();
exports.Patients = Patients;

Data = new Meteor.Collection('data');
Schemas.Data = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    name: {
        type: String,
        label: 'Name',
    },
    type: SchemaHelpers.dataType,
    source: SchemaHelpers.dataSource,
    defaultTask: SchemaHelpers.fromCollection(Tasks, {
        optional: true,
    }),
    patient: {
        type: String,
        label: 'Name',
    },
    // SchemaHelpers.fromCollection(Patients, {
    //     optional: true,
    // }),
    path: {
        type: String,
        label: 'Path',
    },
    capturedAt: {
        type: Date,
        label: 'Captured at',
        optional: true,
    },
    metadata: {
        type: Object,
        label: 'Metadata',
        blackbox: true,
        defaultValue: {},
    },
});
Data.helpers({
    lengthInSeconds() {
        if (this.type == 'EDF') {
            return this.metadata.wfdbdesc.LengthInSeconds;
        }
        return undefined;
    },
    lengthFormatted() {
        if (this.type == 'EDF') {
            const lengthInSeconds = this.metadata.wfdbdesc.LengthInSeconds;
            const lengthFormatted = formatDurationInSeconds(lengthInSeconds);
            return lengthFormatted;
        }
        return '';
    },
    pathAndLengthFormatted() {
        const lengthFormatted = this.lengthFormatted();
        let pathEnd = this.path.lastIndexOf("/");
        let pathFormatted = pathEnd === -1 ? this.name : this.path.substring(0, pathEnd + 1) + this.name;
        if (lengthFormatted == '') {
            return pathFormatted;
        }
        console.log(pathFormatted + ' (' + lengthFormatted + ')');
        return pathFormatted + ' (' + lengthFormatted + ')';
    },
    pathLengthAndPatientInfoFormatted() {
        let patientInfo = '';
        const patientDoc = this.patientDoc();
        if (patientDoc !== false) {
            patientInfo = ' Patient: ' + patientDoc.anonymizedDescriptionShort();
        }
        return this.pathAndLengthFormatted() + patientInfo;
    },
    patientDoc() {
        return Patients.findOne(this.patient) || false;
    },
    assignmentsCursor(filter, options) {
        filter = filter || {};
        filter = _.extend({}, filter, { dataFiles: this._id });
        const assignments = Assignments.find(filter, options);
        return assignments;
    },
    assignmentDocs(filter, options) {
        return this.assignmentsCursor(filter, options).fetch();
    },
    numAssignments(filter, options) {
        return this.assignmentsCursor(filter, options).count();
    },
    numAssignmentsPending(filter, options) {
        filter = filter || {};
        filter = _.extend({}, filter, { status: 'Pending' });
        return this.assignmentsCursor(filter, options).count();
    },
    numAssignmentsInProgress(filter, options) {
        filter = filter || {};
        filter = _.extend({}, filter, { status: 'In Progress' });
        return this.assignmentsCursor(filter, options).count();
    },
    numAssignmentsCompleted(filter, options) {
        filter = filter || {};
        filter = _.extend({}, filter, { status: 'Completed' });
        return this.assignmentsCursor(filter, options).count();
    },
    numAssignmentsNotCompleted(filter, options) {
        return this.numAssignments(filter, options) - this.numAssignmentsCompleted(filter, options);
    },
    assigneeDocs(filter, options) {
        const assigneeDocsById = {};
        this.assignmentDocs(filter, options).forEach((assignment) => {
            assignment.userDocs().forEach((userDoc) => {
                assigneeDocsById[userDoc._id] = userDoc;
            });
        });
        const assigneeDocs = Object.values(assigneeDocsById);
        return assigneeDocs;
    },
    assigneeNamesArray(filter, options) {
        return this.assigneeDocs(filter, options).map(u => u.username);
    },
    assigneeNames(filter, options) {
        return this.assigneeNamesArray(filter, options).join(', ');
    },
});
Data.attachSchema(Schemas.Data);
Data.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Data.permit(['insert']);

Data.attachCollectionRevisions();
exports.Data = Data;

Tasks = new Meteor.Collection('tasks');
Schemas.Tasks = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    name: {
        type: String,
        label: 'Name',
    },
    allowedDataTypes: {
        type: Array,
        label: 'Allowed Data Types',
        minCount: 1,
    },
    'allowedDataTypes.$': SchemaHelpers.dataType,
    annotator: SchemaHelpers.annotator,
    annotatorConfig: SchemaHelpers.annotatorConfig,
    guideline: SchemaHelpers.fromCollection(Guidelines, {
        optional: true,
    }),
});
Tasks.helpers({
    isSleepStagingTask() {
        return this.name.indexOf('Sleep') > -1;
    },
    guidelineDoc() {
        if (!this.guideline) return false;
        return Guidelines.findOne(this.guideline) || false;
    },
});
Tasks.attachSchema(Schemas.Tasks);
Tasks.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Tasks.attachCollectionRevisions();
exports.Tasks = Tasks;

Guidelines = new Meteor.Collection('guidelines');
Schemas.Guidelines = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    name: {
        type: String,
        label: 'Name',
    },
    version: {
        type: String,
        label: 'Version',
    },
    url: {
        type: String,
        label: 'URL',
        optional: true,
    },
    instructions: {
        type: Array,
        label: 'Instructions',
        minCount: 0,
        defaultValue: [],
    },
    'instructions.$': SchemaHelpers.fromCollection(Instructions),
});
Guidelines.helpers({
    nameAndVersion() {
        return this.name + ' (v' + this.version +')';
    },
    instructionDocs() {
        return this.instructions.map(i => Instructions.findOne(i));
    },
});
Guidelines.attachSchema(Schemas.Guidelines);
Guidelines.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Guidelines.attachCollectionRevisions();
exports.Guidelines = Guidelines;

Instructions = new Meteor.Collection('instructions');
Schemas.Instructions = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    guideline: SchemaHelpers.fromCollection(Guidelines),
    identifier: {
        type: String,
        label: 'Identifier',
        optional: true,
    },
    title: {
        type: String,
        label: 'Title',
        optional: true,
    },
    text: {
        type: String,
        label: 'Text',
    },
    autoCompleteText: {
        type: String,
        autoValue: function() {
            let autoCompleteText = '';
            if (this.field('identifier').isSet) {
                const identifier = this.field('identifier').value;
                autoCompleteText = identifier;
                autoCompleteText += ' ' + identifier.split('.').join('');
            }
            if (this.field('title').isSet) {
                autoCompleteText += ' ' + this.field('title').value;
            }
            if (this.field('actions').isSet) {
                this.field('actions').value.forEach((p) => {
                    const action = Propositions.findOne(p);
                    autoCompleteText += ' ' + action.descriptionCapitalized();
                });
            }
            autoCompleteText += ' ' + this.field('text').value;
            return autoCompleteText;
        },
        label: 'Autocomplete Text',
    },
    page: {
        type: SimpleSchema.Integer,
        label: 'Page',
        min: 1,
        optional: true,
    },
    indentation: {
        type: SimpleSchema.Integer,
        label: 'Indentation Level',
        min: 0,
        defaultValue: 0,
    },
    conditions: {
        type: Array,
        label: 'Conditions',
    },
    'conditions.$': SchemaHelpers.fromCollection(Propositions),
    actions: {
        type: Array,
        label: 'Actions',
    },
    'actions.$': SchemaHelpers.fromCollection(Propositions),
});
Instructions.helpers({
    guidelineDoc() {
        return Guidelines.findOne(this.guideline) || false;
    },
    url() {
        const guidelineDoc = this.guidelineDoc();
        if (!guidelineDoc) return false;
        let url = guidelineDoc.url;
        if (this.page >= 1) {
            url += '#page=' + this.page;
        }
        return url;
    },
    conditionDocs() {
        return this.conditions.map(propositionId => Propositions.findOne(propositionId));
    },
    conditionDescriptionsCapitalized() {
        return this.conditionDocs().map(p => p.descriptionCapitalized()).join(', ');
    },
    numConditions() {
        return this.conditions.length;
    },
    hasMultipleConditions() {
        return this.numConditions() > 1;
    },
    actionDocs() {
        return this.actions.map(propositionId => Propositions.findOne(propositionId));
    },
    actionDescriptionsCapitalized() {
        return this.actionDocs().map(p => p.descriptionCapitalized()).join(', ');
    },
});
Instructions.attachSchema(Schemas.Instructions);
Instructions.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Instructions.attachCollectionRevisions();
exports.Instructions = Instructions;

Propositions = new Meteor.Collection('propositions');
Schemas.Propositions = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    description: {
        type: String,
        label: 'Description',
    },
    predicate: {
        type: String,
        label: 'Predicate',
        allowedValues: [
            'ANNOTATION_FIELD_SHOULD_BE_SET_TO_VALUE',
            'EVIDENCE_IS_PRESENT',
        ],
    },
    placeholders: {
        type: Object,
        label: 'Placeholders',
        blackbox: true,
    },
    negated: {
        type: Boolean,
        label: 'Is Negated?',
        defaultValue: false,
    },
});
Propositions.helpers({
    descriptionCapitalized() {
        return this.description[0].toUpperCase() + this.description.substr(1);;
    },
});
Propositions.attachSchema(Schemas.Propositions);
Propositions.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Propositions.attachCollectionRevisions();
exports.Propositions = Propositions;



Assignments = new Meteor.Collection('assignments');
Schemas.Assignments = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    users: {
        type: Array,
        label: 'Users',
        minCount: 1,
    },
    'users.$': SchemaHelpers.fromCollection(Meteor.users),
    task: SchemaHelpers.fromCollection(Tasks, {
        optional: true,
    }),
    dataFiles: {
        type: Array,
        label: 'Data file',
        minCount: 0,
        optional: true,
    },
    'dataFiles.$': SchemaHelpers.fromCollection(Data),
    name: {
        type: String,
        label: 'Name',
        optional: true,
    },
    messageToDisplayBeforeStart: {
        type: String,
        label: 'Message to Display before Start',
        optional: true,
    },
    status: {
        type: String,
        label: 'Status',
        allowedValues: [
            'Pending',
            'In Progress',
            'Review',
            'Completed',
        ],
        defaultValue: 'Pending',
    },
    canBeReopenedAfterCompleting: {
        type: Boolean,
        label: 'Can be Re-opened after Completing',
        defaultValue: true,
    },
    annotationsImported: {
        type: Boolean,
        label: 'Annotations Imported',
        defaultValue: false,
    },
    isHidden: {
        type: Boolean,
        label: 'Is Hidden',
        defaultValue: false,
        optional: true,
    },
    childAssignments: {
        type: Array,
        label: 'Child Assignments',
        minCount: 0,
        optional: true,
    },
    'childAssignments.$': SchemaHelpers.fromCollection(Assignments),
    notificationsDisabledForAssignees: {
        type: Boolean,
        label: 'Notifications Disabled for Assignees',
        defaultValue: false,
    },
    remindersDisabled: {
        type: Boolean,
        label: 'Reminders Disabled',
        defaultValue: false,
    },
    notificationsDisabledForAdmins: {
        type: Boolean,
        label: 'Notifications Disabled for Admins',
        defaultValue: false,
    },
    timeLimitInSeconds: {
        type: Number,
        label: 'Time Limit [Seconds]',
        optional: true,
    },
    timeLeftInSeconds: {
        type: Number,
        label: 'Time Left [Seconds]',
        optional: true,
    },
    arbitration: SchemaHelpers.fromCollection(Arbitrations, {
        optional: true,
    }),
    reviewer: SchemaHelpers.fromCollection(Meteor.users, {
        optional: true,
    }),
    reviewing: SchemaHelpers.fromCollection(Meteor.users, {
        optional: true,
    }),
    feedback: {
        type: String,
        optional: true,
        defaultValue: "No Feedback"
    },
    arbitrationRoundNumber: {
        type: SimpleSchema.Integer,
        label: 'Arbitration Round Number',
        min: 0,
        optional: true,
    },
});
ensureIndicesForCollection(Assignments, ['task', 'data', 'status', 'arbitration']);
Assignments.helpers({
  numDaysSinceLastModifed() {
    return moment().diff(moment(this.lastModified), 'days');
  },
  taskDoc() {
    return Tasks.findOne(this.task) || false;
  },
  taskName() {
    const task = this.taskDoc();
    if (!task) return 'Loading ...';
    return task.name;
  },
  dataDoc() {
    // only return the first data in dataFiles
    let queryArray = this.dataFiles.map((dataId) => { return { _id: dataId }; });
    return Data.findOne({ $or: queryArray }) || false;
  },
  dataDocs() {
    let queryArray = this.dataFiles.map((dataId) => { return { _id: dataId }; });
    // console.log(queryArray);
    // console.log((Data.find({ $or: queryArray }) || false).fetch());
    var data = (Data.find({ $or: queryArray }) || false).fetch();
    if(data[0]){
        var firstDoc = data[0]._id;
        if(firstDoc != queryArray[0]){
            return (Data.find({ $or: queryArray }, {sort: { "_id": -1}}) || false);
        }
    }
    return Data.find({ $or: queryArray }) || false;
  },
  patientDoc() {
    // only return the patient of the first data in dataFiles
    const data = this.dataDocs().fetch();
    //console.log(data);
    if (!data.length) return false;
    return data.map(data => data.patientDoc());
  },
  nameOrAnonymizedPatientDescription() {
    if (this.name) return this.name;
    const patientDocs = this.patientDoc();
    if (!patientDocs.length) return 'Loading ...';
    let patientDocDescriptions = patientDocs.map(patientDoc => patientDoc.anonymizedDescription());
    return patientDocDescriptions.join(' + ');
  },
  nameOrAnonymizedPatientDescriptionWithAdjudicationInformation() {
    let description = this.nameOrAnonymizedPatientDescription();
    if (this.arbitration) {
      description += ' [Adjudicate Disagreements]';
    }
    //console.log(this);
    // here if we are reviewing someoes work, attach the annotators name to the file name
    if(this.reviewing != undefined){
        user = Meteor.users.findOne(this.reviewing);
        description = user.username + " - " + description;
    }
    return description;
  },
  arbitrationDoc() {
    if (!this.arbitration) return false;
    return Arbitrations.findOne(this.arbitration) || false;
  },
  annotationDocs(filter, options) {
    filter = filter || {};
    filter = _.extend({}, filter, { assignment: this._id });
    options = options || {};
    options.fields = options.fields || {};
    options.fields = _.extend({}, options.fields, { _id: 1 });
    const cursor = Annotations.find(filter, options);
    const docs = cursor.fetch();
    return docs;
  },
  annotationCount(filter, options) {
    return this.annotationDocs(filter, options).length;
  },
  patientId() {
    const patients = this.patientDoc();
    if (!patients.length) return 'Loading ...';
    return patients.map(patient => patient.id).join('\n');
  },
  dataPath() {
    const data = this.dataDocs().fetch();
    if (!data) return 'Loading ...';
    return data.map((data) => data.path).join('\n');
  },
  dataIds() {
    return this.dataFiles;
  },
  dataLengthInSeconds() {
    const data = this.dataDocs().fetch();
    if (!data.length) return 'Loading ...';
    return Math.max(...data.map(data => data.lengthInSeconds()));
  },
  dataLengthFormatted() {
    const data = this.dataDocs().fetch();
    if (!data.length) return 'Loading ...';
    let dataLength = data.map(data => data.lengthInSeconds());
    let i = dataLength.indexOf(Math.max(...dataLength));
    return data[i].lengthFormatted();
  },
  userDocs() {
    return Meteor.users.find({ _id: { $in: this.users } } ).fetch();
  },
  userNamesArray() {
    const userNames = Meteor.users.find({ _id: { $in: this.users } }, { username: 1 }).fetch().map(u => u.username);
    if (userNames.length < this.users.length) return false;
    return userNames;
  },
  userNames() {
    const userNames = this.userNamesArray();
    if (!userNames) return 'Loading ...';
    return userNames.join(', ');
  },
  url() {
    return Router.routes['assignment'].url({ _id: this._id });
  },
  isSleepStagingTask() {
    const task = this.taskDoc();
    if (!task) return 'Loading ...';
    return task.isSleepStagingTask();
  },
  childAssignmentDocs(options) {
    if (
            !this.childAssignments
        ||  !this.childAssignments.length
    ) {
        return [];
    }
    return this.childAssignments.map(assignmentId => Assignments.findOne(assignmentId, options));
  },
  hasParentAssignment() {
    return Assignments.find({ childAssignments: this._id }).count() > 0;
  },
  parentAssignment(options) {
    return Assignments.findOne({ childAssignments: this._id }, options);
  },
  allParentAssignments(options) {
    const allParentAssignments = [];
    let parentAssignment = this.parentAssignment(options);
    while (parentAssignment) {
        allParentAssignments.push(parentAssignment);
        parentAssignment = parentAssignment.parentAssignment(options);
    }
    return allParentAssignments;
  },
  rootAssignment(options) {
    const allParentAssignments = this.allParentAssignments(options);
    if (allParentAssignments.length == 0) return;
    return allParentAssignments[allParentAssignments.length - 1];
  },
  isLeafAssignment() {
    return (
            this.task
        &&  this.dataFiles.length
        &&  (
                !this.childAssignments
            ||  !this.childAssignments.length
        )
    );
  },
  allLeafAssignments(options) {
    if (this.isLeafAssignment()) return [ this ];
    let childLeafAssignments = this.childAssignmentDocs(options).map(c => c.allLeafAssignments(options));
    childLeafAssignments = [].concat.apply([], childLeafAssignments);
    return childLeafAssignments;
  },
  activeLeafAssignment(options) {
    const allLeafAssignments = this.allLeafAssignments(options);
    const allLeafAssignmentsNotCompleted = allLeafAssignments.filter(a => a.status != 'Completed');
    if (allLeafAssignmentsNotCompleted.length > 0) {
        return allLeafAssignmentsNotCompleted[0];
    }
    return allLeafAssignments[allLeafAssignments.length -1];
  },
  hasSubsequentLeafAssignment() {
    const rootAssignment = this.rootAssignment();
    if (!rootAssignment) return false;
    const allLeafAssignments = rootAssignment.allLeafAssignments();
    const allLeafAssignmentIds = allLeafAssignments.map(a => a._id);
    const currentAssignmentIndex = allLeafAssignmentIds.indexOf(this._id);
    if (currentAssignmentIndex < 0) return false;
    if (currentAssignmentIndex >= allLeafAssignments.length - 1) return false;
    return true;
  },
  annotationsForProgressCalculation(filter, options) {
    filter = filter || {};
    options = options || {};
    options.fields = options.fields || {};
    if (this.isSleepStagingTask()) {
        options.fields = _.extend({}, options.fields, { 'value.position.start': 1 });
        filter = _.extend({}, filter, {
            type: 'SIGNAL_ANNOTATION',
            'value.label': { $in: [
                'sleep_stage_wake',
                'sleep_stage_n1',
                'sleep_stage_n2',
                'sleep_stage_n3',
                'sleep_stage_rem',
                'sleep_stage_unknown',
            ] },
        });
    }
    return this.annotationDocs(filter, options);
  },
  annotationsForAgreementComparison(filter, options) {
    return this.annotationsForProgressCalculation(filter, options);
  },
  annotationsForAgreementComparisonDict(filter, options) {
    options = _.clone(options) || {};
    options.fields = options.fields || {};
    let fieldsRequired = { 'type': 1, 'value': 1 };
    if (this.isSleepStagingTask()) {
        fieldsRequired = { 'type': 1, 'value.position.start': 1, 'value.position.end': 1, 'value.label': 1 };
    }
    options.fields = _.extend({}, options.fields, fieldsRequired);
    Object.keys(options.fields).forEach((key) => {
        if (!key.startsWith('revisions.')) {
            options.fields['revisions.' + key] = 1;
        }
    });
    const annotations = this.annotationsForAgreementComparison(filter, options);
    const annotationsDict = {};
    annotations.forEach((annotation) => {
        let key, value;
        if (this.isSleepStagingTask()) {
            const position = annotation.value.position;
            key = annotation.type + '_start_' + position.start  + '_end_' + position.end;
            value = annotation.value.label;
        }
        else {
            key = annotation.type;
            value = annotation.value;
        }
        annotationsDict[key] = {
            comparisonValue: value,
            annotation: annotation,
        };
    });
    return annotationsDict;
  },
  progressOnIndependentAnnotation(options) {
    const task = this.taskDoc();
    if (!task) return false;
    if (this.isSleepStagingTask()) {
        const dataLengthInSeconds = this.dataLengthInSeconds();
        const epochLengthInSeconds = task.annotatorConfig.windowSizeInSeconds;
        const annotations = this.annotationsForProgressCalculation({}, options);
        const annotationsCompletedStartTimes = new Set(annotations.map(a => a.value.position.start));
        const numStepsCompleted = annotationsCompletedStartTimes.size;
        const numStepsRequired = Math.ceil(dataLengthInSeconds / epochLengthInSeconds);
        return convertNumStepsRequiredAndCompletedIntoProgressObject(numStepsRequired, numStepsCompleted);
    }
    return convertNumStepsRequiredAndCompletedIntoProgressObject(0, 0);
  },
  missingAnnotations(options) {
    const task = this.taskDoc();
    if (!task) return 'Loading ...';
    if (this.isSleepStagingTask()) {
        const dataLengthInSeconds = this.dataLengthInSeconds();
        const epochLengthInSeconds = task.annotatorConfig.windowSizeInSeconds;
        const annotations = this.annotationsForProgressCalculation({}, options);
        const annotationsCompletedStartTimes = new Set(annotations.map(a => a.value.position.start));
        const annotationsRequiredStartTimes = range(0, dataLengthInSeconds, epochLengthInSeconds);
        const annotationsMissingStartTimes = annotationsRequiredStartTimes.filter(a => !annotationsCompletedStartTimes.has(a));
        return annotationsMissingStartTimes.map((startTimeInSeconds) => {
            return {
                type: 'Sleep Stage Label',
                startTimeInSeconds: startTimeInSeconds,
                startTimeFormatted: formatDurationInSeconds(startTimeInSeconds),
            }
        });
    }
    return [];
  },
  annotationsWithDisagreementForCurrentArbitrationRound(options) {
    const task = this.taskDoc();
    if (!task) return false;
    options = options || {};
    if (this.isSleepStagingTask()) {
        const arbitrationDoc = this.arbitrationDoc();
        if (!arbitrationDoc) return false;
        arbitrationRoundNumber = !!this.arbitrationRoundNumber ? this.arbitrationRoundNumber : 0;
        options = _.extend({}, options, { fields: { assignment: 1, arbitration: 1, arbitrationRoundNumber: 1 } });
        const aggregatedAnnotations = arbitrationDoc.aggregatedAnnotations({}, options, arbitrationRoundNumber - 1);
        const annotationsWithDisagreement = aggregatedAnnotations.complete.withDisagreement;
        const annotationsWithDisagreementReclassified = {};
        const annotationsWithDisagreementNotReclassified = {};
        Object.keys(annotationsWithDisagreement).forEach((key) => {
            const values = annotationsWithDisagreement[key];
            const reclassified = values.some((value) => {
                const annotation = value.annotation;
                return (
                    annotation.assignment == this._id
                    && annotation.arbitration == this.arbitration
                    && !!annotation.arbitrationRoundNumber
                    && annotation.arbitrationRoundNumber == this.arbitrationRoundNumber
                );
            });
            if (reclassified) {
                annotationsWithDisagreementReclassified[key] = values;
            }
            else {
                annotationsWithDisagreementNotReclassified[key] = values;
            }
        });
        return {
            all: annotationsWithDisagreement,
            reclassified: annotationsWithDisagreementReclassified,
            notReclassified: annotationsWithDisagreementNotReclassified,
        };
    }
    return false;
  },
  progressOnCurrentArbitrationRound(options) {
    const annotationsWithDisagreement = this.annotationsWithDisagreementForCurrentArbitrationRound(options);
    if (annotationsWithDisagreement === false) {
        return convertNumStepsRequiredAndCompletedIntoProgressObject(0, 0);
    }
    const numStepsRequired = Object.keys(annotationsWithDisagreement.all).length
    const numStepsCompleted = Object.keys(annotationsWithDisagreement.reclassified).length;
    return convertNumStepsRequiredAndCompletedIntoProgressObject(numStepsRequired, numStepsCompleted);
  },
  progress(options) {
    if (this.arbitration && !!this.arbitrationRoundNumber) {
        return this.progressOnCurrentArbitrationRound(options);
    }
    return this.progressOnIndependentAnnotation(options);
  },
  isIndependentAnnotationComplete() {
    return this.progressOnIndependentAnnotation().asProportion >= 1 && this.status == 'Completed';
  },
  isCurrentArbitrationRoundComplete() {
    return this.progressOnCurrentArbitrationRound().asProportion >= 1 && this.status == 'Completed';
  },
  isMarkedAsCompleted() {
    return this.status == 'Completed';
  },
  isComplete(options) {
    return this.progress(options).asProportion >= 1 && this.isMarkedAsCompleted();
  },
  canBeMarkedAsCompleted(options) {
    const noTimeLeftInTimeLimitedAssignment = this.timeLimitInSeconds > 0 && this.timeLeftInSeconds === 0;
    return noTimeLeftInTimeLimitedAssignment || !this.isSleepStagingTask() || this.progress(options).asProportion >= 1;
  },
  markAsCompleted(callback) {
    if (!this.canBeMarkedAsCompleted()) {
        alert('Assignment cannot yet be marked as completed.');
        return;
    }    
    Assignments.update(this._id, { $set: { status: 'Completed' } }, () => {
        if (!this.hasSubsequentLeafAssignment()) {
            Router.go('home');
        }
    });
    this.allParentAssignments().forEach((parentAssignment) => {
        if (parentAssignment.allLeafAssignments().every(a => a.status == 'Completed')) {
            Assignments.update(parentAssignment._id, { $set: { status: 'Completed' } });
        }
    });
    if (this.hasSubsequentLeafAssignment() && Meteor.isClient) {
        window.location.reload();
    }
  },
  arbitrationsCursor(filter) {
    filter = filter || {};
    return Arbitrations.find(_.extend({}, filter, { assignments: this._id }));
  },
  arbitrationsCount(filter) {
    return this.arbitrationsCursor(filter).count();
  },
  isPartOfArbitration(filter) {
    return this.arbitrationsCount(filter) > 0;
  },
  arbitrationDocs(filter) {
    return this.arbitrationsCursor(filter).fetch();
  },
  blockedForReason() {
    if (this.status == 'Completed' && this.canBeReopenedAfterCompleting === false) {
        return 'can only complete once';
    }
    if (!this.isPartOfArbitration()) {
        return false;
    }
    if (!this.isPartOfArbitration({
        status: { $nin: arbitrationStatusValues['Completed'] }
    })) {
        return 'Adjudication Over';
    }
    if (this.status !== 'Completed') {
        return false;
    }
    return 'Waiting for Adjudication';
  },
  preClassificationAssignmentCursor() {
    const taskDoc = this.taskDoc();
    if (!taskDoc || !taskDoc.annotatorConfig || !taskDoc.annotatorConfig.preClassification || !taskDoc.annotatorConfig.preClassification.source) return;
    const source = taskDoc.annotatorConfig.preClassification.source;
    if (source.userId) {
        return Assignments.find({
            users: source.userId,
            dataFiles: this.dataFiles,
        }, {
            limit: 1,
        });
    }
    console.error('No parseable source set in pre-classification.');
  },
  preClassificationAssignment() {
    let assignments = this.preClassificationAssignmentCursor();
    if (!assignments) return;
    assignments = assignments.fetch();
    if (assignments.length > 0) return assignments[0];
  },
  preClassificationAnnotationsCursor(filter, options) {
    const preClassificationAssignment = this.preClassificationAssignment();
    if (!preClassificationAssignment) return;
    const taskDoc = this.taskDoc();
    if (!taskDoc || !taskDoc.annotatorConfig || !taskDoc.annotatorConfig.preClassification || !taskDoc.annotatorConfig.preClassification.source) return;
    const source = taskDoc.annotatorConfig.preClassification.source;
    options = _.extend({}, options);
    if (source.userId) {
        filter = _.extend({}, {
            user: source.userId,
            assignment: preClassificationAssignment._id,
        }, filter);
        return Annotations.find(filter, options);
    }
    console.error('No parseable source set in pre-classification.');
    return;
  },
  preClassificationAnnotations(filter, options) {
    let annotations = this.preClassificationAnnotationsCursor(filter, options);
    if (!annotations) return;
    return annotations.fetch();
  },
  annotationsForClassificationSummary(filter, options) {
    let defaultOptions = {};
    const isSleepStagingTask = this.taskDoc().isSleepStagingTask();
    if (isSleepStagingTask) {
        defaultOptions = {
            sort: { 'value.position.start': 1 },
            fields: {
                'user': 1,
                'type': 1,
                'value.label': 1,
                'value.position.start': 1,
                'value.position.end': 1,
                'value.confidence': 1,
                'value.metadata.prediction': 1,
            },
        };
    }
    options = _.extend({}, defaultOptions, options);
    const preClassificationAnnotations = this.preClassificationAnnotations(filter, options);
    if (!preClassificationAnnotations) return;

    function getAnnotationKey(annotation) {
        if (annotation.isSleepStageAnnotation()) {
            const position = annotation.value.position;
            return annotation.type + '_start_' + position.start  + '_end_' + position.end;
        }
        return annotation.type;
    }
    const ownAnnotationsDict = {};
    const ownAnnotations = this.annotationsForProgressCalculation(filter, options);
    ownAnnotations.forEach(a => ownAnnotationsDict[getAnnotationKey(a)] = a);
    preClassificationAnnotations.forEach((a) => a.ownAnnotation = ownAnnotationsDict[getAnnotationKey(a)]);
    return preClassificationAnnotations;
  },
});
function notifyAssignees(assignment, senderId, isReminder) {
    const isArbitrationPass = assignment.arbitration && assignment.arbitrationRoundNumber > 0;
    const assignees = assignment.userDocs();
    const sender = Meteor.users.findOne(senderId);
    const buttonUrl = assignment.url();
    assignees.forEach((assignee) => {
        const to = [
            assignee.emails[0].address,
        ];
        if (sender && sender.emails[0] && sender.emails[0].address) {
            to.push(sender.emails[0].address)
        }
        let salutation = 'Hi';
        if (assignee.username) {
            salutation += ' ' + assignee.username;
        }
        salutation += ', ';
        let subject;
        let message;
        let buttonText;
        if (isArbitrationPass) {
            if (isReminder) {
                subject = 'Reminder';
                message = 'This is a friendly reminder that you are currently assigned to an unfinished adjudication pass. Please click the button below to complete the pass at your earliest convenience.';
                buttonText = 'Adjudicate Now';
            }
            else {
                subject = 'New adjudication pass!';
                message = 'We have a new adjudication pass ready for you.<br>Click the button below to get started.';
                buttonText = 'Start Adjudicating Now';
            }
        }
        else {
            if (isReminder) {
                subject = 'Reminder';
                message = 'This is a friendly reminder that you are currently assigned to an unfinished reading task. Please click the button below to complete the task at your earliest convenience.';
                buttonText = 'Open Task Now';                
            }
            else {
                subject = 'New task!';
                message = 'We have a new reading task for you.<br>Click the button below to get started.';
                buttonText = 'Start Task Now';
            }
        }
        message = salutation + '<br>' + message;
        if (Meteor.isServer) {
            sendEmail('call-to-action', { to, subject, message, buttonText, buttonUrl });
        }
        else {
            Meteor.call('sendEmail', 'call-to-action', { to, subject, message, buttonText, buttonUrl });
        }
    });
}
function notifyAdminsOfAssignmentStatus(assignment) {
    const isArbitrationPass = assignment.arbitration && assignment.arbitrationRoundNumber > 0;
    let subject;
    let message;
    if (isArbitrationPass) {
        subject = 'Adjudication';
        message = 'An adjudication pass';
    }
    else {
        subject = 'Task';
        message = 'A task';
    }
    const status = assignment.status;
    const userNames = assignment.userNames();
    subject += ' ' + status + ' (' + userNames + ')';
    message += ' has been marked as <b>' + status + '</b> by <b>' + userNames + '</b>.<br>Click the button below to initiate next steps.';
    const buttonText = 'Adjudication Dashboard';
    const buttonUrl = Router.routes['arbitrations'].url();
    if (Meteor.isServer) {
        sendEmail('call-to-action', { subject, message, buttonText, buttonUrl });
    }
    else {
        Meteor.call('sendEmail', 'call-to-action', { subject, message, buttonText, buttonUrl });
    }
}
function onAssignmentInsertOrUpdate(senderId, assignment) {
    if (!Meteor.isServer) return;
    let isInsert;
    let wasPreviouslyCompleted;
    const isNowCompleted = assignment.status === 'Completed';
    if (this.previous) {
        isInsert = false;
        wasPreviouslyCompleted = this.previous.status === 'Completed';
    }
    else {
        isInsert = true;
        wasPreviouslyCompleted = false;
    }
    assignment = Assignments.findOne(assignment._id);
    const shouldNotifyAssignees = (isInsert || wasPreviouslyCompleted) && !isNowCompleted;
    if (shouldNotifyAssignees) {
        const isReminder = false;
        if (!assignment.notificationsDisabledForAssignees) {
            notifyAssignees(assignment, senderId, isReminder);
        }
    }
    const shouldNotifyAdmins = !isInsert && !wasPreviouslyCompleted && isNowCompleted;
    if (shouldNotifyAdmins) {
        if (!assignment.notificationsDisabledForAdmins) {
            notifyAdminsOfAssignmentStatus(assignment);
        }
    }
};
Assignments.after.insert(onAssignmentInsertOrUpdate);
Assignments.after.update(onAssignmentInsertOrUpdate);
Assignments.attachSchema(Schemas.Assignments);
Assignments.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Assignments.permit(['update']).ifNotTester().ifAssigned().allowInClientCode();
Assignments.attachCollectionRevisions();
exports.Assignments = Assignments;

Annotations = new Meteor.Collection('annotations');
Schemas.Annotations = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    assignment: SchemaHelpers.fromCollection(Assignments),
    user: SchemaHelpers.fromCollection(Meteor.users),
    dataFiles: {
        type: Array,
        label: 'Data file',
        minCount: 1
    },
    'dataFiles.$': SchemaHelpers.fromCollection(Data),
    type: SchemaHelpers.annotationType,
    value: {
        type: Match.OneOf(Boolean, Number, String, Object),
        label: 'Value',
        blackbox: true,
        optional: true,
    },
    arbitration: SchemaHelpers.fromCollection(Arbitrations, {
        optional: true,
    }),
    arbitrationRoundNumber: {
        type: SimpleSchema.Integer,
        label: 'Arbitration Round Number',
        min: 0,
        optional: true,
    },
    rationale: {
        type: Match.OneOf(Boolean, Number, String, Object),
        label: 'Rationale',
        blackbox: true,
        optional: true,
    },
});
ensureIndicesForCollection(Annotations, ['assignment', 'user', 'arbitration', 'type']);
Annotations.helpers({
    userDoc() {
        return Accounts.users.findOne(this.user);
    },
    isOwn() {
        try {
            return this.user == Meteor.userId();
        }
        catch (error) {
            return false;
        }
    },
    assignmentDoc() {
        return Assignments.findOne(this.assignment) || false;
    },
    arbitrationDoc() {
        const assignmentDoc = this.assignmentDoc();
        if (!assignmentDoc) return false;
        return assignmentDoc.arbitrationDoc();
    },
    arbiterPseudonym() {
        const arbitrationDoc = this.arbitrationDoc();
        if (!arbitrationDoc) return 'Unknown';
        let pseudonym = arbitrationDoc.arbiterPseudonymForAssignment(this.assignment);
        if (this.isOwn()) {
            pseudonym += ' (You)';
        }
        return pseudonym;
    },
    allRevisions() {
        const revisions = this.revisions || [];
        revisions.unshift(this);
        revisions.forEach((r) => {
            if (!r._id) {
                r._id = this._id;
            }
            r._helpers = this;
        });
        return revisions;
    },
    revisionsFiltered(revisionsPolicy) {
        let revisionsFiltered = [this];
        switch (revisionsPolicy) {
            case 'latestPerArbitrationRound':
                let currentArbitrationRoundNumber = parseInt(this.arbitrationRoundNumber) || 0;
                if (this.revisions) {
                    revisionsFiltered = revisionsFiltered.concat(this.revisions.filter((r) => {
                        revisionArbitrationRoundNumber = parseInt(r.arbitrationRoundNumber) || 0;
                        if (revisionArbitrationRoundNumber >= currentArbitrationRoundNumber) return false;
                        currentArbitrationRoundNumber = revisionArbitrationRoundNumber;
                        return true;
                    }));
                }
                break;
            case 'all':
                if (this.revisions) {
                    revisionsFiltered = revisionsFiltered.concat(this.revisions);
                }
                break;
            case 'latest':
            default:
                break;
        }
        return revisionsFiltered;
    },
    isSleepStageAnnotation() {
        const sleepStageLabels = [
            'sleep_stage_wake',
            'sleep_stage_n1',
            'sleep_stage_n2',
            'sleep_stage_n3',
            'sleep_stage_rem',
            'sleep_stage_unknown',
        ];
        return sleepStageLabels.indexOf(this.value.label) > -1;
    },
    valueHumanReadable() {
        if (this.isSleepStageAnnotation()) {
            const mappingFromSleepStageLabelToHumanReadable = {
                'sleep_stage_wake': 'Wake',
                'sleep_stage_n1': 'N1',
                'sleep_stage_n2': 'N2',
                'sleep_stage_n3': 'N3',
                'sleep_stage_rem': 'REM',
            };
            return mappingFromSleepStageLabelToHumanReadable[this.value.label];
        }
        if (this.value.label) {
            return this.value.label;
        }
        return this.value;
    },
    opinionsOnPossibleLabels() {
        if (this.isSleepStageAnnotation()) {
            const metadata = this.value.metadata || {};
            const prediction = metadata.prediction || {};
            const classProbabilitiesAverage = prediction.classProbabilitiesAverage;
            const labelsDict = {
                'sleep_stage_wake': {
                    value: 'sleep_stage_wake',
                    valueHumanReadable: 'Wake',
                    isDecision: false,
                    decisionProbability: classProbabilitiesAverage ? classProbabilitiesAverage[0] : 0,
                },
                'sleep_stage_rem': {
                    value: 'sleep_stage_rem',
                    valueHumanReadable: 'REM',
                    isDecision: false,
                    decisionProbability: classProbabilitiesAverage ? classProbabilitiesAverage[4] : 0,
                },
                'sleep_stage_n1': {
                    value: 'sleep_stage_n1',
                    valueHumanReadable: 'N1',
                    isDecision: false,
                    decisionProbability: classProbabilitiesAverage ? classProbabilitiesAverage[1] : 0,
                },
                'sleep_stage_n2': {
                    value: 'sleep_stage_n2',
                    valueHumanReadable: 'N2',
                    isDecision: false,
                    decisionProbability: classProbabilitiesAverage ? classProbabilitiesAverage[2] : 0,
                },
                'sleep_stage_n3': {
                    value: 'sleep_stage_n3',
                    valueHumanReadable: 'N3',
                    isDecision: false,
                    decisionProbability: classProbabilitiesAverage ? classProbabilitiesAverage[3] : 0,
                },
            };
            const decisionLabel = labelsDict[this.value.label];
            decisionLabel.isDecision = true;
            if (!classProbabilitiesAverage) {
                decisionLabel.decisionProbability = 1;
            }
            if (this.ownAnnotation) {
                const ownAnnotationLabel = labelsDict[this.ownAnnotation.value.label];
                ownAnnotationLabel.isOwnDecision = true;
                ownAnnotationLabel.ownDecisionProbability = this.ownAnnotation.value.confidence;
            };
            Object.keys(labelsDict).forEach((key) => {
                const label = labelsDict[key];
                if (label.decisionProbability !== undefined) {
                    label.decisionPercentage = label.decisionProbability * 100;
                    label.decisionProbability = parseFloat(label.decisionProbability.toFixed(4));
                    label.decisionPercentage = parseFloat(label.decisionPercentage.toFixed(1));
                }
                if (label.ownDecisionProbability !== undefined) {
                    label.ownDecisionPercentage = label.ownDecisionProbability * 100;
                    label.ownDecisionProbability = parseFloat(label.ownDecisionProbability.toFixed(4));
                    label.ownDecisionPercentage = parseFloat(label.ownDecisionPercentage.toFixed(1));
                }
            });
            return [
                labelsDict['sleep_stage_wake'],
                labelsDict['sleep_stage_rem'],
                labelsDict['sleep_stage_n1'],
                labelsDict['sleep_stage_n2'],
                labelsDict['sleep_stage_n3'],
            ];
        }
        else {
            console.error('Annotations.opinionsOnPossibleLabels() is only implemented for sleep stage labels so far.');
        }
    },
    explanationForClassificationSummary(guidelineInstructionsNoiseProbability) {
        const metadata = this.value.metadata || {};
        const prediction = metadata.prediction || {};

        function byDecisionProbability(a, b) {
            return b.decisionProbability - a.decisionProbability;
        }

        const opinionsOnPossibleLabels = this.opinionsOnPossibleLabels();
        opinionsOnPossibleLabels.sort(byDecisionProbability);

        const hasOwnAnnotation = !this.ownAnnotation;
        let hasMultipleConflictingGuidelineInstructions = false;

        if (prediction && prediction.referenceStandardArbitrationId) {
            const arbitration = Arbitrations.findOne(prediction.referenceStandardArbitrationId);
            const uniqueArbitrationOpinionsWithGuidelineInstructionsForCase = arbitration.uniqueOpinionsWithGuidelineInstructionsForCase({
                'value.position.start': this.value.position.start,
                'value.position.end': this.value.position.end,
            });

            opinionsOnPossibleLabels.forEach((label) => {
                const guidelineInstructions = uniqueArbitrationOpinionsWithGuidelineInstructionsForCase[label.value] || [];
                label.guidelineInstruction = undefined;
                if (guidelineInstructions.length > 0) {
                    label.guidelineInstruction = guidelineInstructions[0];
                }
                if (label.guidelineInstruction && guidelineInstructionsNoiseProbability > 0) {
                    const randomSeed = JSON.stringify(this + label.guidelineInstruction._id);
                    const randomNumberGegerator = seedrandom(randomSeed);
                    const randomNumber = randomNumberGegerator();
                    const addNoise = randomNumber < guidelineInstructionsNoiseProbability;
                    if (addNoise) {
                        const instructionIdsToAvoid = guidelineInstructions.map(i => i._id);
                        const fakeInstructions = Instructions.find({
                            _id: { $nin: instructionIdsToAvoid },
                            actions: label.guidelineInstruction.actions,
                        }).fetch();
                        if (fakeInstructions.length > 0) {
                            const fakeInstructionIndex = Math.abs(randomNumberGegerator.int32()) % fakeInstructions.length;
                            const fakeInstruction = fakeInstructions[fakeInstructionIndex];
                            label.guidelineInstruction = fakeInstruction;
                        }
                    }
                }
            });
            hasMultipleConflictingGuidelineInstructions = Object.keys(uniqueArbitrationOpinionsWithGuidelineInstructionsForCase).length > 1;
        }

        return {
            hasOwnAnnotation: hasOwnAnnotation,
            hasMultipleConflictingGuidelineInstructions: hasMultipleConflictingGuidelineInstructions,
            labels: opinionsOnPossibleLabels,
        };
    },
});
Annotations.attachSchema(Schemas.Annotations);
Annotations.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Annotations.permit(['insert', 'update', 'remove']).ifForOwnAssignment().allowInClientCode();
Annotations.attachCollectionRevisions(CollectionRevisions.Annotations);
exports.Annotations = Annotations;

PreferencesFiles = new Meteor.Collection('preferencesFiles');
Schemas.PreferencesFiles = new SimpleSchema({
    name: {
    type: String,
    label: 'Name',
    },
    annotatorConfig: SchemaHelpers.annotatorConfig,
});
PreferencesFiles.attachSchema(Schemas.PreferencesFiles);
PreferencesFiles.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
PreferencesFiles.attachCollectionRevisions();
exports.PreferencesFiles = PreferencesFiles;

AlignmentFiles = new Meteor.Collection('alignmentFiles');
Schemas.AlignmentFiles = new SimpleSchema({
    filename: {
    type: String,
    label: 'filename',
    },
    file1: {
        type: String,
        label: "File 1"
    },
    file2: {
        type: String,
        label: "File 2"
    },
    // has to be a string or else it breaks (always get a must be integer error for some reason)
    lag: {
        type: String,
        label: "Lag"
    }
});
AlignmentFiles.attachSchema(Schemas.AlignmentFiles);
AlignmentFiles.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
AlignmentFiles.attachCollectionRevisions();
exports.AlignmentFiles = AlignmentFiles;

AnnotationFiles = new Meteor.Collection('annotationsFiles');
Schemas.AnnotationFiles = new SimpleSchema({
    filename: {
    type: String,
    label: 'filename',
    },
    // Need this to be a string because the JSON component at the top of the CSV file is not properly formatted into a JSON
    info: {
        type: String,
        label: 'CSV Annotation Info'
    },
    annotations: SchemaHelpers.csvAnnotations,

});
AnnotationFiles.attachSchema(Schemas.AnnotationFiles);
AnnotationFiles.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
AnnotationFiles.attachCollectionRevisions();
exports.AnnotationFiles = AnnotationFiles;


Preferences = new Meteor.Collection('preferences');
Schemas.Preferences = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    assignment: SchemaHelpers.fromCollection(Assignments),
    user: SchemaHelpers.fromCollection(Meteor.users),
    dataFiles: {
        type: Array,
        label: 'Data file',
        minCount: 1
    },
    'dataFiles.$': SchemaHelpers.fromCollection(Data),
    annotatorConfig: SchemaHelpers.annotatorConfig,
    arbitration: SchemaHelpers.fromCollection(Arbitrations, {
        optional: true,
    }),
    arbitrationRoundNumber: {
        type: SimpleSchema.Integer,
        label: 'Arbitration Round Number',
        min: 0,
        optional: true,
    },
});
ensureIndicesForCollection(Preferences, ['assignment', 'user', 'data', 'arbitration']);
Preferences.attachSchema(Schemas.Preferences);
Preferences.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Preferences.permit(['insert', 'update']).ifForOwnAssignment().allowInClientCode();
Preferences.permit(['update', 'remove']).ifNotTester().ifForOwnAssignment().allowInClientCode();
Preferences.attachCollectionRevisions();
exports.Preferences = Preferences;

const arbitrationStatusValues = {
    'In Progress': [
        'Independent Annotation',
        'Arbitration of Disagreements',
    ],
    'Completed': [
        'Completed',
        'Cancelled',
    ],
};
const arbitrationStatusValuesFlat = [].concat.apply([], Object.values(arbitrationStatusValues));

Arbitrations = new Meteor.Collection('arbitrations');
Schemas.Arbitrations = new SimpleSchema({
    createdAt: SchemaHelpers.createdAt,
    updatedAt: SchemaHelpers.updatedAt,
    assignments: {
        type: Array,
        label: 'Assignments',
        minCount: 2,
    },
    'assignments.$': SchemaHelpers.fromCollection(Assignments),
    arbiterPseudonyms: {
        type: Array,
        label: 'Arbiter Pseudonyms',
        minCount: 2,
    },
    'arbiterPseudonyms.$': {
        type: String,
        label: 'Arbiter Pseudonym',
    },
    task: SchemaHelpers.fromCollection(Tasks),
    data: SchemaHelpers.fromCollection(Data),
    status: {
        type: String,
        label: 'Status',
        allowedValues: arbitrationStatusValuesFlat,
        defaultValue: arbitrationStatusValuesFlat[0],
    },
    maxNumRounds: {
        type: SimpleSchema.Integer,
        label: 'Max Num Rounds',
        min: 0,
        optional: true,
    },
    currentRoundNumber: {
        type: SimpleSchema.Integer,
        label: 'Current Round Number',
        min: 0,
        defaultValue: 0,
    },
    currentAssignment: SchemaHelpers.fromCollection(Assignments, {
        label: 'Current Assignment',
        optional: true,
    }),
});
ensureIndicesForCollection(Arbitrations, ['assignments', 'task', 'data', 'status']);
Arbitrations.helpers({
  taskName() {
    const task = Tasks.findOne(this.task);
    if (!task) return 'Loading ...';
    return task.name;
  },
  patientId() {
    const data = Data.findOne(this.data);
    if (!data) return 'Loading ...';
    const patient = Patients.findOne(data.patient);
    if (!patient) return 'Loading ...';
    return parseInt(patient.id);
  },
  dataPath() {
    const data = Data.findOne(this.data);
    if (!data) return 'Loading ...';
    return data.path;
  },
  arbiterPseudonymForAssignment(assignmentId) {
    const index = this.assignments.indexOf(assignmentId);
    if (index < 0 || index >= this.arbiterPseudonyms.length) return 'Unknown';
    return this.arbiterPseudonyms[index];
  },
  assignmentDocs() {
    const assignmentDocs = this.assignments.map(a => Assignments.findOne(a)).filter(a => !!a);
    if (assignmentDocs.length < this.assignments.length) return false;
    return assignmentDocs;
  },
  currentAssignmentDoc() {
    if (!this.currentAssignment) return false;
    return Assignments.findOne(this.currentAssignment) || false;
  },
  numDaysWaiting() {
    if (this.status == 'Completed' || this.status == 'Cancelled') {
        return 0;
    }
    if (this.status == 'Arbitration of Disagreements') {
        return this.currentAssignmentDoc().numDaysSinceLastModifed();
    }
    const assignmentDocs = this.assignmentDocs();
    const incompleteAssignmentDocs = assignmentDocs.filter(a => a.status !== 'Completed');
    if (incompleteAssignmentDocs.length > 0) {
        return Math.max.apply(null, incompleteAssignmentDocs.map(a => a.numDaysSinceLastModifed()));
    }
    return Math.min.apply(null, assignmentDocs.map(a => a.numDaysSinceLastModifed()));
  },
  currentAssignmentUserNameStatusAndProgressFormatted() {
    const currentAssignmentDoc = this.currentAssignmentDoc();
    if (!currentAssignmentDoc) return '-';
    let formattedOutput = currentAssignmentDoc.userNames() + ' (' + currentAssignmentDoc.status;
    if (currentAssignmentDoc.status === 'In Progress') {
        formattedOutput += ' at ' + currentAssignmentDoc.progress().asPercentage;
    }
    formattedOutput += ')';
    return formattedOutput;
  },
  currentAssignmentUserNameAndStatusFormatted() {
    const currentAssignmentDoc = this.currentAssignmentDoc();
    if (!currentAssignmentDoc) return '-';
    const formattedOutput = currentAssignmentDoc.userNames() + ' (' + currentAssignmentDoc.status + ')';
    return formattedOutput;
  },
  arbiterNamesAndAssignmentArray() {
    const assignmentDocs = this.assignmentDocs();
    if (assignmentDocs === false) return 'Loading ...';
    const arbiterNamesAndAssignmentArray = [];
    try {
        assignmentDocs.forEach((assignment) => {
            const arbiterNames = assignment.userNamesArray();
            if (!arbiterNames) throw false;
            arbiterNamesAndAssignmentArray.push({
                assignment: assignment,
                userNames: arbiterNames.join(', '),
            });
        });
    } catch (error) {
        return false;
    }
    return arbiterNamesAndAssignmentArray;
  },
  arbiterNamesArray() {
    const arbiterNamesAndAssignmentArray = this.arbiterNamesAndAssignmentArray();
    if (arbiterNamesAndAssignmentArray === false) return 'Loading ...';
    return arbiterNamesAndAssignmentArray.map(a => a.userNames);
  },
  arbiterNamesAndPseudonyms() {
    const names = this.arbiterNamesArray();
    if (names === false) return 'Loading ...';
    const namesAndPseudonyms = names.map((name, a) => {
        const pseudonym = this.arbiterPseudonyms[a];
        return name + ' (' + pseudonym + ')';
    }).join(' / ');
    return namesAndPseudonyms;
  },
  arbiterNamesPseudonymsLastModifiedAndStatus() {
    const arbiterNamesAndAssignmentArray = this.arbiterNamesAndAssignmentArray();
    if (arbiterNamesAndAssignmentArray === false) return 'Loading ...';
    return arbiterNamesAndAssignmentArray.map((nameAndAssignment, a) => {
        const pseudonym = this.arbiterPseudonyms[a];
        const lastModifiedFormatted = moment(nameAndAssignment.assignment.lastModified).format('YYYY-MM-DD');
        const currentStatus = nameAndAssignment.assignment.status;
        return nameAndAssignment.userNames + ' (' + currentStatus + '; Last update: ' + lastModifiedFormatted + ')';
    }).join(' / ');
  },
  progressOnIndependentAnnotationArray() {
    const assignmentDocs = this.assignmentDocs();
    if (assignmentDocs === false) return false;
    return assignmentDocs.map(a => a.progressOnIndependentAnnotation().asProportion);
  },
  progressOnIndependentAnnotationFormattedArray() {
    const assignmentDocs = this.assignmentDocs();
    if (assignmentDocs === false) return false;
    return assignmentDocs.map(a => a.progressOnIndependentAnnotation().asPercentage);
  },
  progressOnIndependentAnnotation() {
    const names = this.arbiterNamesArray();
    if (names === false) return 'Loading ...';
    const progressForAssignments = this.progressOnIndependentAnnotationFormattedArray();
    if (progressForAssignments === false) return 'Loading ...';
    const namesAndProgress = names.map((name, a) => {
        const progress = progressForAssignments[a];
        return name + ' (' + progress + ')';
    }).join(' / ');
    return namesAndProgress;
  },
  statusOnIndependentAnnotation(options) {
    const names = this.arbiterNamesArray();
    if (names === false) return 'Loading ...';
    const assignmentDocs = this.assignmentDocs();
    if (assignmentDocs === false) return false;
    const statusForAssignments = assignmentDocs.map(a => a.status);
    const namesAndStatus = names.map((name, a) => {
        const status = statusForAssignments[a];
        return name + ' (' + status + ')';
    }).join(' / ');
    return namesAndStatus;
  },
  isIndependentAnnotationMarkedAsCompletedForAllArbiters() {
    const assignments = this.assignmentDocs();
    if (assignments === false) return false;
    return assignments.every(a => a.isMarkedAsCompleted());
  },
  isIndependentAnnotationComplete() {
    const assignmentDocs = this.assignmentDocs();
    if (assignmentDocs === false) return false;
    return assignmentDocs.every(a => a.isIndependentAnnotationComplete());
  },
  assignmentsMarkedAsCompletedWithIncompleteIndependentAnnotation() {
    const assignmentDocs = this.assignmentDocs();
    if (assignmentDocs === false) return 'Loading ...';
    return assignmentDocs.filter((assignment) => {
        return (
            (assignment.isMarkedAsCompleted())
            && !assignment.isIndependentAnnotationComplete()
        );
    });
  },
  assignmentsNotMarkedAsCompleted() {
    const assignmentDocs = this.assignmentDocs();
    if (assignmentDocs === false) return 'Loading ...';
    return assignmentDocs.filter(assignment => !assignment.isMarkedAsCompleted());
  },
  annotationsCursor(filter, options) {
    filter = filter || {};
    filter = _.extend({}, filter, { assignment: { $in: this.assignments } });
    const annotations = Annotations.find(filter, options);
    return annotations;
  },
  uniqueOpinionsWithGuidelineInstructionsForCase(filter) {
    const arbitrationRevisionsWithRationales = this.revisionsWithRationalesForAnnotations(filter, this.maxNumRounds, false);
    const guidelineInstructionsByLabel = {};
    arbitrationRevisionsWithRationales.forEach((r) => {
        const instructions = r.rationale.instructions || [];
        if (instructions.length == 0) return;
        const label = r.value.label;
        guidelineInstructionsByLabel[label] = guidelineInstructionsByLabel[label] || [];
        instructions.forEach(instruction => guidelineInstructionsByLabel[label].push(instruction._id));
    });
    Object.keys(guidelineInstructionsByLabel).forEach(label => guidelineInstructionsByLabel[label] = _.uniq(guidelineInstructionsByLabel[label]));
    Object.keys(guidelineInstructionsByLabel).forEach((label) => {
        guidelineInstructionsByLabel[label] = guidelineInstructionsByLabel[label].map(instructionId => Instructions.findOne(instructionId));
    });
    return guidelineInstructionsByLabel;
  },
  aggregatedAnnotations(filter, options, roundNumberToEvaluateAgreementFor) {
    roundNumberToEvaluateAgreementFor = !!roundNumberToEvaluateAgreementFor ? roundNumberToEvaluateAgreementFor : 0;
    const assignmentDocs = this.assignmentDocs();
    const aggregatedAnnotations = {
        all: {},
        incomplete: {},
        complete: {
            withAgreement: {},
            withDisagreement: {},
        },
    };
    if (assignmentDocs === false) return aggregatedAnnotations;
    options = options || {};
    options.fields = options.fields || {};
    options.fields = _.extend({}, options.fields, { arbitrationRoundNumber: 1 });
    const annotationDicts = assignmentDocs.map(a => a.annotationsForAgreementComparisonDict(filter, options));
    const annotationDictsMerged = {};
    aggregatedAnnotations.all = annotationDictsMerged;
    annotationDicts.forEach((annotationDict) => {
        Object.keys(annotationDict).forEach((key) => {
            const value = annotationDict[key];
            if (!annotationDictsMerged[key]) {
                annotationDictsMerged[key] = [value];
            }
            else {
                annotationDictsMerged[key].push(value);
            }
        });
    });
    Object.keys(annotationDictsMerged).forEach((key) => {
        const values = annotationDictsMerged[key];
        const isComplete = values.length == this.assignments.length;
        if (isComplete) {
            const uniqueValues = new Set(values.map(value => getLatestComparisonValueFromRoundNumber(value, roundNumberToEvaluateAgreementFor)));
            const hasAgreement = uniqueValues.size == 1;
            if (hasAgreement) {
                aggregatedAnnotations.complete.withAgreement[key] = values;
            }
            else {
                aggregatedAnnotations.complete.withDisagreement[key] = values;
            }
        }
        else {
            aggregatedAnnotations.incomplete[key] = values;
        }
    });
    function getLatestComparisonValueFromRoundNumber(value, roundNumberToEvaluateAgreementFor) {
        let revisions = value.annotation.revisions || [];
        revisions.unshift(value.annotation);
        revisions = revisions.filter((r) => {
            revisionArbitrationRoundNumber = !!r.arbitrationRoundNumber ? r.arbitrationRoundNumber : 0;
            return revisionArbitrationRoundNumber <= roundNumberToEvaluateAgreementFor;
        });
        revisions.sort(byLastModifiedDateLatestFirst);
        const revision = revisions[0];
        if (!revision) return;
        return revision.value.label;
    }
    return aggregatedAnnotations;
  },
  revisionsWithRationalesForAnnotations(annotationFilter, arbitrationRoundNumber, expandInstructionAndConditionIds) {
    const fields = {
        rationale: 1,
        user: 1,
        assignment: 1,
        arbitrationRoundNumber: 1,
        lastModified: 1,
    };
    const annotations = Object.values(this.aggregatedAnnotations(annotationFilter, { fields }, arbitrationRoundNumber).all)[0] || [];
    revisions = [].concat.apply([], annotations.map(a => a.annotation.allRevisions())).filter(r => !!r.rationale);
    revisions.sort(byLastModifiedDateLatestFirst);
    const alreadyEncountered = {};
    revisions = revisions.filter((r) => {
        let roundNumber = r.arbitrationRoundNumber;
        roundNumber = !!roundNumber ? roundNumber : 0;
        const key = 'annotation_' + r._id + '_round_' + roundNumber + '_decision_' + r.value.label;
        if (alreadyEncountered[key]) return false;
        alreadyEncountered[key] = true;
        return true;
    });
    if (expandInstructionAndConditionIds) {
        revisions.forEach((r) => {
            if (!r.rationale.instructions) return;
            r.rationale.instructions.forEach((i) => {
                i.doc = Instructions.findOne(i._id);
                if (!i.conditions) return;
                i.conditions.forEach((c) => {
                    c.doc = Propositions.findOne(c._id);
                    const beliefs = {
                        '-1': {
                            key: 'no',
                            humanReadable: 'No',
                            icon: 'fa-times',
                        },
                        '-0.5': {
                            key: 'unlikely',
                            humanReadable: 'Unlikely',
                            icon: 'fa-times',
                        },
                        '0.5': {
                            key: 'likely',
                            humanReadable: 'Likely',
                            icon: 'fa-check',
                        },
                        '1': {
                            key: 'yes',
                            humanReadable: 'Yes',
                            icon: 'fa-check',
                        },
                    }
                    let beliefDict = beliefs['' + c.belief.level];
                    if (!beliefDict) {
                        beliefDict = {
                            key: 'unknown',
                            humanReadable: 'Unknown',
                            icon: 'fa-question',
                        };
                    }
                    c.belief = _.extend({}, c.belief, beliefDict);
                });
            });
        });
    }
    return revisions;
  },
  agreementRate() {
    const aggregatedAnnotations = this.aggregatedAnnotations({}, {}, this.currentRoundNumber);
    const numCompletedAnnotationsWithAgreement = Object.keys(aggregatedAnnotations.complete.withAgreement).length;
    const numCompletedAnnotationsWithDisagreement = Object.keys(aggregatedAnnotations.complete.withDisagreement).length;
    const numCompletedAnnotations = numCompletedAnnotationsWithAgreement + numCompletedAnnotationsWithDisagreement;
    if (numCompletedAnnotations == 0) return 0;
    return numCompletedAnnotationsWithAgreement / numCompletedAnnotations;
  },
  agreementRateFormatted() {
    return formatAsPercentage(this.agreementRate());
  },
  sendReminders(options) {
    options = options || {};
    let message;
    let alertFn, confirmFn, chooseFn;
    if (options.outputToConsole || options.suppressConfirmation) {
        alertFn = //console.log;
        confirmFn = (question, okCallback) => {
            //console.log(question);
            //console.log('Assuming the user is OK with this.');
            okCallback();
        };
        chooseFn = (question, options, callback) => {
            //console.log(question);
            options = options || [];
            const defaultValue = options.filter(o => o.default)[0];
            if (defaultValue === undefined) {
                //console.log('No default value defined. Stopping here ...');
            }
            //console.log('Assuming the user chose the default value: ' + defaultValue);
            callback(defaultValue);
        };
    }
    else {
        alertFn = (message, style) => {
            swal('', message, style || 'info');
        };
        confirmFn = (question, okCallback) => {
            swal({
                title: 'Confirmation required',
                text: question,
                showCancelButton: true,
            })
            .then((result) => {
                if (result.dismiss) return;
                okCallback();
            });
        };
        chooseFn = (question, options, callback) => {
            options = options || [];
            const inputOptions = {};
            options.forEach((option) => {
                inputOptions[option.value] = option.label;
            });
            swal({
                title: 'Selection required',
                text: question,
                showCancelButton: true,
                input: 'select',
                inputOptions: inputOptions,
                inputPlaceholder: 'Select one',
                inputValidator: (value) => {
                    return !value && 'You need to select an option!'
                }
            })
            .then((result) => {
                if (result.dismiss) return;
                callback(result.value);
            });
        };
    }
    const assignmentsNotMarkedAsCompleted = this.assignmentsNotMarkedAsCompleted();
    if (assignmentsNotMarkedAsCompleted.length === 0) {
        alertFn('Currently, none of the adjudicators have any unfinished tasks in their queues. No need to remind anyone!', 'info');
    }
    else {
        const usersToBeReminded = assignmentsNotMarkedAsCompleted.map(a => a.userNames()).join(', ');
        confirmFn('Should I send email reminders to the following adjudicator(s)? ' + usersToBeReminded, () => {
            assignmentsNotMarkedAsCompleted.forEach((assignment) => {
                const isReminder = true;
                if (!assignment.remindersDisabled) {
                    notifyAssignees(assignment, Meteor.userId(), isReminder);
                }
            });
            alertFn('Done! You are also in CC, so you can follow up manually if necessary.', 'success');
        });
    }
  },
  update(options) {
    options = options || {};
    let message;
    let alertFn, confirmFn, chooseFn;
    if (options.outputToConsole || options.suppressConfirmation) {
        alertFn = //console.log;
        confirmFn = (question, okCallback) => {
            //console.log(question);
            //console.log('Assuming the user is OK with this.');
            okCallback();
        };
        chooseFn = (question, options, callback) => {
            //console.log(question);
            options = options || [];
            const defaultValue = options.filter(o => o.default)[0];
            if (defaultValue === undefined) {
                //console.log('No default value defined. Stopping here ...');
            }
            //console.log('Assuming the user chose the default value: ' + defaultValue);
            callback(defaultValue);
        };
    }
    else {
        alertFn = (message, style) => {
            swal('', message, style || 'info');
        };
        confirmFn = (question, okCallback) => {
            swal({
                title: 'Confirmation required',
                text: question,
                showCancelButton: true,
            })
            .then((result) => {
                if (result.dismiss) return;
                okCallback();
            });
        };
        chooseFn = (question, options, callback) => {
            options = options || [];
            const inputOptions = {};
            options.forEach((option) => {
                inputOptions[option.value] = option.label;
            });
            swal({
                title: 'Selection required',
                text: question,
                showCancelButton: true,
                input: 'select',
                inputOptions: inputOptions,
                inputPlaceholder: 'Select one',
                inputValidator: (value) => {
                    return !value && 'You need to select an option!'
                }
            })
            .then((result) => {
                if (result.dismiss) return;
                callback(result.value);
            });
        };
    }
    const setNextArbiter = (options) => {
        options = options || {};
        message = options.roundCompletedMessage;
        if (this.agreementRate() >= 1.0) {
            message += ' All annotations are in perfect agreement. Should I mark this adjudication as complete?';
            confirmFn(message, () => {
                Arbitrations.update(this._id, { $set: { status: 'Completed' } }, (error, numArbitrations) => {
                    if (error) {
                        alertFn(error.message, 'error');
                        return;
                    }
                    if (numArbitrations == 0) {
                        alertFn('Adjudication could not be updated. Please contact the administrator for advice.', 'warning');
                        return;
                    }
                    alertFn('Success! The adjudication has been marked as complete.', 'success');
                });
            });
        }
        else if (this.currentRoundNumber >= this.maxNumRounds) {
            message += ' This arbitration has now reached its limit of ' + this.maxNumRounds + ' round(s). Should I mark this adjudication as complete?';
            confirmFn(message, () => {
                Arbitrations.update(this._id, { $set: { status: 'Completed' } }, (error, numArbitrations) => {
                    if (error) {
                        alertFn(error.message, 'error');
                        return;
                    }
                    if (numArbitrations == 0) {
                        alertFn('Adjudication could not be updated. Please contact the administrator for advice.', 'warning');
                        return;
                    }
                    alertFn('Success! The adjudication has been marked as complete.', 'success');
                });
            });
        }
        else {
            // COMMENTED OUT BECAUSE THE AGREEMENT RATE IS
            // CURRENTLY UNAVAILABLE IN THE ARBITRATION DASHBOARD
            // ' The overall agreement rate is ' + this.agreementRateFormatted() + '. ' + 
            message = ' ' + options.shouldNextRoundBeInitiated;
            confirmFn(message, () => {
                const arbitrationModifier = {
                    status: 'Arbitration of Disagreements',
                };
                arbiterOptions = this.arbiterNamesAndAssignmentArray().map((arbiterNamesAndAssignment, a) => {
                    return {
                        label: arbiterNamesAndAssignment.userNames,
                        value: arbiterNamesAndAssignment.assignment._id,
                        default: a === 0,
                    };
                });
                chooseFn(options.whichArbiterShouldGoNext, arbiterOptions, (assignmentId) => {
                    const assignment = Assignments.findOne(assignmentId);
                    const arbiterName = assignment.userNames();
                    confirmFn(options.shouldNextArbitrationTaskBeAssignedTo + ' ' + arbiterName + '?', () => {
                        const roundNumber = parseInt(this.currentRoundNumber) + 1;
                        arbitrationModifier.currentAssignment = assignmentId;
                        arbitrationModifier.currentRoundNumber = roundNumber;
                        Arbitrations.update(this._id, { $set: arbitrationModifier }, (error, numArbitrations) => {
                            if (error) {
                                alertFn(error.message, 'error');
                                return;
                            }
                            if (numArbitrations == 0) {
                                alertFn('Adjudication could not be updated. Please contact the administrator for advice.', 'error');
                                return;
                            }
                            const assignmentModifier = {
                                status: 'Pending',
                                arbitration: this._id,
                                arbitrationRoundNumber: roundNumber,
                            };
                            Assignments.update(assignmentId, { $set: assignmentModifier }, (error, numAssignments) => {
                                if (error) {
                                    alertFn(error.message, 'error');
                                    return;
                                }
                                if (numAssignments == 0) {
                                    alertFn('Assignment could not be set into pending status. Please contact the administrator for advice.', 'error');
                                    return;
                                }
                                alertFn(options.nextRoundSuccessfullyInitiated + ' ' + arbiterName + '.', 'success');
                            });
                        });
                    });
                });
            });
        }
    }
    if (this.status == 'Independent Annotation') {
        if (!this.isIndependentAnnotationMarkedAsCompletedForAllArbiters()) {
            message = 'Independent annotation is not yet complete.';
            const assignmentsToResetToInProgress = this.assignmentsMarkedAsCompletedWithIncompleteIndependentAnnotation();
            const numAssignmentsToReset = assignmentsToResetToInProgress.length;
            if (numAssignmentsToReset > 0) {
                message += ' There are ' + numAssignmentsToReset + ' assignments marked as completed which are not complete yet. Should I reset those assignments to in-progress status?';
                confirmFn(message, () => {
                    assignmentsToResetToInProgress.forEach((assignment) => {
                        Assignments.update(assignment._id, { $set: { status: 'In Progress' } });
                    });
                    alertFn(numAssignmentsToReset + ' assignments were reset to in-progress status.', 'success');
                });
            }
            else {
                message += ' Nothing to do at this point except for waiting.';
                alertFn(message, 'info');
            }
        }
        else {
            setNextArbiter({
                roundCompletedMessage: 'Independent annotation has been completed.',
                shouldNextRoundBeInitiated: 'Should I trigger the arbitration of disagreements?',
                shouldNextArbitrationTaskBeAssignedTo: 'Should I assign the first adjudication pass to',
                whichArbiterShouldGoNext: 'Which adjudicator should go first?',
                nextRoundSuccessfullyInitiated: 'Arbitration of disagreements has been triggered and the first adjudication pass has been assigned to',
            });
        }
    }
    else if (this.status == 'Arbitration of Disagreements') {
        if (!this.currentAssignmentDoc().isMarkedAsCompleted()) {
            message = 'The current adjudicator has not completed her/his pass yet. Nothing to do at this point except for waiting.';
            alertFn(message, 'info');
        }
        else {
            setNextArbiter({
                roundCompletedMessage: 'The current adjudicator has completed her/his pass.',
                shouldNextRoundBeInitiated: 'Should I trigger the next adjudication pass?',
                shouldNextArbitrationTaskBeAssignedTo: 'Should I assign the next adjudication pass to',
                whichArbiterShouldGoNext: 'Which adjudicator should go next?',
                nextRoundSuccessfullyInitiated: 'The next adjudication pass has been assigned to',
            });
        }
    }
  },
  cancel(options) {
    options = options || {};
    let alertFn, confirmFn, chooseFn;
    if (options.outputToConsole || options.suppressConfirmation) {
        alertFn = //console.log;
        confirmFn = (question, okCallback) => {
            //console.log(question);
            //console.log('Assuming the user is OK with this.');
            okCallback();
        };
        chooseFn = (question, options, callback) => {
            //console.log(question);
            options = options || [];
            const defaultValue = options.filter(o => o.default)[0];
            if (defaultValue === undefined) {
                //console.log('No default value defined. Stopping here ...');
            }
            //console.log('Assuming the user chose the default value: ' + defaultValue);
            callback(defaultValue);
        };
    }
    else {
        alertFn = (message, style) => {
            swal('', message, style || 'info');
        };
        confirmFn = (question, okCallback) => {
            swal({
                title: 'Confirmation required',
                text: question,
                showCancelButton: true,
            })
            .then((result) => {
                if (result.dismiss) return;
                okCallback();
            });
        };
        chooseFn = (question, options, callback) => {
            options = options || [];
            const inputOptions = {};
            options.forEach((option) => {
                inputOptions[option.value] = option.label;
            });
            swal({
                title: 'Selection required',
                text: question,
                showCancelButton: true,
                input: 'select',
                inputOptions: inputOptions,
                inputPlaceholder: 'Select one',
                inputValidator: (value) => {
                    return !value && 'You need to select an option!'
                }
            })
            .then((result) => {
                if (result.dismiss) return;
                callback(result.value);
            });
        };
    }
    confirmFn('Are you sure you want to cancel this adjudication panel? This action is hard to revert.', () => {
        Arbitrations.update(this._id, { $set: { status: 'Cancelled' } }, (error, numArbitrations) => {
            if (error) {
                alertFn(error.message, 'error');
                return;
            }
            if (numArbitrations == 0) {
                alertFn('Adjudication could not be updated. Please contact the administrator for advice.', 'warning');
                return;
            }
            alertFn('Success! The adjudication has been cancelled.', 'success');
        });
    });
  },
});
Arbitrations.attachSchema(Schemas.Arbitrations);
Arbitrations.permit(['insert', 'update', 'remove']).ifHasRole('admin').allowInClientCode();
Arbitrations.attachCollectionRevisions();
exports.Arbitrations = Arbitrations;

Meteor.users.attachCollectionRevisions();

TaskNames = new Meteor.Collection('tasknames');
//Schemas.TaskNames = new SimpleSchema({
//    createdAt: SchemaHelpers.createdAt,
//    updatedAt: SchemaHelpers.updatedAt,
//    text: {
//        type: String,
//        label: 'TaskName',
//    }, 
//    // users: {
//    //     type: Array,
//    //     label: 'Users',
//    //     minCount: 0,
//    // },
//    // 'users.$': SchemaHelpers.fromCollection(Meteor.users),
//    //task: SchemaHelpers.fromCollection(Tasks, {
//    //    optional: true,
//    //}),
//    
//});
//
//TaskNames.attachSchema(Schemas.TaskNames);
TaskNames.attachCollectionRevisions();
exports.TaskNames = TaskNames;

// Documentation: https://github.com/yogiben/meteor-admin
// The admin management page
AdminConfig = {
    name: 'crowdEEG',
    skin: 'blue',
    autoForm: {
        omitFields: [
            'createdAt',
            'updatedAt',
        ],
    },
    collections: {
        Patients: {
            icon: 'user',
            collectionObject: Patients,
            tableColumns: [
                { label: 'Pt #', name: 'id' },
                { label: 'Age (yrs)', name: 'age' },
                { label: 'Sex', name: 'sex' },
                { label: 'Current AEDs', name: 'currentAEDs' },
                { label: 'Regularly take medication?', name: 'medicationIntakeIsRegular' },
            ],
        },
        Recordings: {
            icon: 'file',
            collectionObject: Data,
            tableColumns: [
                { label: 'Name', name: 'name' },
                { label: 'Type', name: 'type' },
                { label: 'Path', name: 'path' },
            ],
            omitFields: [ 'metadata' ],
            showEditColumn: true,
            showDelColumn: true,
        },
        Tasks: {
            icon: 'cog',
            collectionObject: Tasks,
            tableColumns: [
                { label: 'Name', name: 'name' },
                { label: 'Annotator', name: 'annotator' },
            ],
            // omitFields: [ 'annotatorConfig' ],
            showEditColumn: true,
            showDelColumn: true,
        },
        // Guidelines: {
        //     icon: 'list-ul',
        //     collectionObject: Guidelines,
        //     tableColumns: [
        //         { label: 'Name', name: 'name' },
        //         { label: 'Version', name: 'version' },
        //     ],
        // },
        // Instructions: {
        //     icon: 'sticky-note',
        //     collectionObject: Instructions,
        //     tableColumns: [
        //         { label: 'Text', name: 'text' },
        //     ],
        // },
        // Propositions: {
        //     icon: 'question-circle',
        //     collectionObject: Propositions,
        //     tableColumns: [
        //         { label: 'Description', name: 'description' },
        //     ],
        // },
        Assignments: {
            icon: 'tasks',
            collectionObject: Assignments,
            tableColumns: [
                { label: 'Assignee ID', name: 'users' },
                { label: 'Assignee Name', name: 'userNames()' },
                { label: 'Task ID', name: 'task' },
                { label: 'Task Name', name: 'taskName()' },
                { label: 'Data IDs', name: 'dataFiles' },
                { label: 'Data Path', name: 'dataPath()' },
                { label: 'Status', name: 'status' },
                { label: 'Annotations Imported', name: 'annotationsImported' },
            ],
        },
        // Arbitrations: {
        //     icon: 'gavel',
        //     collectionObject: Arbitrations,
        //     tableColumns: [
        //         { label: 'Data ID', name: 'data' },
        //         { label: 'Data Path', name: 'dataPath()' },
        //         { label: 'Task ID', name: 'task' },
        //         { label: 'Task Name', name: 'taskName()' },
        //         { label: 'Status', name: 'status' },
        //         { label: 'Current Round Number', name: 'currentRoundNumber' },
        //         { label: 'Max Num Rounds', name: 'maxNumRounds' },
        //     ],
        // },
    },
};

//function to read .environment file from platforma and return the string in i 
// File upload schema initializations

env_p = new Promise ((resolve,reject)=>{
    // Both the client and the server gets a copy of the collections file, so we need to handle both cases separately, as the backend cannot call another backend process through
    // Meteor's websocket based API.
    if (Meteor.isClient) {
        Meteor.call("get.environment.edf.dir", null, (error, results) => {
            if (error){
                throw new Error("Could not get environment edf_dir because of " + error);
            }
            return resolve(results);
        })
        
    } else {
        return resolve(process.env.EDF_DIR);
    }
   
})

// We chain the then blocks, as we cannot instantiate EDFFile before we have edf_dir
exports.EDFFile = env_p.then(result =>{
        var edf_dir = result;
    
        console.log(edf_dir);

        const EDFFile = new FilesCollection({
            debug: true,
            collectionName: 'EDFFile',
            allowClientCode: false, // Disallow remove files from Client
            storagePath: edf_dir + '/uploaded'//'/home/youngjae/platform/galaxy-app/edf/uploaded/'
        });

        // console.log(EDFFile);

        return EDFFile;
        
    })
    .catch(error => console.log(error));


Meteor.startup(() => {
    AdminTables.Users.options.columns.splice(1, 0, { title: 'Username', data: 'username' });
    AdminTables.Users.options.columns.splice(3, 0, { title: 'Online', data: 'status.online' });
    AdminTables.Users.options.columns.splice(4, 0, { title: 'Last Login', data: 'status.lastLogin.date' });
    AdminTables.Users.options.columns.splice(5, 0, { title: 'Idle', data: 'status.idle' });
    AdminTables.Users.options.columns.splice(6, 0, { title: 'Last Active', data: 'status.lastActivity' });
});