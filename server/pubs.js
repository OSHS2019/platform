import { TaskNames, Patients, Data, Tasks, Guidelines, Instructions, Propositions, Assignments, Annotations, Arbitrations, Preferences, PreferencesFiles, AlignmentFiles, AnnotationFiles } from '/collections'

const annotationFields = {
   'value.metadata.annotatorConfig': 0,
   'value.metadata.graph': 0,
}

Meteor.publish('all', function() {
    // we want people to be able to access the preferences dir in the annotator (there is no update or delete there)
    if (!Roles.userIsInRole(this.userId, 'admin')) return [PreferencesFiles.find({})];
    return [
        Meteor.users.find({}),
        Patients.find({}),
        Data.find({}),
        Tasks.find({}),
        Guidelines.find({}),
        Instructions.find({}),
        Propositions.find({}),
        Assignments.find({}),
        Arbitrations.find({}),
        PreferencesFiles.find({}),
        AlignmentFiles.find({}),
        AnnotationFiles.find({}),
        TaskNames.find({})
    ]
});

Meteor.publish('allAnnotationsGlobalPerDataObject', function() {
    if (!Roles.userIsInRole(this.userId, 'admin')) return [];
    return [
        Annotations.find({
            type: { $ne: 'SIGNAL_ANNOTATION' },
        }, { fields: { 'value.metadata': 0 } }),
    ]
});

Meteor.publish('annotationFiles', function() {
    return [
        AnnotationFiles.find({})
    ]
});

Meteor.publish('roles', function () {
    return Meteor.roles.find({});
});

Meteor.publishComposite('assignments', {
    find() {
        return Assignments.find({ users: this.userId });
    },
    children: [
        {
            find(assignment) {
                //console.log('assignments', assignment);
                let queryArray = assignment.dataFiles.map((dataId) => { return { _id: dataId }; });
                return Data.find({ $or: queryArray });
            },
            children: [
                {
                    find(data, assignment) {
                        return Patients.find(data.patient, { fields: { name: 0 } });
                    }
                },
            ]
        },
        {
            find(assignment) {
                return Arbitrations.find({ assignments: assignment._id });
            },
        }
    ]
});

Meteor.publishComposite('assignment', function(assignmentId) {
    const assignment = Assignments.findOne({ _id: assignmentId, users: this.userId });
    if (!assignment) return;
    let assignmentIds = [ assignmentId ];
    let arbitrationIds = [];
    assignment.allLeafAssignments().forEach(a => assignmentIds.push(a._id));
    assignmentIds.forEach((assignmentId) => {
        const assignment = Assignments.findOne(assignmentId);
        if (!assignment) return;
        const preClassificationAssignment = assignment.preClassificationAssignment()
        if (!preClassificationAssignment) return;
        assignmentIds.push(preClassificationAssignment._id);
        const preClassificationAnnotations = assignment.preClassificationAnnotations();
        if (!preClassificationAnnotations) return;
        preClassificationAnnotations.forEach((annotation) => {
            const metadata = annotation.value.metadata || {};
            const prediction = metadata.prediction || {};
            const referenceStandardArbitrationId = prediction.referenceStandardArbitrationId;
            if (referenceStandardArbitrationId) {
                arbitrationIds.push(referenceStandardArbitrationId);
            }
        });
    });
    assignmentIds.forEach((assignmentId) => {
        Arbitrations.find({ assignments: assignmentId }).fetch().forEach(arbitration => arbitrationIds.push(arbitration._id));
    });
    arbitrationIds = _.uniq(arbitrationIds);
    arbitrationIds.forEach((arbitrationId) => {
        Arbitrations.findOne(arbitrationId).assignments.forEach(assignment => assignmentIds.push(assignment));
    });
    assignmentIds = _.uniq(assignmentIds);
    return {
        find() {
            return Assignments.find({ _id: { $in: assignmentIds } });
        }, 
        children: [
            {
                find(assignment) {
                    return Arbitrations.find({ assignments: assignment._id });
                },
            },
            {
                find(assignment) {
                    return Annotations.find({ assignment: assignment._id }, { fields: annotationFields });
                },
                children: [
                    {
                        find(annotation, assignment) {
                            return Meteor.users.find({ _id: annotation.user }, { fields: { _id: 1, username: 1 } });
                        }
                    }
                ]
            },
            {
                find(assignment) {
                    return Preferences.find({ assignment: assignment._id });
                },
            },
            {
                find(assignment) {
                    return Tasks.find(assignment.task);
                },
                children: [
                    {
                        find(task, assignment) {
                            if (task.guideline) return Guidelines.find(task.guideline);
                        }
                    },
                    {
                        find(task, assignment) {
                            if (task.guideline) return Instructions.find({ guideline: task.guideline });
                        },
                        children: [
                            {
                                find(instruction, task, assignment) {
                                    const propositionIds = instruction.conditions.concat(instruction.actions);
                                    if (propositionIds.length > 0) return Propositions.find({ _id: { $in: propositionIds } });
                                }
                            },
                        ]
                    },
                    {
                        find(task, assignment) {
                            const annotatorConfig = task.annotatorConfig || {};
                            const preClassificationConfig = annotatorConfig.preClassification || {};
                            const preClassificationSourceConfig = preClassificationConfig.source || {};
                            if (preClassificationSourceConfig.userId) {
                                return Meteor.users.find(preClassificationSourceConfig.userId);
                            }
                            if (task.guideline) return Guidelines.find(task.guideline);
                        }
                    },
                ]
            },
            {
                find(assignment) {
                    //console.log('assignment', assignment);
                    let queryArray = assignment.dataFiles.map((dataId) => { return { _id: dataId }; });
                    return Data.find({ $or: queryArray });
                },
                children: [
                    {
                        find(data, assignment) {
                            return Patients.find(data.patient, { fields: { name: 0 } });
                        }
                    },
                ]
            },
        ]
    };
});
